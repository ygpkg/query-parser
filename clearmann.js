console.log("clearmann answer content: ");
console.log("***************  start  *********************");
// 解释下NOT语句的逻辑
// !(a || b)              ---->   !a && !b
// !(a && b)              ---->   !a || !b
// NOT ( k3:v3 OR k4:v4 ) ---->   (NOT k3:v3) AND (NOT k4:v4)
// NOT ( k3:v3 AND k4:v4 ) ---->   (NOT k3:v3) OR (NOT k4:v4)
function parseExpression(expression, mp) {
  // 查看是否为有效的申请号
  function isValidApplicationNumber(input) {
    const regex = /^\d{4}\d{1}\d{7}\.\d{1}|X$/;
    return regex.test(input);
  }
  // 查看是否为有效的中国专利号
  function isValidChinesePatentNumber(input) {
    const regex = /^CN\d{1}\d{8}[A-Za-z](\d)?$/;
    return regex.test(input);
  }
  // 查看括号匹配是否符合
  function checkBracketIntegrity(expression) {
    const mp = { "(": ")", "[": "]", "{": "}" };
    const stack = [];
    let last = false;
    let ex = "";
    let firstMp = false;
    for (let i = 0; i < expression.length; i++) {
      if (firstMp) {
        ex += expression[i];
      }
      if (
        expression[i] === "(" ||
        expression[i] === "[" ||
        expression[i] === "{"
      ) {
        stack.push(expression[i]);
        last = true;
        firstMp = true;
        continue;
      }
      if (
        expression[i] === ")" ||
        expression[i] === "]" ||
        expression[i] === "}"
      ) {
        if (stack.length === 0) return false;
        const p = stack.pop();
        if (mp[p] !== expression[i]) return false;
        if (mp[p] === expression[i] && last) return false;
      }
      last = false;
    }
    return stack.length === 0;
  }

  function isChineseEnglishOnly(str) {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
    return regex.test(str);
  }

  function handleArray(array) {
    return array.map((item) => {
      if (item === "AND" || item === "OR" || item === "NOT") return item;
      return isChineseEnglishOnly(item) ? `ALL:(${item})` : item;
    });
  }

  function splitByFirstColon(input) {
    const colonIndex = input.indexOf(":");
    return colonIndex === -1
      ? [input, ""]
      : [input.slice(0, colonIndex), input.slice(colonIndex + 1)];
  }

  function isParseExpression(input) {
    const pattern = /.*?:\(.*?\).*?/;
    return pattern.test(input);
  }

  function convertStringToArray(input) {
    const regex = /(\w+:\([^()]*(?:\([^()]*\)[^()]*)*\))|([()])|(AND|OR|NOT)/g;
    const result = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(input)) !== null) {
      if (match.index > lastIndex) {
        result.push(input.slice(lastIndex, match.index).trim());
      }
      result.push(match[0]);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < input.length) {
      result.push(input.slice(lastIndex).trim());
    }

    return result.filter((item) => item !== "");
  }

  function extractContent(input) {
    const regex = /^\((.*)\)$/;
    const match = input.match(regex);
    return match ? match[1] : input;
  }

  function parseGroup(isBool = false) {
    let exprs = [];
    let currentOp = "";

    while (expression.length > 0 && expression[0] !== ")") {
      const c = expression.shift();

      if (c === "(") {
        const result = parseGroup(isBool);
        if (result === false) return false;
        exprs.push(result);
      } else if (c === "AND" || c === "OR") {
        const newOp = isBool ? (c === "AND" ? "OR" : "AND") : c;
        if (currentOp === "") {
          currentOp = newOp;
        } else if (currentOp !== newOp) {
          exprs = [{ op: currentOp, exprs }];
          currentOp = newOp;
        }
      } else if (c === "NOT") {
        const result = parseGroup(true);
        if (result === false) return false;
        exprs.push(result);
      } else if (c && c.includes(":")) {
        let [key, value] = splitByFirstColon(c);
        value = extractContent(value);
        if (isParseExpression(value)) return false;
        console.log(key, value);
        if (key === "ALL") {
          exprs.push(
            isBool
              ? { op: "NOT", value: [value] }
              : { op: "multi_match", value: [value] }
          );
        } else {
          if (!mp.has(key)) return false;
          key = mp.get(key);
          exprs.push(
            isBool
              ? { op: "NOT", key, value: [value] }
              : { op: "match", key, value: [value] }
          );
        }
      } else {
        return false;
      }
    }

    if (expression[0] === ")") expression.shift();

    if (exprs.length === 0) {
      return false;
    }

    if (exprs.length === 1 && !currentOp) {
      return exprs[0];
    }
    if (
      (currentOp === "AND" || currentOp === "OR" || currentOp === "NOT") &&
      exprs.length < 2
    ) {
      return false;
    }

    return { op: currentOp || "AND", exprs };
  }

  try {
    if (isValidChinesePatentNumber(expression)) {
      expression = `DOCN:(${expression})`;
    }
    if (isValidApplicationNumber(expression)) {
      expression = `APN:(${expression})`;
    }
    if (!checkBracketIntegrity(expression)) return false;
    console.log("括号匹配成功");
    expression = convertStringToArray(expression);
    if (expression.length === 0) {
      return false;
    }
    console.log("convertStringToArray，resp: ", expression);
    expression = handleArray(expression);
    if (expression.length === 0) {
      return false;
    }
    console.log("handleArray, resp : ", expression);
    const result = parseGroup();
    if (expression.length > 0) {
      return false;
    }
    console.log("parseGroup");
    return result;
  } catch (error) {
    return false;
  }
}

// eg .
const map = new Map();
map
  .set("DOCN", "document_number")
  .set("APN", "application_number")
  .set("k3", "v3")
  .set("k4", "v4")
  .set("k5", "v5");
// expression = "k1:(v*1)"
// expression = "k1:(k2:(v2))"
// expression = "k1:(人工 智能) OR 人工"
// expression = "(NOT k1:(v1)) AND k2:(v2)"
// expression = "NOT (k1:(v1) OR k2:(v2))"
// expression = "k1:(v1) AND (k2:(v2) OR k3:(v3))"
// expression = "ANCS:(功) and TA:(智能 医学) AND DESC:(手术)"
// expression = "k1:(v1) OR k2:(v2) AND (NOT k3:(v3) OR k4:(v4)) AND k5:(v5)"
// expression = "k1:(v1))" // 括号不匹配 返回false
// expression = "k1:(k2:(v2))" // 检索式嵌套 返回false
// expression = "k1:(v1) OR"  // 返回 false
// expression = "k1:(v(1)"  // 返回 false
// expression = "k1:(v1)"  // 返回 false
// expression = "人工:(v1)"  // 如果key不为我们约定的 返回false
// expression = "CN202010379503.X"; // 用户不指定字段搜索时，返回全文的分词检索格式
expression = "人?智能";
console.log(expression);
console.log(JSON.stringify(parseExpression(expression, map), null, 2));
