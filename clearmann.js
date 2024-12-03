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
    const brackets = { "(": ")", "[": "]", "{": "}" };
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
        if (brackets[p] !== expression[i]) return false;
        if (brackets[p] === expression[i] && last) return false;
      }
      last = false;
    }
    return stack.length === 0;
  }

  function isChineseEnglishOnly(str) {
    const regex = /^[\u4e00-\u9fa5a-zA-Z0-9?*]+$/;
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
    const parts = input.split(":");
    if (parts.length < 2) return false;

    const key = parts[0];
    const value = parts.slice(1).join(":");

    const openParenIndex = value.indexOf("(");
    const closeParenIndex = value.indexOf(")");

    return (
      openParenIndex !== -1 &&
      closeParenIndex !== -1 &&
      openParenIndex < closeParenIndex
    );
  }

  function convertStringToArray(input) {
    // 步骤1: 首先处理字段限定符(如TIT:)
    const fieldPattern = /(\w+:\([^()]*\))/g;

    // 步骤2: 临时替换字段表达式
    let tempInput = input;
    const fieldExpressions = [];
    let fieldMatch;

    while ((fieldMatch = fieldPattern.exec(input)) !== null) {
      const placeholder = `__FIELD${fieldExpressions.length}__`;
      tempInput = tempInput.replace(fieldMatch[0], placeholder);
      fieldExpressions.push(fieldMatch[0]);
    }

    // 步骤3: 分割字符串
    const parts = tempInput
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.trim());

    // 步骤4: 处理结果数组
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (part === "AND" || part === "OR" || part === "NOT") {
        result.push(part);
        continue;
      }

      if (part.startsWith("__FIELD")) {
        const index = parseInt(part.match(/\d+/)[0]);
        result.push(fieldExpressions[index]);

        // 如果不是最后一个元素，且下一个不是操作符，添加 AND
        if (
          i < parts.length - 1 &&
          !["AND", "OR", "NOT"].includes(parts[i + 1])
        ) {
          result.push("AND");
        }
      } else {
        // 处理普通词语
        result.push(part.includes(":") ? part : `ALL:(${part})`);
      }
    }

    return result;
  }

  function extractContent(input) {
    if (input.startsWith("(") && input.endsWith(")")) {
      return input.slice(1, -1);
    }
    return input;
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
        console.log(key, value);
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
    // 查看是否为有效的中国专利号
    if (isValidChinesePatentNumber(expression)) {
      expression = `DOCN:(${expression})`;
    }
    // 查看是否为有效的申请号
    if (isValidApplicationNumber(expression)) {
      expression = `APN:(${expression})`;
    }
    // 查看括号匹配是否符合
    if (!checkBracketIntegrity(expression)) return false;
    console.log("括号匹配成功");
    // 将字符串处理为数组
    expression = convertStringToArray(expression);
    if (expression.length === 0) {
      return false;
    }
    console.log("将字符串处理为数组: ", expression);
    expression = handleArray(expression);
    if (expression.length === 0) {
      return false;
    }

    console.log("对生成的数组进行处理: ", expression);
    const result = parseGroup();
    if (expression.length > 0) {
      return false;
    }
    console.log("解析结果: ", result);
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
  .set("k1", "k1")
  .set("k2", "v2")
  .set("k3", "v3")
  .set("k4", "v4")
  .set("k5", "v5");
expression = "123 45";
// expression = "a b c d";
// expression = "k1:(v?1)";
// expression = "k1:(k2:(v2))"
expression = "k1:(人工 智能) OR 人 工";
// expression = "k1:(v1 v2) AND k3:(v3 v4) k5:(v5v6)";
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
// expression = "人工*能";
console.log(expression);
console.log(JSON.stringify(parseExpression(expression, map), null, 2));
