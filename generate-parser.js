const fs = require("fs");
const peggy = require("peggy");

const grammar = fs.readFileSync("./query-language.peggy", "utf-8");
const parser = peggy.generate(grammar, { output: "source", unicode: true });

fs.writeFileSync("./query-language-parser.js", `module.exports = ${parser}`);