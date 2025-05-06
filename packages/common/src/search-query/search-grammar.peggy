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
    return { incomplete: true, not: not ?? false, key, value: null, type: null } 
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
  = value:$[a-zA-Z0-9:_\-:/.\*]+ { 
      return value;
    }

empty_value
  = "" { return null; }

string
  = [\"] string:$[a-zA-Z0-9._\- :/\*]+ [\"] { 
      return string;
    }

exists = "exists" { return "exists"; }

finding_field_key
  = "finding." finding_key:$[a-zA-Z0-9-]+ "." field_key:$[a-zA-Z0-9]* { 
      return { findingKey: finding_key, fieldKey: field_key };
    }

finding_key
  = "finding" "."? finding_key:$[a-zA-Z0-9-]* { 
      return { findingKey: finding_key };
    }

key = project / domain / host / port / tags / other / is

project 
  = "project.name" { return "project.name"; }
  / "project.id" { return "project.id"; }
  / "project" { return "project.name"; }

domain 
  = "domain.name" { return "domain.name"; }
  / "domain.id" { return "domain.id"; }
  / "domain" { return "domain.name"; }

host 
  = "host.ip" { return "host.ip"; }
  / "host.id" { return "host.id"; }
  / "host" { return "host.ip"; }

port 
  = "port.number" { return "port.number"; }
  / "port.id" { return "port.id"; }
  / "port.protocol" { return "port.protocol"; }
  / "port" { return "port.number"; }
  / "port.service" { return "port.service"; }
  / "port.product" { return "port.product"; }
  / "port.version" { return "port.version"; }

tags 
  = "tag.id" { return "tag.id"; }
  / "tag.name" { return "tag.name"; }
  / "tag" { return "tag.name"; }

other
  = "mergedIn.id" { return "mergedIn.id" }

is = "is" { return "is"; }

_ "whitespace"
  = [ \t\n\r]+