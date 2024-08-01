console.log("clearmann answer content: ")
console.log("***************  start  *********************")

function evalExpression(expression) {
    const value = [];
    const op = [];
    const pr = { "or": 1, "and": 2, "not": 2 };

    //
    function eval() {
        const exprs = [];
        while (value.length && typeof value[value.length - 1] === "object") {
            exprs.unshift(value.pop());
        }
        const c = op.pop();
        const x = {
            op: c,
            exprs
        };
        value.push(x);
    }
    // 通过':'分割为两个字符串
    function splitAtFirstColon(str) {
        const index = str.indexOf(':');
        if (index === -1) {
            return [str, ''];
        }
        const part1 = str.substring(0, index);
        const part2 = str.substring(index + 1);
        return [part1, part2];
    }

    const l = expression.length;
    for (let i = 0; i < l; i ++) {
        const c = expression[i];
        if (c === '(') {
            op.push(c);
        } else if (c === ')') {
            while (op.length && op[op.length - 1] !== '(') eval();
            op.pop();
        } else if (c === "and" || c === "or") {
            while (op.length && pr[op[op.length - 1]] >= pr[c]) eval();
            op.push(c);
        } else {
            const  splitArray =  splitAtFirstColon(c)
            value.push({
                key: splitArray[0],
                value: splitArray[1]
            });
        }
    }
    while (op.length) eval();
    return value.pop();
}
let expression = ["k1:v1", "or", "k2:v2"];
console.log(expression)
console.log(JSON.stringify(evalExpression(expression), null, 2));
expression = ["(", "k1:v1", "or", "k2:v2", ")", "and", "k3:v3"];
console.log(expression)
console.log(JSON.stringify(evalExpression(expression), null, 2));