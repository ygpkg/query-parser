Query
  = expr:KeyExpr { return expr; }
  / _ expr:OrExpr _ { return expr; }

OrExpr
  = head:AndExpr tail:(_ "OR"i _ AndExpr)* {
      return {
        op: "or",
        exprs: [head, ...tail.map(t => t[3])]
      };
    }

AndExpr
  = head:BracketExpr tail:(_ "AND"i _ BracketExpr)* {
    return {
      op: "and",
      exprs: [head, ...tail.map(t => t[3])]
    };
  }

BracketExpr
  = "(" _ expr:Query _ ")" {
      return expr;
    }
  / KeyExpr

NotExpr
  = not:"NOT"i _ value:Value {
      return {
        op: "not",
        exprs: [{ value: [value] }]
      };
    }
  / KeyExpr

OrValues
  = head:Value tail:(_ "OR"i _ Value)* {
      return [head, ...tail.map(t => t[3])];
    }

KeyExpr
  = key:Key ":" _ value:Value {
      return {
        op: "match",
        key: key,
        value: [value]
      };
    }
  / key:Key _ ":(NOT"i _ value:Value ")" {
      return {
        op: "not",
        key: key,
        exprs: [{ value: [value] }]
      };
    }
  / value:Value {
      return {
        value: [value]
      };
    }

Key
  = [A-Za-z0-9]+ {
    return text();
  }

Value
  = [\p{Any}\p{L}\p{N}\p{P}\x00-\x7F]+ {
    return text();
  }

_ "whitespace"
  = [\p{Z} \t\n\r]*