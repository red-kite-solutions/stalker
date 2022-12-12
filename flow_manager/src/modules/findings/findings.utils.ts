import { Domain } from '../database/reporting/domain/domain.model';
import { Host, Port } from '../database/reporting/host/host.model';

function buildFindingsCorrelationKey(...parts: string[]) {
  return parts.join(';');
}

function getCompanyFindingsCorrelationKey(companyId: string) {
  return `company:${companyId}`;
}

export function getHostFindingsCorrelationKey(host: Host) {
  return buildFindingsCorrelationKey(
    getCompanyFindingsCorrelationKey(host.companyId.toString()),
    `host:${host.ip}`,
  );
}

export function getDomainFindingsCorrelationKey(domain: Domain) {
  return buildFindingsCorrelationKey(
    getCompanyFindingsCorrelationKey(domain.companyId.toString()),
    `domain:${domain.name}`,
  );
}

export function getPortFindingsCorrelationKey(host: Host, port: Port) {
  return buildFindingsCorrelationKey(
    getCompanyFindingsCorrelationKey(host.companyId.toString()),
    `host:${host.ip}`,
    `port:${port.port}`,
  );
}
