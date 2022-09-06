# tang
tang是一个强类型的解释型编程语言。

【现支持以下特性】：
1.支持变量声明及赋值
2.支持一、二元表达式
3.支持函数声明及调用
4.通过作用域的方式支持函数内外部的变量
5.支持if条件、for循环语句

【语法规则如下】：
prog = statementList? EOF、
statementList = (variableDecl | functionDecl | expressionStatement)+ 
variableDecl : 'let' Identifier typeAnnotation？ ('=' singleExpression) ';'
typeAnnotation : ':' typeName
functionDecl: "function" Identifier "(" ")"  functionBody
functionBody : '{' statementList? '}' 
statement: functionDecl | expressionStatement
expressionStatement: expression ';' 
expression: primary (binOP primary)* 
primary: StringLiteral | DecimalLiteral | IntegerLiteral | functionCall | '(' expression ')' 
binOP: '+' | '-' | '*' | '/' | '=' | '+=' | '-=' | '*=' | '/=' | '==' | '!=' | '<=' | '>=' | '<'
      | '>' | '&&'| '||'|...
functionCall : Identifier '(' parameterList? ')' 
parameterList : expression (',' expression)* 

【语义规则如下】：
支持函数引用消解
支持变量引用消解
支持变量作用域

【运行时】：
AST解释执行

【安装依赖】：
npm i --save-dev @types/node

【编译js】：
tsc

【执行命令】：
node tang test.ts
