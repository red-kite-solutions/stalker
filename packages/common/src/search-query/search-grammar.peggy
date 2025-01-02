start
  = terms

terms
  = terms:(term (_ term)*)? _? {
      return terms ? [terms[0]].concat(terms[1].map(([_, t]) => t)) : [];
    }

term
  = finding_field_term
  / finding_term
  / not:not? type:(key) ":" _? value:value {
      return { not: not ?? false, type, value };
    }
  / not:not? key:key { 
    return { incomplete: true, not: not ?? false,  type: key, value: null } 
  }
  / not:not? key:finding_field_key { 
    return { incomplete: true, not: not ?? false, key, type: "findingField", value: null } 
  }
  / not:not? key:finding_key { 
    return { incomplete: true, not: not ?? false, key, type: "finding", value: null } 
  }
  / not:not? key:$[a-zA-Z._]+ { 
    return { incomplete: true, not: not ?? false, key, value: null } 
  }

finding_field_term
  = not:not? key:finding_field_key ":" _? value:value {
      return { not: not ?? false, key, value, type: "findingField" };
    }

finding_term
  = not:not? key:finding_key ":" _? value:value {
      return { not: not ?? false, key, value, type: "finding" };
    }

not
  = "-" { return true; } 

value
  = raw_value
  / string
  / exists
  / empty_value

raw_value
  = value:$[a-zA-Z0-9:/.]+ { 
      return value;
    }

empty_value
  = "" { return null; }

string
  = [\"] string:$[a-zA-Z0-9._ :/]+ [\"] { 
      return string;
    }

exists = "exists" { return "exists"; }

finding_field_key
  = "finding." finding_key:$[a-zA-Z0-9]+ "." field_key:$[a-zA-Z0-9]* { 
      return { findingKey: finding_key, fieldKey: field_key };
    }

finding_key
  = "finding" "."? finding_key:$[a-zA-Z0-9]* { 
      return { findingKey: finding_key };
    }

key = domain / host / port / tags / is
domain = "domain" { return "domain"; }
host = "host" { return "host"; }
port = "port" { return "port"; }
tags = "tags" { return "tags"; }
is = "is" { return "is"; }


_ "whitespace"
  = [ \t\n\r]+