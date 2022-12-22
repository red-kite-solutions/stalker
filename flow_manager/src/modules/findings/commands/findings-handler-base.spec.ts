import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { JobCondition } from '../../database/subscriptions/subscriptions.model';
import { HostnameFinding, HostnameIpFinding } from '../findings.service';
import { FindingHandlerBase } from './findings-handler-base';
import { HostnameCommand } from './Findings/hostname.command';
import { HostnameHandler } from './Findings/hostname.handler';

describe('Findings Handler Base', () => {
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  beforeEach(async () => {});

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Validate conditions for execution', () => {
    it.each([
      [
        [
          { lhs: '', operator: 'equals', rhs: '' },
          { lhs: 'aSDf', operator: 'equals', rhs: 'aSDf' },
          {
            lhs: '${domainName}',
            operator: 'equals',
            rhs: '  ${ DoMAinnAmE  } ',
          },
          { lhs: 1, operator: 'equals', rhs: 1 },
          { lhs: true, operator: 'equals', rhs: true },
          { lhs: false, operator: 'equals', rhs: false },
          { lhs: -1, operator: 'equals', rhs: -1 },
          { lhs: 0, operator: 'equals', rhs: 0 },
          { lhs: 0, operator: 'equals', rhs: false },
          { lhs: 1, operator: 'equals', rhs: true },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'gte', rhs: 3 },
          { lhs: -5, operator: 'gte', rhs: -12 },
          { lhs: 0, operator: 'gte', rhs: 0 },
          { lhs: 1, operator: 'gte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'gt', rhs: 3 },
          { lhs: -5, operator: 'gt', rhs: -12 },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'lte', rhs: 5 },
          { lhs: -12, operator: 'lte', rhs: -5 },
          { lhs: 0, operator: 'lte', rhs: 0 },
          { lhs: 1, operator: 'lte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'lt', rhs: 5 },
          { lhs: -12, operator: 'lt', rhs: -5 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains', rhs: 'asdf' },
          { lhs: 'asdf', operator: 'contains', rhs: 'sd' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'ty' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'qw' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains_i', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'contains_i', rhs: 'aSDf' },
          { lhs: 'asdf', operator: 'contains_i', rhs: 'sd' },
          { lhs: 'asdf', operator: 'contains_i', rhs: 'SD' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'ty' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'qw' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'TY' },
          { lhs: 'qwerty', operator: 'contains_i', rhs: 'QW' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith', rhs: 'asdf' },
          { lhs: 'qwerty', operator: 'startsWith', rhs: 'qw' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith_i', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'startsWith_i', rhs: 'aSDf' },
          { lhs: 'qwerty', operator: 'startsWith_i', rhs: 'qw' },
          { lhs: 'qwerty', operator: 'startsWith_i', rhs: 'QW' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith', rhs: 'asdf' },
          { lhs: 'qwerty', operator: 'endsWith', rhs: 'ty' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith_i', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'endsWith_i', rhs: 'aSDf' },
          { lhs: 'qwerty', operator: 'endsWith_i', rhs: 'ty' },
          { lhs: 'qwerty', operator: 'endsWith_i', rhs: 'TY' },
        ],
      ],
      [
        [
          { lhs: '', operator: 'equals_i', rhs: '' },
          { lhs: 'aSDf', operator: 'equals_i', rhs: 'aSDf' },
          { lhs: 'AsdF', operator: 'equals_i', rhs: 'aSDf' },
          { lhs: 'qwerty', operator: 'equals_i', rhs: 'qwerty' },
          {
            lhs: '${   domainName   }',
            operator: 'equals_i',
            rhs: '  ${DoMAinnAmE  }',
          },
        ],
      ],
    ])('Should be valid for execution', (conditions: JobCondition[]) => {
      // Arrange
      const hnHandler: FindingHandlerBase<HostnameCommand> =
        new HostnameHandler(null, null);
      const hnFinding = new HostnameFinding();
      hnFinding.domainName = 'stalker.is';
      const hnCommand = new HostnameCommand(
        '',
        HostnameCommand.name,
        hnFinding,
      );

      // Act
      // @ts-expect-error
      const shouldExecute = hnHandler.shouldExecute(conditions, hnCommand);

      // Assert
      expect(shouldExecute).toBe(true);
    });

    it.each([
      [
        [
          { lhs: '', operator: 'equals', rhs: 'asdf' },
          { lhs: 'AsdF', operator: 'equals', rhs: 'aSDf' },
          { lhs: 1, operator: 'equals', rhs: 0 },
          { lhs: true, operator: 'equals', rhs: false },
          { lhs: false, operator: 'equals', rhs: true },
          { lhs: -1, operator: 'equals', rhs: 1 },
          { lhs: 0, operator: 'equals', rhs: 1 },
          { lhs: 1, operator: 'equals', rhs: false },
          { lhs: 0, operator: 'equals', rhs: true },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'gte', rhs: 5 },
          { lhs: -12, operator: 'gte', rhs: -5 },
          { lhs: 'asdf', operator: 'gte', rhs: 0 },
          { lhs: null, operator: 'gte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 3, operator: 'gt', rhs: 5 },
          { lhs: -12, operator: 'gt', rhs: -5 },
          { lhs: -12, operator: null, rhs: -5 },
          { lhs: null, operator: 'gt', rhs: -5 },
          { lhs: -12, operator: 'gt', rhs: null },
          { lhs: -12, operator: 'gt', rhs: 'qwerty' },
          { lhs: true, operator: 'gt', rhs: 0 },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'lte', rhs: 3 },
          { lhs: -5, operator: 'lte', rhs: -12 },
          { lhs: 'true', operator: 'lte', rhs: true },
          { lhs: false, operator: 'lte', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 5, operator: 'lt', rhs: 3 },
          { lhs: -5, operator: 'lt', rhs: -12 },
          { lhs: false, operator: 'lt', rhs: true },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains', rhs: 'qwerty' },
          { lhs: 'AsdF', operator: 'contains', rhs: 'aSDf' },
          { lhs: 'asdf', operator: 'contains', rhs: 'SD' },
          { lhs: 'asdf', operator: 'contains', rhs: 'af' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'QW' },
          { lhs: 'qwerty', operator: 'contains', rhs: 'TY' },
          { lhs: '1234', operator: 'contains', rhs: 1234 },
          { lhs: true, operator: 'contains', rhs: 'true' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'contains_i', rhs: 'qwerty' },
          { lhs: 'AsdF', operator: 'contains_i', rhs: null },
          { lhs: 1234, operator: 'contains_i', rhs: 'sd' },
          { lhs: true, operator: 'contains_i', rhs: 'true' },
          { lhs: 'false', operator: 'contains_i', rhs: 0 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith', rhs: 'df' },
          { lhs: 'asdf', operator: 'startsWith', rhs: 'ASDF' },
          { lhs: 'asdf', operator: 'startsWith', rhs: 'aS' },
          { lhs: 'qwerty', operator: 'notanoperator', rhs: 'qw' },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'startsWith_i', rhs: 'sdf' },
          { lhs: 'AsdF', operator: 'startsWith_i', rhs: 'SDf' },
          { lhs: 'qwerty', operator: 'startsWith_i', rhs: 'asdf' },
          { lhs: 1, operator: 'startsWith_i', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith', rhs: 'asDF' },
          { lhs: 'qwerty', operator: 'endsWith', rhs: 'Ty' },
          { lhs: '1', operator: 'endsWith', rhs: 1 },
        ],
      ],
      [
        [
          { lhs: 'asdf', operator: 'endsWith_i', rhs: 'asd' },
          { lhs: 'AsdF', operator: 'endsWith_i', rhs: 'aSD' },
          { lhs: true, operator: 'endsWith_i', rhs: 'true' },
          { lhs: 1, operator: 'endsWith_i', rhs: '1' },
        ],
      ],
      [
        [
          { lhs: '', operator: 'equals_i', rhs: 0 },
          { lhs: 1, operator: 'equals_i', rhs: true },
          { lhs: 'AsdF', operator: 'equals_i', rhs: 'qwerty' },
          { lhs: 'qwerty', operator: 'equals_i', rhs: 'qwerty1' },
        ],
      ],
    ])('Should be invalid for execution', (conditions: JobCondition[]) => {
      // Arrange
      const hnHandler: FindingHandlerBase<HostnameCommand> =
        new HostnameHandler(null, null);
      const hnFinding = new HostnameFinding();
      const hnCommand = new HostnameCommand(
        '',
        HostnameCommand.name,
        hnFinding,
      );
      let shouldExecute = false;
      let atLeastOneError = false;

      // Act
      for (const c of conditions) {
        // @ts-expect-error
        shouldExecute = hnHandler.shouldExecute([c], hnCommand);
        if (shouldExecute) {
          atLeastOneError = true;
          console.log(
            `Error while processing condition: [${c.lhs} ${c.operator} ${c.rhs}] should be false`,
          );
        }
      }

      // Assert
      expect(atLeastOneError).toBe(false);
    });
  });

  describe("Replace a finding's refered ${variable}", () => {
    it.each([
      '   ${    domainName   }     ',
      '${domainName}',
      '${domainName}  ',
      '    ${ domAINName  }',
    ])(
      'Should be replaced by the content of the finding',
      (paramValue: string) => {
        // Arrange
        const hnHandler: FindingHandlerBase<HostnameCommand> =
          new HostnameHandler(null, null);
        const hnFinding = new HostnameFinding();
        hnFinding.domainName = 'stalker.is';
        let valueCopy = paramValue;

        // Act
        // @ts-expect-error
        valueCopy = hnHandler.replaceValueIfReferingToFinding(
          valueCopy,
          hnFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(hnFinding.domainName);

        // Arrange
        const hnipFinding = new HostnameIpFinding();
        hnipFinding.domainName = 'www.stalker.is';
        valueCopy = paramValue;

        // Act
        // @ts-expect-error
        valueCopy = hnHandler.replaceValueIfReferingToFinding(
          valueCopy,
          hnipFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(hnipFinding.domainName);
      },
    );
    it.each([
      '   ${    domainName   ',
      '{domainName}',
      '${doma   inName}  ',
      '    $   { domainName  }',
      'domainName',
    ])(
      'Should not be replaced by the content of the finding',
      (paramValue: string) => {
        // Arrange
        const hnHandler: FindingHandlerBase<HostnameCommand> =
          new HostnameHandler(null, null);
        const hnFinding = new HostnameFinding();
        hnFinding.domainName = 'stalker.is';
        let valueCopy = paramValue;

        // Act
        // @ts-expect-error
        valueCopy = hnHandler.replaceValueIfReferingToFinding(
          valueCopy,
          hnFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(paramValue);

        // Arrange
        const hnipFinding = new HostnameIpFinding();
        hnipFinding.domainName = 'www.stalker.is';
        valueCopy = paramValue;

        // Act
        // @ts-expect-error
        valueCopy = hnHandler.replaceValueIfReferingToFinding(
          valueCopy,
          hnipFinding,
        );

        // Assert
        expect(valueCopy).toStrictEqual(paramValue);
      },
    );
  });
});
