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

  public static websiteCorrelationKey(
    projectId: string,
    ip: string,
    port: number,
    domainName: string = '',
    path: string = '/',
  ) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.portCorrelationKey(projectId, ip, port, 'tcp'),
      `domain:${domainName}`,
      `path:${path}`,
    );
  }

  /**
   * Valid combinations are:
   *
   * - project correlation key: requires only the projectId
   * - domain correlation key: [domainName]
   * - host correlation key: [ip]
   * - ip range correlation key: [ip,mask]
   * - port correlation key: [ip,port,protocol]
   * - website correlation key: [ip,port,domainName,path]
   *
   * For a website correlation key, the domain name can be an empty string
   * @param projectId
   * @param domainName
   * @param ip
   * @param port
   * @param protocol
   * @param mask
   * @param path For a website. Should always start with a /
   * @returns A correlation key that corresponds to the resource
   */
  public static generateCorrelationKey(
    projectId: string,
    domainName?: string,
    ip?: string,
    port?: number,
    protocol?: string,
    mask?: number,
    path?: string,
  ): string {
    if (!projectId) {
      throw new HttpBadRequestException(
        'ProjectId is required in order to create a correlation key.',
      );
    }

    if (!domainName && !ip && !port && !protocol && !mask && !path) {
      return CorrelationKeyUtils.projectCorrelationKey(projectId);
    }

    if (path && !domainName) {
      domainName = '';
    }

    let correlationKey = null;
    const ambiguousRequest =
      'Ambiguous request for correlation key; Valid combinations are: [domainName], [ip], [ip,mask], [ip,port,protocol] and [ip,port,domainName,path]';
    if (domainName || domainName === '') {
      if (ip || port || protocol) {
        if (!ip || !port) throw new HttpBadRequestException(ambiguousRequest);

        path = path ? path : '/';
        domainName = domainName ?? '';

        correlationKey = CorrelationKeyUtils.websiteCorrelationKey(
          projectId,
          ip,
          port,
          domainName,
          path,
        );
      } else if (domainName) {
        correlationKey = CorrelationKeyUtils.domainCorrelationKey(
          projectId,
          domainName,
        );
      }
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

  /**
   * Gets the proper service name from a correlation key
   * @param correlationKey A valid correlation key
   * @returns
   */
  public static getResourceServiceName(
    correlationKey: string,
  ):
    | 'PortService'
    | 'DomainsService'
    | 'HostService'
    | 'WebsiteService'
    | null {
    // Host match
    if (correlationKey.match(/^project\:[a-f0-9]{24}\;host\:.+/)?.length > 0) {
      // Port match
      if (
        correlationKey.match(/.+\;port\:\d{1,5}\;protocol\:(tcp|udp)(\;.+)?$/)
          ?.length > 0
      ) {
        // Website match
        if (correlationKey.match(/.+\;domain\:.*\;path\:\/.*$/)?.length > 0) {
          return 'WebsiteService';
        } else {
          return 'PortService';
        }
      } else return 'HostService';
    }

    // Domain match
    if (correlationKey.match(/^project\:[a-f0-9]{24}\;domain\:.+$/)?.length > 0)
      return 'DomainsService';

    return null;
  }
}
