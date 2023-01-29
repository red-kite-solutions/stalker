import { Finding, PortFinding } from '../findings.service';
import { executeDsl, prepareContext } from './automation-dsl-interpreter';

describe('Automation DSL', () => {
  const portFinding: PortFinding = {
    type: 'PortFinding',
    key: 'PortFinding',
    fields: [
      {
        key: 'protocol',
        type: 'text',
        label: 'This is a udp port',
        data: 'tcp',
      },
    ],
    ip: '1.2.3.4',
    port: 2,
  };

  it.each([
    ['ip', portFinding, '1.2.3.4'],
    ['finding.protocol', portFinding, 'tcp'],
    ['port', portFinding, 2],
    ['key', portFinding, 'PortFinding'],
  ])(
    'Execute - Returns expected value',
    (command: string, finding: Finding, expected: unknown) => {
      // Arrange
      const ctx = prepareContext(finding);

      // Act
      const actual = executeDsl(command, ctx);

      // Assert
      expect(actual).toBe(expected);
    },
  );
});
