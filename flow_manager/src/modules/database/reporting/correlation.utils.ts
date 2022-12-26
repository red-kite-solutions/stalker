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
  ) {
    return CorrelationKeyUtils.buildCorrelationKey(
      CorrelationKeyUtils.companyCorrelationKey(companyId),
      `host:${ip}`,
      `port:${port}`,
    );
  }
}