console.log("clearmann answer content: ")
console.log("***************  start  *********************")
// 解释下not语句的逻辑
// !(a || b)              ---->   !a && !b
// not ( k3:v3 or k4:v4 ) ---->   (not k3:v3) and (not k4:v4)
function parseExpression(expression) {
    function parseGroup(isBool = false) {
        let exprs = [];
        let currentOp = '';

        while (expression.length > 0 && expression[0] !== ')') {
            const c = expression.shift();

            if (c === '(') {
                exprs.push(parseGroup(isBool));
            } else if (c === "and" || c === "or") {
                let newOp = isBool ? (c === "and" ? "or" : "and") : c;
                if (currentOp === '') {
                    currentOp = newOp;
                } else if (currentOp !== newOp) {
                    exprs = [{ op: currentOp, exprs }];
                    currentOp = newOp;
                }
            } else if (c === "not") {
                exprs.push(parseGroup(true));
            } else {
                const [key, value] = c.split(':');
                exprs.push(isBool ? { op: "not", key, value } : { key, value });
            }
        }

        if (expression[0] === ')') expression.shift();

        if (exprs.length === 1 && !currentOp) {
            return exprs[0];
        }

        return { op: currentOp || 'and', exprs };
    }

    return parseGroup();
}

// eg.
// let expression = ["k1:v1", "or", "k2:v2"];                                      √
// let expression = ["(", "k1:v1", "or", "k2:v2", ")", "and", "k3:v3"];            √
let expression = ["(", "k1:v1", "or", "k2:v2", ")", "and", "not", "(", "k3:v3", "or", "k4:v4", ")"];
console.log(expression)
console.log(JSON.stringify(parseExpression(expression), null, 2));