# 查询语法解析器

## 目标

将查询语法解析器集成到项目中，实现对查询语法的解析，返回解析后的查询对象。 参考`main.js`文件中的`testdata`

## 开发准备

### 本地环境开放

1. 安装依赖
```bash
pnpm install peggy
```
2. 编写`query-language.peggy`文件
3. 执行`generate-parser.js`, 生成`query-language-parser.js`文件
```bash
node generate-parser.js
```
4. 运行`main.js`文件，查看解析结果
```bash
node main.js
```

### Docker环境开发
```bash
docker run -it --net host --name dev-node -v `pwd`:/opt/app/ -w /opt/app registry.cn-beijing.aliyuncs.com/wa/dev:node_20 bash

pnpm install
```