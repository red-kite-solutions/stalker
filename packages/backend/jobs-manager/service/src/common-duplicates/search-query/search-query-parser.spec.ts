import { SearchQueryParser } from './search-query-parser';
import {
  SearchTerm,
  SearchTerms,
  TermTypes as TermType,
} from './search-query-parser.types';

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
        term('domain.name', 'I am confusing: I have spaces and colons'),
      ],
    },
    {
      input: 'domain: http://a1b2.ca -is: blocked',
      expected: [
        term('domain.name', 'http://a1b2.ca'),
        notTerm('is', 'blocked'),
      ],
    },

    // Incomplete
    {
      input: 'dom',
      expected: [
        {
          not: false,
          incomplete: true,
          key: 'dom',
          value: null,
          type: null,
        },
      ],
    },
    {
      input: '-dom',
      expected: [
        {
          incomplete: true,
          not: true,
          key: 'dom',
          value: null,
          type: null,
        },
      ],
    },
    {
      input: 'domain',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'domain.name',
          value: null,
        },
      ],
    },
    {
      input: '-domain',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'domain.name',
          value: null,
        },
      ],
    },
  ];

  const isTestCases: HappyTestCase[] = [
    {
      input: 'is',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'is',
          value: null,
        },
      ],
    },
    {
      input: '-is',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'is',
          value: null,
        },
      ],
    },
    {
      input: '-is: blocked',
      expected: [notTerm('is', 'blocked')],
    },
    {
      input: 'is: blocked',
      expected: [term('is', 'blocked')],
    },
  ];

  const tagsTestCases: HappyTestCase[] = [
    {
      input: 'tag.name',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'tag.name',
          value: null,
        },
      ],
    },
    {
      input: '-tag.name',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'tag.name',
          value: null,
        },
      ],
    },
    {
      input: 'tag: my-tag',
      expected: [term('tag.name', 'my-tag')],
    },
    {
      input: '-tag: my-tag',
      expected: [notTerm('tag.name', 'my-tag')],
    },
    {
      input: 'tag.name: my-tag',
      expected: [term('tag.name', 'my-tag')],
    },
    {
      input: '-tag.name: my-tag',
      expected: [notTerm('tag.name', 'my-tag')],
    },
    {
      input: 'tag.id: my-id',
      expected: [term('tag.id', 'my-id')],
    },
    {
      input: '-tag.id: my-id',
      expected: [notTerm('tag.id', 'my-id')],
    },
  ];

  const domainTestCases: HappyTestCase[] = [
    {
      input: 'domain.name',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'domain.name',
          value: null,
        },
      ],
    },
    {
      input: '-domain.name',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'domain.name',
          value: null,
        },
      ],
    },
    {
      input: 'domain: example.org',
      expected: [term('domain.name', 'example.org')],
    },
    {
      input: '-domain: example.org',
      expected: [notTerm('domain.name', 'example.org')],
    },
    {
      input: 'domain.name: example.org',
      expected: [term('domain.name', 'example.org')],
    },
    {
      input: '-domain.name: example.org',
      expected: [notTerm('domain.name', 'example.org')],
    },
    {
      input: 'domain.id: my-id',
      expected: [term('domain.id', 'my-id')],
    },
    {
      input: '-domain.id: my-id',
      expected: [notTerm('domain.id', 'my-id')],
    },
  ];

  const hostTestCases: HappyTestCase[] = [
    {
      input: 'host.id',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'host.id',
          value: null,
        },
      ],
    },
    {
      input: 'host',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'host.ip',
          value: null,
        },
      ],
    },
    {
      input: '-host',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'host.ip',
          value: null,
        },
      ],
    },
  ];

  const portTestCases: HappyTestCase[] = [
    {
      input: 'port',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'port.number',
          value: null,
        },
      ],
    },
    {
      input: '-port.number',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'port.number',
          value: null,
        },
      ],
    },
  ];

  const findingTestCases: HappyTestCase[] = [
    {
      input: 'finding',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'finding',
          key: {
            findingKey: '',
          },
          value: null,
        },
      ],
    },
    {
      input: 'finding.',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'finding',
          key: {
            findingKey: '',
          },
          value: null,
        },
      ],
    },
    {
      input: 'finding.foo.',
      expected: [
        {
          not: false,
          incomplete: true,
          type: 'findingField',
          key: {
            findingKey: 'foo',
            fieldKey: '',
          },
          value: null,
        },
      ],
    },
    {
      input: 'finding.foo.bar: 123',
      expected: [
        {
          not: false,
          type: 'findingField',
          key: {
            findingKey: 'foo',
            fieldKey: 'bar',
          },
          value: '123',
        },
      ],
    },
    {
      input: '-finding.foo.bar: 123',
      expected: [
        {
          not: true,
          type: 'findingField',
          key: {
            findingKey: 'foo',
            fieldKey: 'bar',
          },
          value: '123',
        },
      ],
    },
    {
      input: 'finding.foo: exists',
      expected: [
        {
          not: false,
          type: 'finding',
          key: {
            findingKey: 'foo',
          },
          value: 'exists',
        },
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

function term(type: TermType, value: string): SearchTerm {
  return {
    not: false,
    type,
    value,
  };
}

function notTerm(type: TermType, value: string): SearchTerm {
  return {
    not: true,
    type,
    value,
  };
}
