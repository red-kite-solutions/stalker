start
  = terms:(term ws?)* {
      return terms.map(t => t[0]);
  }
term
  = incomplete_not_term
  / finding_field_term
  / finding_term
  / ws_efore_key:ws? not:not? key:(key) ws_after_key:ws? colon:":"? ws_before_value:ws? val:value ws_after_value:ws? {
      const incomplete = !colon || val.incomplete;
      return {
        not: not ?? false,
        type: key.resolved,
        originalType: key.original,
        value: val.value,
        hasColon: colon !== null,
        quoteBefore: val.quoteBefore,
        quoteAfter: val.quoteAfter,
        incomplete,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: ws_after_key?.length ?? 0,
        spacesBeforeValue: ws_before_value?.length ?? 0,
        spacesAfterValue: ws_after_value?.length ?? 0
      };
    }
  / ws_before_key:ws? not:not? key:key {
      return {
        incomplete: true,
        not: not ?? false,
        type: key.resolved,
        originalType: key.original,
        value: null,
        hasColon: false,
        quoteBefore: false,
        quoteAfter: false,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: 0,
        spacesBeforeValue: 0,
        spacesAfterValue: 0
      };
    }
  / ws_before_key:ws? not:not? key:finding_field_key {
      return {
        incomplete: true,
        not: not ?? false,
        key,
        type: "findingField",
        originalType: "finding." + key.findingKey + "." + key.fieldKey,
        value: null,
        hasColon: false,
        quoteBefore: false,
        quoteAfter: false,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: 0,
        spacesBeforeValue: 0,
        spacesAfterValue: 0
      };
    }
  / ws_before_key:ws? not:not? key:finding_key {
      return {
        incomplete: true,
        not: not ?? false,
        key,
        type: "finding",
        originalType: "finding." + key.findingKey,
        value: null,
        hasColon: false,
        quoteBefore: false,
        quoteAfter: false,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: 0,
        spacesBeforeValue: 0,
        spacesAfterValue: 0
      };
    }
  / ws_before_key:ws? not:not? key:$[a-zA-Z._]+ ws_after_key:ws? colon:":"? ws_before_value:ws? val:value ws_after_value:ws? {
      const incomplete = !colon || val.incomplete;
      return {
        not: not ?? false,
        type: "unknown",
        originalType: key,
        value: val.value,
        hasColon: colon !== null,
        quoteBefore: val.quoteBefore,
        quoteAfter: val.quoteAfter,
        incomplete,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: ws_after_key?.length ?? 0,
        spacesBeforeValue: ws_before_value?.length ?? 0,
        spacesAfterValue: ws_after_value?.length ?? 0
      };
    }
  / invalid_token_term

invalid_token_term
  = ws_before_key:ws? token:invalid_token ws_after_key:ws? {
      return {
        type: "unknown",
        originalType: token,
        value: null,
        hasColon: false,
        quoteBefore: false,
        quoteAfter: false,
        incomplete: true,
        not: false,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: ws_after_key?.length ?? 0,
        spacesBeforeValue: 0,
        spacesAfterValue: 0
      };
  }

invalid_token
  = chars:$[^ \t\r\n]+ { return chars; }

finding_field_term
  = ws_before_key:ws? not:not? key:finding_field_key ws_after_key:ws? colon:":"? ws_before_value:ws? val:value ws_after_value:ws? {
      const original = "finding." + key.findingKey + "." + key.fieldKey;
      const incomplete = !colon || val.incomplete;
      return {
        not: not ?? false,
        key,
        type: "findingField",
        originalType: original,
        value: val.value,
        hasColon: colon !== null,
        quoteBefore: val.quoteBefore,
        quoteAfter: val.quoteAfter,
        incomplete,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: ws_after_key?.length ?? 0,
        spacesBeforeValue: ws_before_value?.length ?? 0,
        spacesAfterValue: ws_after_value?.length ?? 0
      };
  }

