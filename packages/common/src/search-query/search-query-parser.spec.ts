import { SearchQueryParser } from './search-query-parser';
import { SearchTerms } from './search-query-parser.types';

interface HappyTestCase {
  input: string;
  expected: SearchTerms;
}

describe('Search Query Parser', () => {
  const parser = new SearchQueryParser();

  const testCases: HappyTestCase[] = [
    {
      input: 'domain: http://a1b2.ca',
      expected: [
        {
          not: false,
          type: 'domain',
          value: 'http://a1b2.ca',
        },
      ],
    },
    {
      input: 'domain: "I am confusing: I have spaces and colons"',
      expected: [
        {
          not: false,
          type: 'domain',
          value: 'I am confusing: I have spaces and colons',
        },
      ],
    },
    {
      input: 'domain: http://a1b2.ca -is: blocked',
      expected: [
        {
          not: false,
          type: 'domain',
          value: 'http://a1b2.ca',
        },
        {
          not: true,
          type: 'is',
          value: 'blocked',
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
    {
      input: 'dom',
      expected: [
        {
          incomplete: true,
          not: false,
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
          incomplete: true,
          not: false,
          type: 'domain',
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
          type: 'domain',
          value: null,
        },
      ],
    },
    {
      input: 'host',
      expected: [
        {
          incomplete: true,
          not: false,
          type: 'host',
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
          type: 'host',
          value: null,
        },
      ],
    },
    {
      input: 'port',
      expected: [
        {
          incomplete: true,
          not: false,
          type: 'port',
          value: null,
        },
      ],
    },
    {
      input: '-port',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'port',
          value: null,
        },
      ],
    },
    {
      input: 'tags',
      expected: [
        {
          incomplete: true,
          not: false,
          type: 'tags',
          value: null,
        },
      ],
    },
    {
      input: '-tags',
      expected: [
        {
          incomplete: true,
          not: true,
          type: 'tags',
          value: null,
        },
      ],
    },
    {
      input: 'is',
      expected: [
        {
          incomplete: true,
          not: false,
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
      input: 'finding',
      expected: [
        {
          incomplete: true,
          not: false,
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
          incomplete: true,
          not: false,
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
          incomplete: true,
          not: false,
          type: 'findingField',
          key: {
            findingKey: 'foo',
            fieldKey: '',
          },
          value: null,
        },
      ],
    },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`Should parse "${input}" correctly`, () => {
      // Arrange
      // Act
      const parsed = parser.parse(input);

      // Assert
      expect(parsed).toEqual(expected);
    });
  });
});
