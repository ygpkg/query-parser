// 解释下NOT语句的逻辑
// !(a || b)              ---->   !a && !b
// !(a && b)              ---->   !a || !b
// NOT ( k3:v3 OR k4:v4 ) ---->   (NOT k3:v3) AND (NOT k4:v4)
// NOT ( k3:v3 AND k4:v4 ) ---->   (NOT k3:v3) OR (NOT k4:v4)
function parseExpression(expression, mp) {
  function bracketsStack(input) {
    let useBracket = 0
    let unUseBracket = 0
    let ansString = ""
    if (input.length >= 1 ) {
      if (input[0] === '(') {
        unUseBracket ++
      } else {
        ansString += input[0]
      }
    }

    for (let i = 1; i < input.length; i++) {
      if (input[i] === '(') {
        if (input[i - 1] === ':') {
          useBracket ++
          ansString += input[i]
        } else {
          unUseBracket ++
        }
      } else if (input[i] === ')') {
        if (unUseBracket > 0) {
          unUseBracket --
        } else if (useBracket > 0) {
          useBracket --
          ansString += input[i]
        }
      } else ansString += input[i]
    }
    return ansString
  }

  function removeManySpace(input) {
    console.log(input);
    let last = input[0];
    let newInput = last;
    for (let i = 1; i < input.length; i++) {
      if (input[i] === last && last === ' ') continue
      last = input[i];
      newInput = newInput.concat(input[i]);
    }
    return newInput;
  }
  function convertToUpper(input) {
    return input.toUpperCase()
  }
  // 将中文的（）？转化为英文的()?
  function convertChinesePunctuation(input) {
    return input.replace(/？/g, '?')
        .replace(/（/g, '(')
        .replace(/）/g, ')');
  }

  // 查看括号匹配是否符合
  function checkBracketIntegrity(expression) {
    const brackets = { "(": ")", "[": "]", "{": "}" };
    const stack = [];
    let ex = "";
    let firstMp = false;
    for (let i = 0; i < expression.length; i++) {
      ex += firstMp ? expression[i] : ''
      if (expression[i] === "(" || expression[i] === "[" || expression[i] === "{") {
        stack.push(expression[i]);
        firstMp = true;
        continue;
      }
      if (expression[i] === ")" || expression[i] === "]" || expression[i] === "}") {
        if (stack.length === 0) return false;
        const p = stack.pop();
        if (brackets[p] !== expression[i]) return false;
      }
    }
    return stack.length === 0;
  }

  // 处理数组
  function handleArray(array) {
    const regex = /^[^\s:]+:\([^()]+\)$/;
    return array.map((item) => {
      if (item === "AND" || item === "OR" || item === "NOT") return item;
      return !regex.test(item) ? `ALL:(${item})` : item;
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
    if (!input || typeof input !== "string") {
      return [];
    }

    // 处理空格分隔的简单字符串
    if (!input.includes(":") && !input.includes("(") && !input.includes(")")) {
      return input
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => word.trim());
    }

    // 处理复杂表达式
    const regex = /(\w+:\([^()]*(?:\([^()]*\)[^()]*)*\))|([()])|(AND|OR|NOT)/g;
    const result = [];
    let lastIndex = 0;
    let match;

    // 处理匹配项
    while ((match = regex.exec(input)) !== null) {
      // 处理匹配项之前的文本
      if (match.index > lastIndex) {
        const text = input.slice(lastIndex, match.index).trim();
        if (text) {
          // 将空格分隔的文本拆分为单独的词
          const words = text.split(/\s+/).filter((word) => word.length > 0);
          result.push(...words);
        }
      }
      result.push(match[0]);
      lastIndex = regex.lastIndex;
    }

    // 处理剩余文本
    if (lastIndex < input.length) {
      const remainingText = input.slice(lastIndex).trim();
      if (remainingText) {
        const words = remainingText
          .split(/\s+/)
          .filter((word) => word.length > 0);
        result.push(...words);
      }
    }

    // 在相邻的非操作符之间添加 AND
    for (let i = 0; i < result.length - 1; i++) {
      const operators = ["AND", "OR", "NOT", "(", ")"];
      if (
        !operators.includes(result[i]) &&
        !operators.includes(result[i + 1])
      ) {
        result.splice(i + 1, 0, "AND");
        i++;
      }
    }

    return result.filter((item) => item !== "");
  }

  function extractContent(input) {
    if (input.startsWith("(") && input.endsWith(")")) {
      return input.slice(1, -1);
    }
    return input;
  }

  function isFormatData (input) {
    let months = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let inputArry = input.split("-");
    if (inputArry.length <= 0 || inputArry.length > 3) return false;
    let year = Number(inputArry[0]);
    let month = Number(inputArry[1]);
    let day = Number(inputArry[2]);
    if (year % 400 === 0 || (year % 4 === 0 && month % 100 !== 0)) months[2] = 29;
    if (year < 1966 || year > 2999) return false;
    if (month < 1 || month > 12) return false;
    if (day < 0 || day > months[month]) return false;
    return true;
  }
  // 对生成的数组进行处理
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
          // 转移到patent-web项目时候，改掉has和get方法
          // if (!mp[key]) return false;
          // key = mp[key];
          if (!mp.has(key)) return false;
          key = mp.get(key);
          let valueArray = []
          let op = ""
          if (value.includes("TO")) {
            valueArray = value.split("TO");
            for (let i = 0; i < valueArray.length; i++) {
              valueArray[i] = valueArray[i].replace(" ", "");
              if (!isFormatData(valueArray[i])) return false;
            }
            valueArray.sort();
            op = "range";
          } else if (value.includes(">=")) {
            value = value.replace(">=","")
            value = value.replace(" ","")
            valueArray = [value]
            op = "gte";
            if (!isFormatData(value)) return false;
          } else if (value.includes(">")) {
            value = value.replace(">","")
            value = value.replace(" ","")
            valueArray = [value]
            op = "gt";
            if (!isFormatData(value)) return false;
          } else if (value.includes("<=")) {
            value = value.replace("<=","")
            value = value.replace(" ","")
            valueArray = [value]
            op = "lte";
            if (!isFormatData(value)) return false;
          } else if (value.includes("<")) {
            value = value.replace("<","")
            value = value.replace(" ","")
            valueArray = [value]
            op = "lt";
            if (!isFormatData(value)) return false;
          } else {
            valueArray = [value];
            op = isBool ? "NOT" : "match";
          }
          exprs.push({ op, key, value: valueArray });
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
    // 去除多余空格
    expression = removeManySpace(expression)
    console.log("去除多余空格",expression)

    // 字符串转化为大写
    expression = convertToUpper(expression)
    console.log("将字符串转化为大写：",expression)

    // 将中文的括号和问号转化为英文的问号和括号
    expression = convertChinesePunctuation(expression)
    console.log("括号转换：",expression)

    // 查看括号匹配是否符合
    if (!checkBracketIntegrity(expression)) return false;
    console.log("括号匹配成功: ",expression);

    expression = bracketsStack(expression)
    console.log("多余括号处理:",expression)

    // 将字符串处理为数组
    expression = convertStringToArray(expression);
    if (expression.length === 0) {
      return false;
    }
    console.log("将字符串处理为数组: ", expression);

    // 对生成的数组进行处理
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
  .set("k5", "v5")
  .set("ANCS", "ANCS")
  .set("TA", "TA")
  .set("DESC", "DESC")
  .set("TIT", "title")
  .set("DOCN", "document_date")
  .set("APP", "document_date");

// 正确返回的结果
expression = "123 45";
expression = "a b c d";
expression = "k1:（人工 智能) OR 人 工";
// expression = "k1:(v1 v2) AND k3:(v3 v4) k5:(v5v6)";
// expression = "ANCS:(功) AND TA:(智能 医学) AND DESC:(手术)";
// expression = "k1:(v1))"; // 括号不匹配 返回false
// expression = "k1:(k2:(v2))"; // 检索式嵌套 返回false
// expression = "k1:(v1) OR"; // 返回 false
// expression = "k1:(v(1)"; // 返回 false
// expression = "k1:(v1)";
// expression = "人工:(v1)"; // 如果key不为我们约定的 返回false
// expression = "CN202010379503.X"; // 用户不指定字段搜索时，返回全文的分词检索格式
expression = "人工？能";
// expression = "(NOT k1:(v1)) AND k2:(v2)";
// expression = "NOT (k1:(v1) OR k2:(v2))";
// expression = "k1:(v1) AND (k2:(v2) OR k3:(v3))";
// expression = "k1:(v1) OR k2:(v2) AND (NOT k3:(v3) OR k4:(v4)) AND k5:(v5)";
// expression = "TIT:(123)";
expression = "DOCN:(2021 to 2024)";
expression = "docn:(>= 2025-02-29)";
expression = "docn:(> 2028)";
expression = "docn:(2029-02-28 to 2025-02-28)";
// expression = "docn:(<= 2027)";
// expression = "docn:(< 2024)";
// expression = "TIT:(v1)";
// expression = "CN202210744525.0";
// expression = "()汽车（人工()智能）";
// expression = "APP:(航天中认软件测评科技(北京)有限责任公司)";
// expression = "本发明公开了一种代客泊车车速的确定方法、装置、设备及介质。该方法包括：获取目标车辆的实时位置信息和泊车路径信息；根据所述实时位置信息确定所述目标车辆所处的泊车阶段；其中，所述泊车状态包括自动驾驶阶段和自动泊车阶段；根据所述泊车路径信息，确定所述目标车辆在所处泊车阶段时的目标泊车车速。本技术方案，在保证车辆安全性和稳定性的同时，可以提高自主代客泊车的准确性和泊车效率，提升用户体验。";
// 未能正确返回结果的
// expression = "TIT:(v1)";
console.log(expression);
console.log(JSON.stringify(parseExpression(expression, map), null, 2));
