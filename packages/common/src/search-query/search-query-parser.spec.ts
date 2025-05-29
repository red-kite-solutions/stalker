import { SearchQueryParser } from './search-query-parser';
import { SearchTerm, SearchTerms } from './search-query-parser.types';

interface HappyTestCase {
  input: string;
  expected: SearchTerms;
}

describe('Search Query Parser', () => {
  const parser = new SearchQueryParser();

  const generalUseCases: HappyTestCase[] = [
    {
      input: 'domain: "I am confusing: I have spaces and colons"',
      expected: [
        term({
          type: 'domain.name',
          originalType: 'domain',
          value: 'I am confusing: I have spaces and colons',
          quoteAfter: true,
          quoteBefore: true,
        }),
      ],
    },
    {
      input: 'domain: http://a1b2.ca -is: blocked',
      expected: [
        term({
          type: 'domain.name',
          originalType: 'domain',
          value: 'http://a1b2.ca',
          spacesAfterValue: 1,
        }),

        term({
          not: true,
          type: 'is',
          originalType: 'is',
          value: 'blocked',
        }),
      ],
    },

    // Incomplete
    {
      input: 'dom',
      expected: [
        term({
          incomplete: true,
          value: null,
          type: 'unknown',
          originalType: 'dom',
          hasColon: false,
          spacesBeforeValue: 0,
        }),
      ],
    },
    {
      input: '-dom',
      expected: [
        term({
          not: true,
          incomplete: true,
          value: null,
          type: 'unknown',
          originalType: 'dom',
          hasColon: false,
          spacesBeforeValue: 0,
        }),
      ],
    },
    {
      input: 'domain',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'domain.name',
          originalType: 'domain',
          spacesBeforeValue: 0,
          value: null,
          hasColon: false,
        }),
      ],
    },
    {
      input: '-domain',
      expected: [
        term({
          not: true,
          incomplete: true,
          type: 'domain.name',
          originalType: 'domain',
          spacesBeforeValue: 0,
          value: null,
          hasColon: false,
        }),
      ],
    },
  ];

  const isTestCases: HappyTestCase[] = [
    {
      input: 'is',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'is',
          originalType: 'is',
          value: null,
          hasColon: false,
          spacesBeforeValue: 0,
        }),
      ],
    },
    {
      input: '-is',
      expected: [
        term({
          incomplete: true,
          not: true,
          type: 'is',
          originalType: 'is',
          value: null,
          hasColon: false,
          spacesBeforeValue: 0,
        }),
      ],
    },
    {
      input: '-is: blocked',
      expected: [
        term({ not: true, type: 'is', originalType: 'is', value: 'blocked' }),
      ],
    },
    {
      input: 'is: blocked',
      expected: [term({ type: 'is', originalType: 'is', value: 'blocked' })],
    },
  ];

  const tagsTestCases: HappyTestCase[] = [
    {
      input: 'tag.name',
      expected: [
        term({
          incomplete: true,
          type: 'tag.name',
          originalType: 'tag.name',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
    {
      input: '-tag.name',
      expected: [
        term({
          not: true,
          incomplete: true,
          type: 'tag.name',
          originalType: 'tag.name',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
    {
      input: 'tag: my-tag',
      expected: [
        term({ type: 'tag.name', originalType: 'tag', value: 'my-tag' }),
      ],
    },
    {
      input: '-tag: my-tag',
      expected: [
        term({
          not: true,
          type: 'tag.name',
          originalType: 'tag',
          value: 'my-tag',
        }),
      ],
    },
    {
      input: 'tag.name: my-tag',
      expected: [
        term({
          type: 'tag.name',
          originalType: 'tag.name',
          value: 'my-tag',
        }),
      ],
    },
    {
      input: '-tag.name: my-tag',
      expected: [
        term({
          not: true,
          type: 'tag.name',
          originalType: 'tag.name',
          value: 'my-tag',
        }),
      ],
    },
    {
      input: 'tag.id: my-id',
      expected: [
        term({
          not: false,
          type: 'tag.id',
          originalType: 'tag.id',
          value: 'my-id',
        }),
      ],
    },
    {
      input: '-tag.id: my-id',
      expected: [
        term({
          not: true,
          type: 'tag.id',
          originalType: 'tag.id',
          value: 'my-id',
        }),
      ],
    },
  ];

  const domainTestCases: HappyTestCase[] = [
    {
      input: 'domain.name',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'domain.name',
          originalType: 'domain.name',
          spacesBeforeValue: 0,
          hasColon: false,
          value: null,
        }),
      ],
    },
    {
      input: '-domain.name',
      expected: [
        term({
          incomplete: true,
          not: true,
          type: 'domain.name',
          originalType: 'domain.name',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
    {
      input: 'domain: example.org',
      expected: [
        term({
          not: false,
          type: 'domain.name',
          originalType: 'domain',
          value: 'example.org',
        }),
      ],
    },
    {
      input: '-domain: example.org',
      expected: [
        term({
          not: true,
          type: 'domain.name',
          originalType: 'domain',
          value: 'example.org',
        }),
      ],
    },
    {
      input: 'domain.name: example.org',
      expected: [
        term({
          not: false,
          type: 'domain.name',
          originalType: 'domain.name',
          value: 'example.org',
        }),
      ],
    },
    {
      input: '-domain.name: example.org',
      expected: [
        term({
          not: true,
          type: 'domain.name',
          originalType: 'domain.name',
          value: 'example.org',
        }),
      ],
    },
    {
      input: 'domain.id: my-id',
      expected: [
        term({
          type: 'domain.id',
          originalType: 'domain.id',
          value: 'my-id',
        }),
      ],
    },
    {
      input: '-domain.id: my-id',
      expected: [
        term({
          not: true,
          type: 'domain.id',
          originalType: 'domain.id',
          value: 'my-id',
        }),
      ],
    },
  ];

  const hostTestCases: HappyTestCase[] = [
    {
      input: 'host.id',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'host.id',
          originalType: 'host.id',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
    {
      input: 'host',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'host.ip',
          originalType: 'host',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
    {
      input: '-host',
      expected: [
        term({
          incomplete: true,
          not: true,
          type: 'host.ip',
          originalType: 'host',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
  ];

  const portTestCases: HappyTestCase[] = [
    {
      input: 'port',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'port.number',
          originalType: 'port',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
    {
      input: '-port.number',
      expected: [
        term({
          incomplete: true,
          not: true,
          type: 'port.number',
          originalType: 'port.number',
          hasColon: false,
          spacesBeforeValue: 0,
          value: null,
        }),
      ],
    },
  ];

  const findingTestCases: HappyTestCase[] = [
    {
      input: 'finding',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'finding',
          originalType: 'finding.',
          hasColon: false,
          spacesBeforeValue: 0,
          key: {
            findingKey: '',
          },
          value: null,
        }),
      ],
    },
    {
      input: 'finding.',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'finding',
          originalType: 'finding.',
          spacesBeforeValue: 0,
          hasColon: false,
          key: {
            findingKey: '',
          },
          value: null,
        }),
      ],
    },
    {
      input: 'finding.foo.',
      expected: [
        term({
          not: false,
          incomplete: true,
          type: 'findingField',
          originalType: 'finding.foo.',
          hasColon: false,
          spacesBeforeValue: 0,
          key: {
            findingKey: 'foo',
            fieldKey: '',
          },
          value: null,
        }),
      ],
    },
    {
      input: 'finding.foo.bar: 123',
      expected: [
        term({
          not: false,
          type: 'findingField',
          originalType: 'finding.foo.bar',
          key: {
            findingKey: 'foo',
            fieldKey: 'bar',
          },
          value: '123',
        }),
      ],
    },
    {
      input: '-finding.foo.bar: 123',
      expected: [
        term({
          not: true,
          type: 'findingField',
          originalType: 'finding.foo.bar',
          key: {
            findingKey: 'foo',
            fieldKey: 'bar',
          },
          value: '123',
        }),
      ],
    },
    {
      input: 'finding.foo: exists',
      expected: [
        term({
          type: 'finding',
          originalType: 'finding.foo',
          key: {
            findingKey: 'foo',
          },
          value: 'exists',
        }),
      ],
    },
  ];

  it.each([
    ...generalUseCases,
    ...domainTestCases,
    ...hostTestCases,
    ...portTestCases,
    ...findingTestCases,
    ...tagsTestCases,
    ...isTestCases,
  ])(`Should parse "$input" correctly`, ({ input, expected }) => {
    // Arrange
    // Act
    const parsed = parser.parse(input);

    // Assert
    expect(parsed).toEqual(expected);
  });
});

function term(overrides: SearchTerm): SearchTerm {
  return {
    not: false,
    type: undefined,
    value: undefined,
    spacesAfterKey: 0,
    spacesAfterValue: 0,
    spacesBeforeKey: 0,
    spacesBeforeValue: 1,
    originalType: undefined,
    incomplete: false,
    hasColon: true,
    quoteBefore: false,
    quoteAfter: false,
    ...overrides,
  };
}
