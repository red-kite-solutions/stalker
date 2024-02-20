import { Finding } from '../findings.service';

const findingFieldNamespace = 'finding';
const memberRegex = /^([^\.]+)(\.(.+))+$/i;
const variableRegex = /^([^\.]+)$/i;

export function executeDsl(command: string, ctx: unknown) {
  const statement = memberRegex.exec(command);
  if (statement) {
    return executeDsl(statement[3], ctx[statement[1]]);
  }

  const variable = variableRegex.exec(command);
  if (variable) {
    return ctx[variable[0]];
  }

  throw new Error(`Invalid syntax ${command}.`);
}

export function prepareContext(finding: Finding) {
  const fields = {};
  for (let field of finding.fields ?? []) {
    if (!field) continue;

    const data = field.data;
    const key = field.key.toLowerCase();
    fields[key] = data;
  }

  for (let key in finding) {
    fields[key.toLowerCase()] = finding[key];
  }

  // Finding native fields like key, ip, host and domain win over field keys. Those can be accessed
  // through their namespaced counterpart, 'finding.xyz'.
  const ctx = {
    ...fields,
    ...finding,
  };

  ctx[findingFieldNamespace] = fields;

  return ctx;
}

function buildVariablePath(...parts: string[]) {
  return parts.join('.');
}
