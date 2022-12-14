import { Logger } from '@nestjs/common';
import { ICommandHandler } from '@nestjs/cqrs';
import { JobDefinitions } from '../../database/jobs/job-model.module';
import { JobsService } from '../../database/jobs/jobs.service';
import { Job } from '../../database/jobs/models/jobs.model';
import {
  JobCondition,
  JobParameter,
} from '../../database/subscriptions/subscriptions.model';
import { SubscriptionsService } from '../../database/subscriptions/subscriptions.service';
import { Finding } from '../findings.service';
import { FindingsCommandMapping } from './findings-commands';
import { FindingCommand } from './findings.command';

export abstract class FindingHandlerBase<T extends FindingCommand>
  implements ICommandHandler<T>
{
  protected abstract logger: Logger;

  constructor(
    private subscriptionService: SubscriptionsService,
    protected jobsService: JobsService,
  ) {}

  private evaluateCondition(condition: JobCondition): boolean {
    let operator = condition.operator;
    let lhs = condition.lhs;
    let rhs = condition.rhs;

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

  private replaceValueIfReferingToFinding(value: unknown, finding: Finding) {
    const paramRegex = /^\$\{[a-z]+\}$/i;
    let findingOutputVarKeys = Object.keys(finding);
    findingOutputVarKeys = findingOutputVarKeys.filter((e) => e !== 'type');

    if (typeof value !== 'string') {
      return value;
    }

    let trimValue = value.trim();
    if (!paramRegex.test(trimValue)) {
      return value;
    }

    trimValue = trimValue.substring(2, trimValue.length - 1);

    const varKey = findingOutputVarKeys.find(
      (s) => s.toLowerCase() === trimValue,
    );

    if (!varKey) {
      return value;
    }

    return finding[varKey];
  }

  public async execute(command: T) {
    const mapping = FindingsCommandMapping.find(
      (m) => command.commandType === m.command.name,
    );

    // Only the subscriptions concerning the current company and the current finding
    // type are returned by the database
    const subs = await this.subscriptionService.getAllForFinding(
      command.companyId,
      mapping.finding,
    );

    for (const sub of subs) {
      const jobDefinition = JobDefinitions.find((j) => j.name === sub.jobName);

      // Validating that all the subscription's conditions are valid
      // If even one condition is invalid, the job should not be executed
      // and we should go straight to the next subscription
      let allConditionsMatch = true;
      for (const condition of sub.conditions) {
        condition.lhs = this.replaceValueIfReferingToFinding(
          condition.lhs,
          command.finding,
        );
        condition.rhs = this.replaceValueIfReferingToFinding(
          condition.rhs,
          command.finding,
        );

        if (!this.evaluateCondition(condition)) {
          allConditionsMatch = false;
          break;
        }
      }
      if (!allConditionsMatch) {
        continue;
      }

      // This loop ensures that all parameters refering to a finding's output
      // (ex: ${ip} for refering to an ip parameter of a finding) is replaced with the
      // proper value. The check for the variable name is case insensitive.
      for (const param of sub.jobParameters) {
        param.value = this.replaceValueIfReferingToFinding(
          param.value,
          command.finding,
        );
      }

      const companyIdParameter = new JobParameter();
      companyIdParameter.name = 'companyId';
      companyIdParameter.value = command.companyId;

      sub.jobParameters.push(companyIdParameter);
      const job: Job = jobDefinition.pointer(sub.jobParameters);
      if (job !== null) this.jobsService.publish(job);
    }

    await this.executeCore(command);
  }

  protected abstract executeCore(command: T): Promise<unknown | void>;
}
