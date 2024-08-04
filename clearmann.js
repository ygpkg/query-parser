console.log("clearmann answer content: ")
console.log("***************  start  *********************")
// 解释下NOT语句的逻辑
// !(a || b)              ---->   !a && !b
// !(a && b)              ---->   !a || !b
// NOT ( k3:v3 OR k4:v4 ) ---->   (NOT k3:v3) AND (NOT k4:v4)
// NOT ( k3:v3 AND k4:v4 ) ---->   (NOT k3:v3) OR (NOT k4:v4)
function parseExpression(expression) {
    function convertStringToArray(input) {
        const regex = /(\w+:\([\u4e00-\u9fa5a-zA-Z0-9\s]+\))|([()])|(AND|OR|NOT)/g;
        const matches = input.match(regex);
        return matches || [];
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
                exprs.push(parseGroup(isBool));
            } else if (c === "AND" || c === "OR") {
                let newOp = isBool ? (c === "AND" ? "OR" : "AND") : c;
                if (currentOp === '') {
                    currentOp = newOp;
                } else if (currentOp !== newOp) {
                    exprs = [{ op: currentOp, exprs }];
                    currentOp = newOp;
                }
            } else if (c === "NOT") {
                exprs.push(parseGroup(true));
            } else {
                let [key, value] = c.split(':');
                value = extractContent(value);
                exprs.push(isBool ? { op: "NOT", key, value:[value] } : { op: "match", key, value:[value] });
            }
        }

        if (expression[0] === ')') expression.shift();

        if (exprs.length === 1 && !currentOp) {
            return exprs[0];
        }

        return { op: currentOp || 'AND', exprs };
    }
    expression = convertStringToArray(expression);
    return parseGroup();
}

// eg .
// expression = "k1:(v1)"
// expression = "(NOT k1:(v1)) AND k2:(v2)"
// expression = "NOT (k1:(v1) OR k2:(v2))"
// expression = "k1:(v1) AND ((k2:(v2) OR k3:(v3))"
// expression = "ANCS:(功) and TA:(智能 医学) AND DESC:(手术)"
expression = "k1:(v1) OR k2:(v2) AND (NOT k3:(v3) OR k4:(v4)) AND k5:(v5)"
console.log(JSON.stringify(parseExpression(expression), null, 2))
