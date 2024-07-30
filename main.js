const parser = require("./query-language-parser");

testdata = {
    "Key1:Value1": '{"key":"Key1","value":["Value1"]}',
    "Key1:NOT Value1": '{"op":"NOT","key":"Key1","value":["Value1"]}',
    "Key1:'Val ue1'": '{"key":"Key1","value":["s你好啊"]}',
    'Key1:"Val ue1"': '{"key":"Key1","value":["Val ue1"]}',
    'Key1:NOT "Val ue1"': '{"op":"NOT","key":"Key1","value":["Val ue1"]}',
    "Key1:(Value1)": '{"op":"OR","exprs":[{{"key":"Key1","value":["Value1"]}]}',
    "Key1:(Value1 OR Value2)": '{"op":"OR","exprs":[{{"key":"Key1","value":["Value1"]},{"key":"Key1","value":["Value2"]}]}',
    "Key1:(Value1 OR NOT Value2)": '{"op":"OR","exprs":[{{"key":"Key1","value":["Value1"]}, {"op":"NOT","key":"Key1","value":["Value2"]}]}',
    "NOT Key1:(Value1 OR Value2)": '{"op":"OR","exprs":[{{"op":"NOT","key":"Key1","value":["Value1"]},{"op":"NOT","key":"Key1","value":["Value2"]}]}',
    "Key1:(Value1 AND Value2)": '{"op":"AND","exprs":[{{"key":"Key1","value":["Value1"]},{"key":"Key1","value":["Value2"]}]}',
    "Key1:(Value1 AND NOT Value2)": '{"op":"AND","exprs":[{"key":"Key1","value":["Value1"]},{"op":"NOT","key":"Key1","value":["Value2"]}]}',
    "Key1:(Value1 NOT Value2)": '{"op":"AND","exprs":[{"key":"Key1","value":["Value1"]},{"op":"NOT","key":"Key1","value":["Value2"]}]}',
    "NOT Key1:Value1": '{"op":"NOT","exprs":[{"key":"Key1","value":["Value1"]}]}',
    "Key1:Value1 AND Key2:Value2": '{"op":"AND","exprs":[{"key":"Key1","value":["Value1"]},{"key":"Key2","value":["Value2"]}]}',
    "Key1:(Value1 OR Value2)": '{"op":"OR","exprs":[{"key":"Key1","value":["Value1"]},{"key":"Key1","value":["Value2"]}]}',
    "Key1:(Value1 AND Value2)": '{"op":"AND","exprs":[{"key":"Key1","value":["Value1"]},{"key":"Key1","value":["Value2"]}]}',
    "Key1:Value1 AND (Key2:Value2 OR Key3:Value3)": '{"op":"AND","exprs":[{"key":"Key1","value":["Value1"]},{"op":"OR","exprs":[{"key":"Key2","value":["Value2"]},{"key":"Key3","value":["Value3"]}]}]}',
    "Key1:Value1 AND Key2:(Value2 OR Value3)": '{"op":"AND","exprs":[{"key":"Key1","value":["Value1"]},{"op":"OR","exprs":[{"key":"Key2","value":["Value2"]},{"key":"Key2","value":["Value3"]}]}]}',
    "DESC:(手术 NOT (疾病 OR 发明))": '{"op":"AND","exprs":[{"key":"DESC","value":["手术"]},{"op":"OR","exprs":[{"op":"NOT","key":"DESC","value":["疾病"]},{"op":"NOT","key":"DESC","value":["发明"]}]}]}',
    "ANCS:(功) and TA:(智能 OR 医学) AND DESC:(手术 NOT (疾病 OR 发明))": '{"op":"AND","exprs":[{"key":"ANCS","value":["功"]},{"op":"OR","exprs":[{"key":"TA","value":["智能"]},{"key":"TA","value":["医学"]}]},{"op":"AND","exprs":[{"key":"DESC","value":["手术"]},{"op":"OR","exprs":[{"op":"NOT","key":"DESC","value":["疾病"]},{"op":"NOT","key":"DESC","value":["发明"]}]}]}]}',
}
// const queryStr = "Key1:Value1 AND (Key2:(Value2 OR Value3)) OR Key3:(NOT Value4)";
const queryStr = "Key1:Value1";
// const queryStr = "Key1:s你好啊";
// const queryStr = "Key1:Value1 AND Key2:Value2";
console.log("Query String:", parser);


const queryObj = parser.parse(queryStr);

console.log("Query Object:", JSON.stringify(queryObj));

function queryObjToStr(queryObj) {
    if (queryObj.key) {
        return `${queryObj.key}:${queryObj.value[0]}`;
    }

    const op = queryObj.op;
    const exprs = queryObj.exprs.map(queryObjToStr);

    if (op === "NOT") {
        return `${op} ${exprs[0]}`;
    }

    return exprs.join(` ${op} `);
}

const reconstructedQueryStr = queryObjToStr(queryObj);
console.log("Reconstructed Query String:", reconstructedQueryStr);