import { HttpBadRequestException } from '../../../exceptions/http.exceptions';

export class CorrelationKeyUtils {
  private static buildCorrelationKey(...parts: string[]) {
    return parts.join(';');
  }

  private static projectCorrelationKey(projectId: string) {
    return `project:${projectId}`;
  }

  public static hostCorrelationKey(projectId: string, ip: string) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.projectCorrelationKey(projectId),
      `host:${ip}`,
    );
  }

  public static ipRangeCorrelationKey(
    projectId: string,
    ip: string,
    mask: number,
  ) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.hostCorrelationKey(projectId, ip),
      `mask:${mask}`,
    );
  }

  public static domainCorrelationKey(projectId: string, domainName: string) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.projectCorrelationKey(projectId),
      `domain:${domainName}`,
    );
  }

  public static portCorrelationKey(
    projectId: string,
    ip: string,
    port: number,
    layer4Protocol: string,
  ) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.hostCorrelationKey(projectId, ip),
      `port:${port}`,
      `protocol:${layer4Protocol}`,
    );
  }

  public static generateCorrelationKey(
    projectId: string,
    domainName?: string,
    ip?: string,
    port?: number,
    protocol?: string,
    mask?: number,
  ): string {
    if (!projectId) {
      throw new HttpBadRequestException(
        'ProjectId is required in order to create a correlation key.',
      );
    }

    let correlationKey = null;
    const ambiguousRequest =
      'Ambiguous request; must provide a domainName, an ip, an ip and mask or a combination of ip, port and protocol.';
    if (domainName) {
      if (ip || port || protocol)
        throw new HttpBadRequestException(ambiguousRequest);

      correlationKey = CorrelationKeyUtils.domainCorrelationKey(
        projectId,
        domainName,
      );
    } else if (ip) {
      if (port && protocol && !mask) {
        correlationKey = CorrelationKeyUtils.portCorrelationKey(
          projectId,
          ip,
          port,
          protocol,
        );
      } else if (mask && !port && !protocol) {
        correlationKey = CorrelationKeyUtils.ipRangeCorrelationKey(
          projectId,
          ip,
          mask,
        );
      } else {
        if (port || protocol || mask)
          throw new HttpBadRequestException(ambiguousRequest);
        correlationKey = CorrelationKeyUtils.hostCorrelationKey(projectId, ip);
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
