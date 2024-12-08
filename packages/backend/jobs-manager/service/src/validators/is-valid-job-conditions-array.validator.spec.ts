import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../modules/app.controller';
import { AppService } from '../modules/app.service';
import {
  AndJobCondition,
  JobCondition,
  OrJobCondition,
} from '../modules/database/subscriptions/event-subscriptions/event-subscriptions.model';
import { isValidJobConditionsArray } from './is-valid-job-conditions-array.validator';

const validConditions: Array<
  JobCondition | OrJobCondition | AndJobCondition
>[] = [
  [
    {
      or: [
        { lhs: 'asdf', operator: 'startsWith', rhs: 'DF' },
        {
          lhs: 'asdf',
          operator: 'equals_i',
          rhs: ['asdf', 'ASDF', 'AsdF'],
        },
      ],
    },
    {
      or: [
        {
          or: [
            { lhs: 'asdf', operator: 'startsWith', rhs: 'DF' },
            {
              lhs: 'asdf',
              operator: 'equals_i',
              rhs: ['asdf', 'ASDF', 'AsdF'],
            },
          ],
        },
      ],
    },
    {
      and: [
        { lhs: 'asdf', operator: 'not_startsWith', rhs: 'DF' },
        {
          lhs: 'asdf',
          operator: 'equals_i',
          rhs: ['asdf', 'ASDF', 'AsdF'],
        },
      ],
    },
    {
      or: [
        {
          and: [
            {
              lhs: '${domainName}',
              operator: 'not_not_equals',
              rhs: 'red-kite.io',
            },
            {
              lhs: 'asdf',
              operator: 'not_or_equals_i',
              rhs: ['asdf', 'ASDF', 'AsdF'],
            },
          ],
        },
      ],
    },
    {
      and: [
        { lhs: 'asdf', operator: 'equals', rhs: 'asdf' },
        {
          and: [],
        },
      ],
    },
    {
      and: [
        { lhs: 'asdf', operator: 'equals', rhs: 'asdf' },
        {
          and: [],
        },
      ],
    },
    {
      and: [],
    },
    {
      or: [],
    },
  ],
  [
    { lhs: '', operator: 'not_equals_i', rhs: 'asdf' },
    { lhs: 'aSDf', operator: 'not_startsWith', rhs: 'ASDf' },
    { lhs: 'AsdF', operator: 'not_endsWith', rhs: 'DF' },
    { lhs: 1, operator: 'not_equals', rhs: 2 },
    { lhs: 0, operator: 'not_gt', rhs: 0 },
    { lhs: 0, operator: 'not_lt', rhs: 0 },
  ],
  [],
];

const invalidConditions: any = [
  [{ lhs: 'AsdF', operatorr: 'not_endsWith', rhs: 'DF' }],
  [{ lhs: 'AsdF', operator: 'not_endsWith' }],
  [{ lhs: 'AsdF', operator: 'not_endsWith', rhs: 'DF', asdf: 'asdf' }],
  [{ operator: 'not_endsWith', rhs: 'DF' }],
  [{ operatorr: 'not_endsWith_i', rhs: 'DF' }],
  [{ lhs: 'AsdF', operator: 'asdf', rhs: 'DF' }],
  [{ lhs: 'AsdF', operator: 'asdf_endsWith', rhs: 'DF' }],
  [{ lhs: 'AsdF', operator: 'endsWith_a', rhs: 'DF' }],
  [{ or: {} }],
  [{ and: {} }],
  [{ and: [{ operator: 'endsWith', rhs: 'DF' }] }],
  [{ or: [{ lhs: 'asdf', operator: 'end', rhs: 'DF' }] }],
];

describe('Valid job condition array validator', () => {
  let moduleFixture: TestingModule;
  let appController: AppController;

  beforeEach(async () => {
    moduleFixture = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleFixture.get<AppController>(AppController);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Validator', () => {
    it.each([validConditions])(
      'Should validate that the conditions are in the right format - Valid',
      (conditions: Array<JobCondition | OrJobCondition | AndJobCondition>) => {
        // Arrange & Act & Assert
        expect(isValidJobConditionsArray(conditions)).toStrictEqual(true);
      },
    );

    it.each([invalidConditions])(
      'Should validate that the conditions are in the right format - Invalid',
      (conditions: Array<JobCondition | OrJobCondition | AndJobCondition>) => {
        // Arrange & Act & Assert
        expect(isValidJobConditionsArray(conditions)).toStrictEqual(false);
      },
    );
  });
});
