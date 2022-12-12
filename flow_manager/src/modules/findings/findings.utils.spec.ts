import { Types } from 'mongoose';
import { Domain } from '../database/reporting/domain/domain.model';
import { Host, Port } from '../database/reporting/host/host.model';
import {
  getDomainFindingsCorrelationKey,
  getHostFindingsCorrelationKey,
  getPortFindingsCorrelationKey,
} from './findings.utils';

describe('Finding utils', () => {
  it('Host findings key', () => {
    // Arrange
    const host: Host = {
      ip: '1.2.3.4',
      companyId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      companyName: 'my company',
    };

    // Act
    const lel = getHostFindingsCorrelationKey(host);

    // Assert
    expect(lel).toBe(`company:507f1f77bcf86cd799439011;host:1.2.3.4`);
  });

  it('Port findings key', () => {
    // Arrange
    const host: Host = {
      ip: '1.2.3.4',
      companyId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      companyName: 'my company',
    };

    const port: Port = {
      id: '123',
      port: 443,
    };

    // Act
    const correlationId = getPortFindingsCorrelationKey(host, port);

    // Assert
    expect(correlationId).toBe(
      `company:507f1f77bcf86cd799439011;host:1.2.3.4;port:443`,
    );
  });

  it('Domain findings key', () => {
    // Arrange
    const domain: Domain = {
      companyId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'www.stalker.is',
    };

    // Act
    const correlationId = getDomainFindingsCorrelationKey(domain);

    // Assert
    expect(correlationId).toBe(
      `company:507f1f77bcf86cd799439011;domain:www.stalker.is`,
    );
  });
});
