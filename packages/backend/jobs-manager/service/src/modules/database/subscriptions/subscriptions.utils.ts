import { Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parse } from 'yaml';
import {
  executeDsl,
  prepareContext,
} from '../../findings/commands/automation-dsl-interpreter';
import { FindingCommand } from '../../findings/commands/findings.command';
import { Finding } from '../../findings/findings.service';
import { ConfigService } from '../admin/config/config.service';
import { CustomJobsService } from '../custom-jobs/custom-jobs.service';
import { JobFactoryUtils } from '../jobs/jobs.factory';
import { CronSubscription } from './cron-subscriptions/cron-subscriptions.model';
import {
  EventSubscription,
  JobCondition,
  JobParameter,
} from './event-subscriptions/event-subscriptions.model';
import { Subscription } from './subscriptions.type';

export class SubscriptionsUtils {
  public static readonly conditionOperators = [
    'equals',
    'gte',
    'gt',
    'lte',
    'lt',
    'contains',
    'contains_i',
    'startsWith',
    'startsWith_i',
    'endsWith',
    'endsWith_i',
    'equals_i',
  ].flatMap((v) => [v, `not_${v}`]);

  public static async getParametersForCustomJobSubscription(
    sub: Subscription,
    logger: Logger,
    customJobsService: CustomJobsService,
    configService: ConfigService,
  ): Promise<JobParameter[] | undefined> {
    const customJobNameParam = sub.jobName;

    if (!customJobNameParam) {
      logger.error(
        `Invalid subscription <${sub.name}> : The subscription has a wrong job name ${customJobNameParam}.`,
      );
      return undefined;
    }

    if (typeof customJobNameParam !== 'string') {
      logger.error(
        `Invalid subscription <${sub.name}> : The parameter customJobName's value must be of type string.`,
      );
      return undefined;
    }

    const customJobEntry = await customJobsService.getPickByName<
      '_id' | 'jobPodConfigId' | 'name'
    >(customJobNameParam, ['_id', 'jobPodConfigId', 'name']);

    if (!customJobEntry) {
      logger.error(
        `Invalid subscription <${sub.name}> : A CustomJob named <${customJobNameParam}> was not found.`,
      );
      return undefined;
    }

    let jobParameters: JobParameter[] =
      JobFactoryUtils.setupCustomJobParameters(
        customJobEntry,
        sub.jobParameters,
      );
    const jpConf = await JobFactoryUtils.getCustomJobPodConfig(
      customJobEntry,
      configService,
    );
    jobParameters = JobFactoryUtils.setupJobPodConfigParameters(
      jobParameters,
      jpConf,
    );

    return jobParameters;
  }

  private static stringReplaceValueForFinding(value: string, finding: Finding) {
    // https://regex101.com/r/9yy2OH/1
    const expressionRegex = /^\s*\$\{\s*([^\s]+)\s*\}\s*$/i;
    const match = value.match(expressionRegex);

    if (!match || match.length <= 1) {
      return value;
    }

    // Would extract domainName from ${ domainName }
    const expression = match[1].toLowerCase();
    const ctx = prepareContext(finding);
    return executeDsl(expression, ctx) || '';
  }

  /**
   * Identifies the matching Finding output variable to a ${paramName} tag, if it exists
   * @param value The parameter or condition operand that may be a ${paramName} string
   * @param finding The finding we are currently reacting to
   * @returns The finding's referenced output value if it exits, the given *value* otherwise
   */
  public static replaceValueIfReferingToFinding<T>(value: T, finding: Finding) {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return value;
    }

