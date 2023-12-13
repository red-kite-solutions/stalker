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
import {
  EventSubscription,
  JobCondition,
  JobParameter,
} from './event-subscriptions/event-subscriptions.model';
import { Subscription } from './subscriptions.type';

export class SubscriptionsUtils {
  public static async getParametersForCustomJobSubscription(
    sub: Subscription,
    logger: Logger,
    customJobsService: CustomJobsService,
    configService: ConfigService,
  ): Promise<JobParameter[] | undefined> {
    const customJobNameParam = sub.jobParameters.find(
      (param) => param.name.toLowerCase() === 'customjobname',
    );

    if (!customJobNameParam) {
      logger.error(
        `Invalid subscription <${sub.name}> : The subscription has the job.name CustomJob, but the parameter customJobName is missing.`,
      );
      return undefined;
    }

    if (typeof customJobNameParam.value !== 'string') {
      logger.error(
        `Invalid subscription <${sub.name}> : The parameter customJobName's value must be of type string.`,
      );
      return undefined;
    }

    const customJobEntry = await customJobsService.getByName(
      customJobNameParam.value,
    );

    if (!customJobEntry) {
      logger.error(
        `Invalid subscription <${sub.name}> : A CustomJob named <${customJobNameParam.value}> was not found.`,
      );
      return undefined;
    }
    const customJobParams = JSON.parse(JSON.stringify(sub.jobParameters));
    const jobParameters = [];
    jobParameters.push({ name: 'name', value: customJobEntry.name });
    jobParameters.push({ name: 'code', value: customJobEntry.code });
    jobParameters.push({ name: 'type', value: customJobEntry.type });
    jobParameters.push({
      name: 'language',
      value: customJobEntry.language,
    });
    jobParameters.push({
      name: 'customJobParameters',
      value: customJobParams,
    });
    const jpConf = await JobFactoryUtils.getCustomJobPodConfig(
      customJobEntry,
      configService,
    );
    jobParameters.push({
      name: 'jobpodmillicpulimit',
      value: jpConf.milliCpuLimit,
    });
    jobParameters.push({
      name: 'jobpodmemorykblimit',
      value: jpConf.memoryKbytesLimit,
    });
    return jobParameters;
  }

  private static stringReplaceValueForFinding(value: string, finding: Finding) {
    // https://regex101.com/r/9yy2OH/1
    const expressionRegex = /^\s*\$\{\s*([^\s]+)\s*\}\s*$/i;
    const match = value.match(expressionRegex);

    if (!match || match.length <= 1) {
      return value;
    }

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

    // TODO: tester le remplacement de valeurs dans un array
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

    // equals are soft to allow for easier type match for the users
    // no support for regex as I did not find an easy way to prevent ReDoS
    // https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
    switch (operator) {
      case 'equals': {
        return lhs == rhs;
      }
      case 'gte': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        return lhs >= rhs;
      }
      case 'gt': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        return lhs > rhs;
      }
      case 'lte': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        return lhs <= rhs;
      }
      case 'lt': {
        if (typeof lhs !== 'number' || typeof rhs !== 'number') return false;
        return lhs < rhs;
      }
      case 'contains': {
        if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
        return lhs.includes(rhs);
      }
      case 'startsWith': {
        if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
        return lhs.startsWith(rhs);
      }
      case 'endsWith': {
        if (typeof lhs !== 'string' || typeof rhs !== 'string') return false;
        return lhs.endsWith(rhs);
      }
      default: {
        return false;
      }
    }
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
    jobConditions: JobCondition[],
    command: T,
  ) {
    let allConditionsMatch = true;
    for (const condition of jobConditions ?? []) {
      condition.lhs = SubscriptionsUtils.replaceValueIfReferingToFinding<
        string | boolean | number
      >(condition.lhs, command.finding);
      condition.rhs = SubscriptionsUtils.replaceValueIfReferingToFinding<
        string | boolean | number
      >(condition.rhs, command.finding);

      if (!SubscriptionsUtils.evaluateCondition(condition)) {
        allConditionsMatch = false;
        break;
      }
    }
    return allConditionsMatch;
  }

  public static readEventSubscriptionFile(
    path: string,
    fileName: string,
  ): EventSubscription | null {
    const baseName = basename(fileName);
    const fileSplit = baseName.split('.');
    if (fileSplit.length <= 1) return null;

    const ext = fileSplit[fileSplit.length - 1].toLowerCase();
    if (ext !== 'yml' && ext !== 'yaml') return null;

    if (!existsSync(path + baseName)) return null;

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

  // TODO: tester cette fonction
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
      finding: subYamlJson.finding,
      jobName: subYamlJson.job.name,
      triggerInterval: subYamlJson.triggerInterval,
      companyId: null,
      jobParameters: params,
      conditions: conditions,
      builtIn: true,
    };

    return sub;
  }
}