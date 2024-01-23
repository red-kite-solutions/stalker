import { HttpBadRequestException } from '../../../exceptions/http.exceptions';

export class CorrelationKeyUtils {
  private static buildCorrelationKey(...parts: string[]) {
    return parts.join(';');
  }

  private static companyCorrelationKey(companyId: string) {
    return `company:${companyId}`;
  }

  public static hostCorrelationKey(companyId: string, ip: string) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.companyCorrelationKey(companyId),
      `host:${ip}`,
    );
  }

  public static ipRangeCorrelationKey(
    companyId: string,
    ip: string,
    mask: number,
  ) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.hostCorrelationKey(companyId, ip),
      `mask:${mask}`,
    );
  }

  public static domainCorrelationKey(companyId: string, domainName: string) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.companyCorrelationKey(companyId),
      `domain:${domainName}`,
    );
  }

  public static portCorrelationKey(
    companyId: string,
    ip: string,
    port: number,
    layer4Protocol: string,
  ) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.hostCorrelationKey(companyId, ip),
      `port:${port}`,
      `protocol:${layer4Protocol}`,
    );
  }

  public static generateCorrelationKey(
    companyId: string,
    domainName?: string,
    ip?: string,
    port?: number,
    protocol?: string,
    mask?: number,
  ): string {
    if (!companyId) {
      throw new HttpBadRequestException(
        'CompanyId is required in order to create a correlation key.',
      );
    }

    let correlationKey = null;
    const ambiguousRequest =
      'Ambiguous request; must provide a domainName, an ip, an ip and mask or a combination of ip, port and protocol.';
    if (domainName) {
      if (ip || port || protocol)
        throw new HttpBadRequestException(ambiguousRequest);

      correlationKey = CorrelationKeyUtils.domainCorrelationKey(
        companyId,
        domainName,
      );
    } else if (ip) {
      if (port && protocol && !mask) {
        correlationKey = CorrelationKeyUtils.portCorrelationKey(
          companyId,
          ip,
          port,
          protocol,
        );
      } else if (mask && !port && !protocol) {
        correlationKey = CorrelationKeyUtils.ipRangeCorrelationKey(
          companyId,
          ip,
          mask,
        );
      } else {
        if (port || protocol || mask)
          throw new HttpBadRequestException(ambiguousRequest);
        correlationKey = CorrelationKeyUtils.hostCorrelationKey(companyId, ip);
      }
    } else if (port) {
      throw new HttpBadRequestException(
        'The ip must be specified with the port.',
      );
    } else {
      throw new HttpBadRequestException(
        'Correlation key must contain at least a domain or a host.',
      );
    }

    return correlationKey;
  }
}
