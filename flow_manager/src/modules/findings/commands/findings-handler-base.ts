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

  /**
   * Evaluates a JobCondition to a boolean value.
   * @param condition A JobCondition object to be evaluated
   * @returns true if the condition is true, false otherwise
   */
  private evaluateCondition(condition: JobCondition): boolean {
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
   * Identifies the matching Finding output variable to a ${paramName} tag, if it exists
   * @param value The parameter or condition operand that may be a ${paramName} string
   * @param finding The finding we are currently reacting to
   * @returns The finding's referenced output value if it exits, the given *value* otherwise
   */
  private replaceValueIfReferingToFinding(value: unknown, finding: Finding) {
    // https://regex101.com/r/9yy2OH/1
    const paramRegex = /^\s*\$\{\s*([a-z]+)\s*\}\s*$/i;
    let findingOutputVarKeys = Object.keys(finding);
    findingOutputVarKeys = findingOutputVarKeys.filter((e) => e !== 'type');

    if (typeof value !== 'string') {
      return value;
    }

    const match = value.match(paramRegex);

    if (!match || match.length <= 1) {
      return value;
    }

    const matchStr = match[1].toLowerCase();

    const varKey = findingOutputVarKeys.find(
      (s) => s.toLowerCase() === matchStr,
    );

    if (!varKey) {
      return value;
    }

    return finding[varKey];
  }

  /**
   * Validates that all the job's conditions are met
   * If even one condition is invalid, the job should not be executed
   * and we should go straight to the next subscription
   * @param jobConditions The job's conditions to validate
   * @param command The command
   * @returns true if all the subscription's conditions matched
   */
  private shouldExecute(jobConditions: JobCondition[], command: T) {
    let allConditionsMatch = true;
    for (const condition of jobConditions) {
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
    return allConditionsMatch;
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

      // Validate that, according to the conditions, the job should be executed.
      // If not, then we go straight for the other subscription
      if (!this.shouldExecute(sub.conditions, command)) continue;

      // This loop ensures that all parameters refering to a finding's output
      // (ex: ${ip} for refering to an ip parameter of a finding) is replaced with the
      // proper value. The check for the variable name is case insensitive.
      for (const param of sub.jobParameters) {
        param.value = this.replaceValueIfReferingToFinding(
          param.value,
          command.finding,
        );
      }

      // Adding the companyId JobParameter to every job as it is always needed
      const companyIdParameter = new JobParameter();
      companyIdParameter.name = 'companyId';
      companyIdParameter.value = command.companyId;
      sub.jobParameters.push(companyIdParameter);

      // Launching the generic function that creates the appropriate job and publishing it
      const job: Job = jobDefinition.pointer(sub.jobParameters);
      if (job !== null) this.jobsService.publish(job);
    }

    try {
      await this.executeCore(command);
    } catch (e) {
      this.logger.error('An error occurred while executing the handler.', e);
    }
  }

  protected abstract executeCore(command: T): Promise<unknown | void>;
}