    let output: T;

    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; ++i) {
        if (typeof value[i] !== 'string') continue;
        value[i] = SubscriptionsUtils.stringReplaceValueForFinding(
          value[i],
          finding,
        );
      }
      output = value;
    } else {
      output = SubscriptionsUtils.stringReplaceValueForFinding(value, finding);
    }

    return output;
  }

  /**
   * Evaluates a JobCondition to a boolean value.
   * @param condition A JobCondition object to be evaluated
   * @returns true if the condition is true, false otherwise
   */
  public static evaluateCondition(condition: JobCondition): boolean {
    let operator = condition.operator;
    let lhs = condition.lhs;
    let rhs = condition.rhs;

    if (
      lhs === null ||
      lhs === undefined ||
      rhs === null ||
      rhs === undefined ||
      operator === null ||
      operator === undefined
    )
      return false;

    // Making the case incensitive string checks all lowercase
    if (operator.endsWith('_i')) {
      if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
      lhs = lhs.toLowerCase();
      rhs = rhs.toLowerCase();
      operator = operator.substring(0, operator.length - 2);
    }
    let negate = false;
    if (operator.startsWith('not_')) {
      operator = operator.substring(4);
      negate = true;
    }

    let result = false;

    // equals are soft to allow for easier type match for the users
    // no support for regex as I did not find an easy way to prevent ReDoS
    // https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
    switch (operator) {
      case 'equals': {
        result = lhs == rhs;
        break;
      }
      case 'gte': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        result = lhs >= rhs;
        break;
      }
      case 'gt': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        result = lhs > rhs;
        break;
      }
      case 'lte': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        result = lhs <= rhs;
        break;
      }
      case 'lt': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        result = lhs < rhs;
        break;
      }
      case 'contains': {
        if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
        result = lhs.includes(rhs);
        break;
      }
      case 'startsWith': {
        if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
        result = lhs.startsWith(rhs);
        break;
      }
      case 'endsWith': {
        if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
        result = lhs.endsWith(rhs);
        break;
      }
      default: {
        return false;
      }
    }

    return negate ? !result : result;
  }

  /**
   * Validates that all the job's conditions are met
   * If even one condition is invalid, the job should not be executed
   * and we should go straight to the next subscription
   * @param jobConditions The job's conditions to validate
   * @param command The command
   * @returns true if all the subscription's conditions matched
   */
  public static shouldExecute<T extends FindingCommand>(
    isEnabled: boolean,
    jobConditions: JobCondition[],
    command: T,
  ) {
    return SubscriptionsUtils.shouldExecuteFromFinding(
      isEnabled,
      jobConditions,
      command.finding,
    );
  }

  public static shouldExecuteFromFinding(
    isEnabled: boolean,
    jobConditions: JobCondition[],
    finding: Finding,
  ) {
    // For backward compatibility, if isEnabled is undefined, we consider it enabled.
    // This accommodates legacy models where the 'isEnabled' flag, absent initially,
    // is represented by 'undefined' instead of 'true'.
    if (isEnabled === false) return false;

    let allConditionsMatch = true;
    for (const condition of jobConditions ?? []) {
      condition.lhs = SubscriptionsUtils.replaceValueIfReferingToFinding<
        string | boolean | number
      >(condition.lhs, finding);
      condition.rhs = SubscriptionsUtils.replaceValueIfReferingToFinding<
        string | boolean | number
      >(condition.rhs, finding);

      if (!SubscriptionsUtils.evaluateCondition(condition)) {
        allConditionsMatch = false;
        break;
      }
    }
    return allConditionsMatch;
  }

  /**
   * Validates that the path + file name exists and is valid
   * @param path a folder path ending with a '/'
   * @param fileName must be `basename(fileName)` to make sure that it is a proper file name without path
   * @returns
   */
  private static validateSubscriptionFileFullPath(
    path: string,
    fileName: string,
  ): boolean {
    const fileSplit = fileName.split('.');
    if (fileSplit.length <= 1) return false;

    const ext = fileSplit[fileSplit.length - 1].toLowerCase();
    if (ext !== 'yml' && ext !== 'yaml') return false;

    if (!existsSync(path + fileName)) return false;

    return true;
  }

  public static readEventSubscriptionFile(
    path: string,
    fileName: string,
  ): EventSubscription | null {
    const baseName = basename(fileName);
    if (!SubscriptionsUtils.validateSubscriptionFileFullPath(path, baseName))
      return null;

    const file_content = readFileSync(path + baseName).toString();
    let sub: EventSubscription | null = null;
    try {
      sub = SubscriptionsUtils.parseEventSubscriptionYaml(file_content);
      sub.file = baseName;
    } catch (err) {
      console.log(err);
    }
    return sub;
  }

  public static readCronSubscriptionFile(
    path: string,
    fileName: string,
  ): CronSubscription | null {
    const baseName = basename(fileName);
    if (!SubscriptionsUtils.validateSubscriptionFileFullPath(path, baseName))
      return null;

    const file_content = readFileSync(path + baseName).toString();
    let sub: CronSubscription | null = null;
    try {
      sub = SubscriptionsUtils.parseCronSubscriptionYaml(file_content);
      sub.file = baseName;
    } catch (err) {
      console.log(err);
    }
    return sub;
  }

  public static parseCronSubscriptionYaml(
    subscriptionYaml: string,
  ): CronSubscription {
    const subYamlJson = parse(subscriptionYaml);

    const params = [];
    if (subYamlJson.job && subYamlJson.job.parameters) {
      for (const param of subYamlJson.job.parameters) {
        params.push(param);
      }
    }

    const conditions = [];
    if (subYamlJson.conditions) {
      for (const condition of subYamlJson.conditions) {
        conditions.push(condition);
      }
    }

    const sub: CronSubscription = {
      name: subYamlJson.name,
      isEnabled: true,
      input: subYamlJson.input ? subYamlJson.input : null,
      cronExpression: subYamlJson.cronExpression,
      builtIn: true,
      jobName: subYamlJson.job.name,
      projectId: null,
      jobParameters: params,
      conditions: conditions,
    };

    return sub;
  }

  public static parseEventSubscriptionYaml(
    subscriptionYaml: string,
  ): EventSubscription {
    const subYamlJson = parse(subscriptionYaml);

    const params = [];
    if (subYamlJson.job && subYamlJson.job.parameters) {
      for (const param of subYamlJson.job.parameters) {
        params.push(param);
      }
    }

    const conditions = [];
    if (subYamlJson.conditions) {
      for (const condition of subYamlJson.conditions) {
        conditions.push(condition);
      }
    }

    const sub: EventSubscription = {
      name: subYamlJson.name,
      isEnabled: true,
      finding: subYamlJson.finding,
      jobName: subYamlJson.job.name,
      cooldown: subYamlJson.cooldown,
      projectId: null,
      jobParameters: params,
      conditions: conditions,
      builtIn: true,
    };

    return sub;
  }
}