finding_term
  = ws_before_key:ws? not:not? key:finding_key ws_after_key:ws? colon:":"? ws_before_value:ws? val:value ws_after_value:ws? {
      const original = "finding." + key.findingKey;
      const incomplete = !colon || val.incomplete;
      return {
        not: not ?? false,
        key,
        type: "finding",
        originalType: original,
        value: val.value,
        hasColon: colon !== null,
        quoteBefore: val.quoteBefore,
        quoteAfter: val.quoteAfter,
        incomplete,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: ws_after_key?.length ?? 0,
        spacesBeforeValue: ws_before_value?.length ?? 0,
        spacesAfterValue: ws_after_value?.length ?? 0
      };
  }

not = "-" { return true; }

incomplete_not_term
  = ws_before_key:ws? not:not ws_after_key:ws? ![a-zA-Z0-9] {
      return {
        not,
        type: null,
        originalType: null,
        value: null,
        hasColon: false,
        quoteBefore: false,
        quoteAfter: false,
        incomplete: true,
        spacesBeforeKey: ws_before_key?.length ?? 0,
        spacesAfterKey: ws_after_key?.length ?? 0,
        spacesBeforeValue: 0,
        spacesAfterValue: 0
      };
  }

value
  = quoted_value / raw_value / exists / empty_value

quoted_value
  = '"' val:$([^"\r\n]*) '"' {
      return { value: val, quoteBefore: true, quoteAfter: true, incomplete: false };
  }
  / '"' val:$[^"\r\n]* {
      return { value: val, quoteBefore: true, quoteAfter: false, incomplete: true };
  }

raw_value
  = val:$[a-zA-Z0-9:_\-:/.*]+ {
      return { value: val, quoteBefore: false, quoteAfter: false, incomplete: false };
  }

exists = "exists" {
    return { value: "exists", quoteBefore: false, quoteAfter: false, incomplete: false };
}

empty_value = "" {
    return { value: null, quoteBefore: false, quoteAfter: false, incomplete: true };
}

finding_field_key
  = "finding." finding_key:$[a-zA-Z0-9-]+ "." field_key:$[a-zA-Z0-9]* {
      return { findingKey: finding_key, fieldKey: field_key };
  }

finding_key
  = "finding" "."? finding_key:$[a-zA-Z0-9-]* {
      return { findingKey: finding_key };
  }

key = project / domain / host / port / ipRange / website / tags / other / is

project
  = "project.name" { return { original: "project.name", resolved: "project.name" }; }
  / "project.id" { return { original: "project.id", resolved: "project.id" }; }
  / "project" { return { original: "project", resolved: "project.name" }; }

domain
  = "domain.name" { return { original: "domain.name", resolved: "domain.name" }; }
  / "domain.id" { return { original: "domain.id", resolved: "domain.id" }; }
  / "domain" { return { original: "domain", resolved: "domain.name" }; }

host
  = "host.ip" { return { original: "host.ip", resolved: "host.ip" }; }
  / "host.id" { return { original: "host.id", resolved: "host.id" }; }
  / "host" { return { original: "host", resolved: "host.ip" }; }

port
  = "port.number" { return { original: "port.number", resolved: "port.number" }; }
  / "port.id" { return { original: "port.id", resolved: "port.id" }; }
  / "port.protocol" { return { original: "port.protocol", resolved: "port.protocol" }; }
  / "port" { return { original: "port", resolved: "port.number" }; }
  / "port.service" { return { original: "port.service", resolved: "port.service" }; }
  / "port.product" { return { original: "port.product", resolved: "port.product" }; }
  / "port.version" { return { original: "port.version", resolved: "port.version" }; }

ipRange
  = "ipRange.id" { return { original: "ipRange.id", resolved: "ipRange.id" }; }
  / "ipRange.cidr" { return { original: "ipRange.cidr", resolved: "ipRange.cidr" }; }
  / "ipRange" { return { original: "ipRange", resolved: "ipRange.cidr" }; }

website
  = "website.id" { return { original: "website.id", resolved: "website.id" }; }

tags
  = "tag.id" { return { original: "tag.id", resolved: "tag.id" }; }
  / "tag.name" { return { original: "tag.name", resolved: "tag.name" }; }
  / "tag" { return { original: "tag", resolved: "tag.name" }; }

other
  = "mergedIn.id" { return { original: "mergedIn.id", resolved: "mergedIn.id" }; }

is
  = "is" { return { original: "is", resolved: "is" }; }

ws "whitespace"
  = space:$[ \t\r\n]+ { return space; }
