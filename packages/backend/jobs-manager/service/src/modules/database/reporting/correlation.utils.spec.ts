import { CorrelationKeyUtils } from './correlation.utils';

describe('Finding utils', () => {
  it('Host findings key', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.hostCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4`,
    );
  });

  it('Port findings key', () => {
    // Arrange
    // Act
    const correlationId = CorrelationKeyUtils.portCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      443,
      'tcp',
    );

    // Assert
    expect(correlationId).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp`,
    );
  });

  it('Domain findings key', () => {
    // Arrange
    // Act
    const correlationId = CorrelationKeyUtils.domainCorrelationKey(
      '507f1f77bcf86cd799439011',
      'www.stalker.is',
    );

    // Assert
    expect(correlationId).toBe(
      `project:507f1f77bcf86cd799439011;domain:www.stalker.is`,
    );
  });

  describe('Key to service name mapping', () => {
    it('Host findings key', () => {
      // Arrange
      const correlationKey = CorrelationKeyUtils.hostCorrelationKey(
        '507f1f77bcf86cd799439011',
        '1.2.3.4',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('HostService');
    });

    it('Port findings key', () => {
      // Arrange
      const correlationKey = CorrelationKeyUtils.portCorrelationKey(
        '507f1f77bcf86cd799439011',
        '1.2.3.4',
        443,
        'tcp',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('PortService');
    });

    it('Domain findings key', () => {
      // Arrange
      const correlationKey = CorrelationKeyUtils.domainCorrelationKey(
        '507f1f77bcf86cd799439011',
        'www.stalker.is',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('DomainsService');
    });
  });
});
