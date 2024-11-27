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
    const correlationKey = CorrelationKeyUtils.portCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      443,
      'tcp',
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp`,
    );
  });

  it('Domain findings key', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.domainCorrelationKey(
      '507f1f77bcf86cd799439011',
      'www.red-kite.io',
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;domain:www.red-kite.io`,
    );
  });

  it('Ip range findings key', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.ipRangeCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      24,
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4;mask:24`,
    );
  });

  it('Website findings key', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      443,
      'example.com',
      '/example/',
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp;domain:example.com;path:/example/`,
    );
  });

  it('Website findings key, no domain', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      443,
      '',
      '/example/',
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp;domain:;path:/example/`,
    );
  });

  it('Website findings key, no path', () => {
    // Arrange
    // Act
    const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
      '507f1f77bcf86cd799439011',
      '1.2.3.4',
      443,
      'example.com',
    );

    // Assert
    expect(correlationKey).toBe(
      `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp;domain:example.com;path:/`,
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
        'www.red-kite.io',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('DomainsService');
    });

    it('Website findings key', () => {
      // Arrange
      const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
        '507f1f77bcf86cd799439011',
        '1.2.3.4',
        443,
        'example.com',
        '/example/',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('WebsiteService');
    });

    it('Website findings key, no domain', () => {
      // Arrange
      const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
        '507f1f77bcf86cd799439011',
        '1.2.3.4',
        443,
        '',
        '/example/',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('WebsiteService');
    });

    it('Website findings key, no path', () => {
      // Arrange
      const correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
        '507f1f77bcf86cd799439011',
        '1.2.3.4',
        443,
        'example.com',
      );

      // Act
      const name = CorrelationKeyUtils.getResourceServiceName(correlationKey);

      // Assert
      expect(name).toBe('WebsiteService');
    });
  });

  describe('Generic key generation', () => {
    it('Host findings key', () => {
      // Arrange
      // Act
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        null,
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
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        null,
        '1.2.3.4',
        443,
        'tcp',
      );

      // Assert
      expect(correlationKey).toBe(
        `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp`,
      );
    });

    it('Domain findings key', () => {
      // Arrange
      // Act
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        'www.red-kite.io',
      );

      // Assert
      expect(correlationKey).toBe(
        `project:507f1f77bcf86cd799439011;domain:www.red-kite.io`,
      );
    });

    it('Ip range findings key', () => {
      // Arrange
      // Act
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        null,
        '1.2.3.4',
        null,
        null,
        24,
      );

      // Assert
      expect(correlationKey).toBe(
        `project:507f1f77bcf86cd799439011;host:1.2.3.4;mask:24`,
      );
    });

    it('Website findings key', () => {
      // Arrange
      // Act
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        'example.com',
        '1.2.3.4',
        443,
        'tcp',
        null,
        '/example/',
      );

      // Assert
      expect(correlationKey).toBe(
        `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp;domain:example.com;path:/example/`,
      );
    });

    it('Website findings key, no domain', () => {
      // Arrange
      // Act
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        '',
        '1.2.3.4',
        443,
        'tcp',
        null,
        '/example/',
      );

      // Assert
      expect(correlationKey).toBe(
        `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp;domain:;path:/example/`,
      );
    });

    it('Website findings key, no path', () => {
      // Arrange
      // Act
      const correlationKey = CorrelationKeyUtils.generateCorrelationKey(
        '507f1f77bcf86cd799439011',
        'example.com',
        '1.2.3.4',
        443,
        'tcp',
        null,
        null,
      );

      // Assert
      expect(correlationKey).toBe(
        `project:507f1f77bcf86cd799439011;host:1.2.3.4;port:443;protocol:tcp;domain:example.com;path:/`,
      );
    });
  });
});
