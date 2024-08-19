console.log("clearmann answer content: ")
console.log("***************  start  *********************")
// 解释下NOT语句的逻辑
// !(a || b)              ---->   !a && !b
// !(a && b)              ---->   !a || !b
// NOT ( k3:v3 OR k4:v4 ) ---->   (NOT k3:v3) AND (NOT k4:v4)
// NOT ( k3:v3 AND k4:v4 ) ---->   (NOT k3:v3) OR (NOT k4:v4)
function parseExpression(expression, mp) {

    function checkBracketIntegrity(expression) {
        let mp = {'(': ')', '[': ']', '{': '}'}
        let x = []
        let last = false;
        let ex = ""
        let firstMp = false;
        for (let i = 0; i < expression.length; i++) {
            if (firstMp) {
                ex = ex + expression[i];
            }
            if (expression[i] === '(' || expression[i] === '[' || expression[i] === '{') {
                x.push(expression[i]);
                last = true;
                firstMp = true;
                continue;
            }
            if (expression[i] === ')' || expression[i] === ']' || expression[i] === '}') {
                if (x.length === 0) return false;
                let p = x.pop();
                if (mp[p] !== expression[i]) return false;
                if (mp[p] === expression[i] && last) return false;
            }
            last = false;
        }
        if (isParseExpression(ex)) return false;
        return x.length === 0;
    }

    function isChineseEnglishOnly(str) {
        const regex = /^[\u4e00-\u9fa5a-zA-Z]+$/;
        return regex.test(str);
    }

    function handleArray(array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] === "AND" || array[i] === "OR" || array[i] === "NOT") continue;
            if (isChineseEnglishOnly(array[i])) array[i] = "ALL:(" + array[i] + ")";
        }
        return array;
    }

    function isParseExpression(input) {
        const pattern = /.*?:\(.*?\).*?/;
        return pattern.test(input);
    }

    function convertStringToArray(input) {
        const regex = /(\w+:\([\u4e00-\u9fa5a-zA-Z0-9\s]+\))|([()])|(AND|OR|NOT)/g;
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

        return result.filter(item => item !== '');
    }

    function extractContent(input) {
        const regex = /^\((.*)\)$/;
        const match = input.match(regex);
        return match ? match[1] : input;
    }

    function parseGroup(isBool = false) {
        let exprs = [];
        let currentOp = '';

        while (expression.length > 0 && expression[0] !== ')') {
            const c = expression.shift();

            if (c === '(') {
                const result = parseGroup(isBool);
                if (result === false) return false;
                exprs.push(result);
            } else if (c === "AND" || c === "OR") {
                let newOp = isBool ? (c === "AND" ? "OR" : "AND") : c;
                if (currentOp === '') {
                    currentOp = newOp;
                } else if (currentOp !== newOp) {
                    exprs = [{op: currentOp, exprs}];
                    currentOp = newOp;
                }
            } else if (c === "NOT") {
                const result = parseGroup(true);
                if (result === false) return false;
                exprs.push(result);
            } else if (c && c.includes(':')) {
                let [key, value] = c.split(':');
                value = extractContent(value);
                if (key === "ALL") {
                    exprs.push(isBool ? {op: "NOT", value: [value]} : {op: "multi_match", value: [value]});
                } else {
                    if (!mp.has(key)) return false;
                    key = mp.get(key);
                    exprs.push(isBool ? {op: "NOT", key, value: [value]} : {op: "match", key, value: [value]});
                }
            } else {
                return false;
            }
        }

        if (expression[0] === ')') expression.shift();

        if (exprs.length === 0) {
            return false;
        }

        if (exprs.length === 1 && !currentOp) {
            return exprs[0];
        }
        if ((currentOp === "AND" || currentOp === "OR" || currentOp === "NOT") && exprs.length < 2) {
            return false;
        }

        return {op: currentOp || 'AND', exprs};
    }

    try {
        if (!checkBracketIntegrity(expression)) return false;
        expression = convertStringToArray(expression);
        if (expression.length === 0) {
            return false;
        }
        expression = handleArray(expression);
        if (expression.length === 0) {
            return false;
        }
        const result = parseGroup();
        if (expression.length > 0) {
            return false;
        }
        return result;
    } catch (error) {
        return false;
    }
}

// eg .
map = new Map();
map.set("k1", "v1").set("k2", "v2").set("k3", "v3");
// expression = "k1:(v1)"
// expression = "k1:(人工 智能) OR 人工"
// expression = "(NOT k1:(v1)) AND k2:(v2)"
// expression = "NOT (k1:(v1) OR k2:(v2))"
// expression = "k1:(v1) AND ((k2:(v2) OR k3:(v3))"
// expression = "ANCS:(功) and TA:(智能 医学) AND DESC:(手术)"
// expression = "k1:(v1) OR k2:(v2) AND (NOT k3:(v3) OR k4:(v4)) AND k5:(v5)"
expression = "k1:(v1))" // 括号不匹配 返回false
expression = "k1:(k2:(v2))" // 检索式嵌套 返回false
// expression = "k1:(v1) OR"  // 返回 false
// expression = "k1:(v(1)"  // 返回 false
// expression = "k1:(v:1)"  // 返回 false
// expression = "人工:(v1)"  // 如果key不为我们约定的 返回false
// expression = "人工 NOT 智能"  // 用户不指定字段搜索时，返回全文的分词检索格式
console.log(JSON.stringify(parseExpression(expression, map), null, 2))
