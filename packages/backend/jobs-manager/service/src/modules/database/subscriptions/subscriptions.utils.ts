import { Logger } from '@nestjs/common';
import * as realFs from 'fs';
import { FsPromisesApi as MemfsFsPromisesApi } from 'memfs/lib/node/types';
import { basename } from 'node:path';
import * as path from 'path';
import { parse } from 'yaml';
import { DataSource } from '../../datasources/data-sources';
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
  AndJobCondition,
  EventSubscription,
  JobCondition,
  JobParameter,
  OrJobCondition,
} from './event-subscriptions/event-subscriptions.model';
import { Subscription, SubscriptionWithType } from './subscriptions.type';

type FsPromisesApi = MemfsFsPromisesApi | typeof realFs.promises;

async function exists(fs: FsPromisesApi, path: string) {
  try {
    await fs.access(path);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

export class SubscriptionsUtils {
  public static readonly conditionOperators = [
    'equals',
    'gte',
    'gt',
    'lte',
    'lt',
    'contains',
    'startsWith',
    'endsWith',
  ];

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
    const res = executeDsl(expression, ctx);

    return res || res === false ? res : '';
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

    if (!finding) return value;

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

    let lhsArray = [];
    let rhsArray = [];

    if (Array.isArray(condition.lhs)) {
      lhsArray.push(...condition.lhs);
    } else {
      lhsArray.push(condition.lhs);
    }

    if (Array.isArray(condition.rhs)) {
      rhsArray.push(...condition.rhs);
    } else {
      rhsArray.push(condition.rhs);
    }

    let fullResult = true;

    // Making the case incensitive string checks all lowercase
    let caseInsensitive = false;
    if (!operator || !lhsArray.length || !rhsArray.length) {
      return false;
    }

    if (operator.endsWith('_i')) {
      caseInsensitive = true;
      operator = operator.substring(0, operator.length - 2);
    }

    let negate = false;
    let or_operator = false;
    while (operator.startsWith('not_') || operator.startsWith('or_')) {
      if (operator.startsWith('not_')) {
        operator = operator.substring(4);
        negate = !negate;
      }
      if (operator.startsWith('or_')) {
        operator = operator.substring(3);
        or_operator = true;
        fullResult = false;
      }
    }

    for (let lhs of lhsArray) {
      if (lhs === null || lhs === undefined) return false;

      if (caseInsensitive) {
        if (typeof lhs !== 'string') return false;
        lhs = lhs.toLowerCase();
      }

      for (let rhs of rhsArray) {
        if (rhs === null || rhs === undefined) return false;

        if (caseInsensitive) {
          if (typeof rhs !== 'string') return false;
          rhs = rhs.toLowerCase();
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
            if (typeof lhs !== 'number' || typeof rhs !== 'number')
              return false;
            result = lhs >= rhs;
            break;
          }
          case 'gt': {
            if (typeof lhs !== 'number' || typeof rhs !== 'number')
              return false;
            result = lhs > rhs;
            break;
          }
          case 'lte': {
            if (typeof lhs !== 'number' || typeof rhs !== 'number')
              return false;
            result = lhs <= rhs;
            break;
          }
          case 'lt': {
            if (typeof lhs !== 'number' || typeof rhs !== 'number')
              return false;
            result = lhs < rhs;
            break;
          }
          case 'contains': {
            if (typeof lhs !== 'string' || typeof rhs !== 'string')
              return false;
            result = lhs.includes(rhs);
            break;
          }
          case 'startsWith': {
            if (typeof lhs !== 'string' || typeof rhs !== 'string')
              return false;
            result = lhs.startsWith(rhs);
            break;
          }
          case 'endsWith': {
            if (typeof lhs !== 'string' || typeof rhs !== 'string')
              return false;
            result = lhs.endsWith(rhs);
            break;
          }
          default: {
            return false;
          }
        }

        if (or_operator) fullResult = fullResult || (negate ? !result : result);
        else fullResult = fullResult && (negate ? !result : result);

        if ((!fullResult && !or_operator) || (fullResult && or_operator))
          return fullResult;
      }
    }

    return fullResult;
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
    jobConditions: Array<JobCondition | AndJobCondition | OrJobCondition>,
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
    jobConditions: Array<JobCondition | AndJobCondition | OrJobCondition>,
    finding: Finding,
  ) {
    // For backward compatibility, if isEnabled is undefined, we consider it enabled.
    // This accommodates legacy models where the 'isEnabled' flag, absent initially,
    // is represented by 'undefined' instead of 'true'.
    if (isEnabled === false) return false;

    return SubscriptionsUtils.shouldExecuteFromFindingRecursive(
      jobConditions,
      finding,
    );
  }

  private static shouldExecuteFromFindingRecursive(
    jobConditions: Array<JobCondition | AndJobCondition | OrJobCondition>,
    finding: Finding,
    orConditionContext = false,
    parentOrConditionContext = null,
  ) {
    const conditions = jobConditions ?? [];

    if (conditions.length <= 0) {
      return (
        parentOrConditionContext === null || // depth = 0, return true
        !parentOrConditionContext
      ); // return true if parent was an "and", false if parent was an "or", as to not affect the result
    }

    let allConditionsResult = !orConditionContext;

    for (const condition of conditions) {
      let currentConditionResult: boolean;
      if ('or' in condition) {
        currentConditionResult = this.shouldExecuteFromFindingRecursive(
          condition.or,
          finding,
          true,
          orConditionContext,
        );
      } else if ('and' in condition) {
        currentConditionResult = this.shouldExecuteFromFindingRecursive(
          condition.and,
          finding,
          false,
          orConditionContext,
        );
      } else {
        condition.lhs = SubscriptionsUtils.replaceValueIfReferingToFinding<
          string | boolean | number | Array<string | boolean | number>
        >(condition.lhs, finding);
        condition.rhs = SubscriptionsUtils.replaceValueIfReferingToFinding<
          string | boolean | number | Array<string | boolean | number>
        >(condition.rhs, finding);

        currentConditionResult =
          SubscriptionsUtils.evaluateCondition(condition);
      }

      if (orConditionContext) {
        allConditionsResult = allConditionsResult || currentConditionResult;
      } else {
        allConditionsResult = allConditionsResult && currentConditionResult;
      }

      // Early return if possible when future operations are meaningless
      if (
        (orConditionContext && allConditionsResult) ||
        (!orConditionContext && !allConditionsResult)
      )
        return allConditionsResult;
    }

    return allConditionsResult;
  }

  /**
   * Validates that the path + file name exists and is valid
   * @param directory a folder path ending with a '/'
   * @param fileName must be `basename(fileName)` to make sure that it is a proper file name without path
   * @returns
   */
  private static async validateSubscriptionFileFullPath(
    directory: string,
    fileName: string,
    fs: FsPromisesApi,
  ): Promise<boolean> {
    const fileSplit = fileName.split('.');
    if (fileSplit.length <= 1) return false;

    const ext = fileSplit[fileSplit.length - 1].toLowerCase();
    if (ext !== 'yml' && ext !== 'yaml') return false;

    if (!exists(fs, path.join(directory, fileName))) return false;

    return true;
  }

  public static async readSubscriptionFile(
    directory: string,
    fileName: string,
    dataSource: DataSource,
  ): Promise<SubscriptionWithType | null> {
    const fs = dataSource?.fs ?? realFs.promises;

    const baseName = basename(fileName);
    const isFileNameValid =
      await SubscriptionsUtils.validateSubscriptionFileFullPath(
        directory,
        baseName,
        fs,
      );
    if (!isFileNameValid) {
      return null;
    }

    const fileContent = (
      await fs.readFile(path.join(directory, baseName))
    ).toString();
    const yaml = parse(fileContent);

    const source = {
      type: dataSource.type,
      avatarUrl: dataSource.avatarUrl,
      url: dataSource.repoUrl,
      branch: dataSource.branch,
    };

    switch (yaml.triggerType) {
      case 'cron':
        const cron = await SubscriptionsUtils.readCronSubscriptionFile(
          directory,
          fileName,
          fs,
        );
        return cron != null ? { ...cron, triggerType: 'cron', source } : null;

      case 'event':
        const event = await SubscriptionsUtils.readEventSubscriptionFile(
          directory,
          fileName,
          fs,
        );
        return event != null
          ? { ...event, triggerType: 'event', source }
          : null;

      default:
        throw new Error(
          `Unknown subscription trigger type ${yaml.triggerType}`,
        );
    }
  }

  public static async readEventSubscriptionFile(
    directory: string,
    fileName: string,
    fs?: FsPromisesApi,
  ): Promise<EventSubscription | null> {
    fs ??= realFs.promises;

    const baseName = basename(fileName);
    if (
      !(await SubscriptionsUtils.validateSubscriptionFileFullPath(
        directory,
        baseName,
        fs,
      ))
    )
      return null;

    const fileContent = (
      await fs.readFile(path.join(directory, baseName))
    ).toString();
    let sub: EventSubscription | null = null;
    try {
      sub = SubscriptionsUtils.parseEventSubscriptionYaml(fileContent);
      sub.file = baseName;
    } catch (err) {
      console.log(err);
    }
    return sub;
  }

  public static async readCronSubscriptionFile(
    directory: string,
    fileName: string,
    fs?: FsPromisesApi,
  ): Promise<CronSubscription | null> {
    fs ??= realFs.promises;

    const baseName = basename(fileName);
    if (
      !(await SubscriptionsUtils.validateSubscriptionFileFullPath(
        directory,
        baseName,
        fs,
      ))
    )
      return null;

    const file_content = (
      await fs.readFile(path.join(directory, baseName))
    ).toString();
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
      discriminator: subYamlJson.discriminator ?? null,
    };

    return sub;
  }
}
