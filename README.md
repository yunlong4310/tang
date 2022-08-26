# tang
tang是一个强类型的解释型编程语言

现支持以下特性：
1.支持String，Decimal，Integer，Boolean类型的变量声明及赋值
2.支持二元表达式
3.支持函数声明及调用

语法规则如下：
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

解释执行：
ast解释执行

在语义上：
支持函数引用消解，
支持变量引用消解

执行命令：
node tang xxx.ts

安装依赖
npm i --save-dev @types/node

编译js
tsc tang.ts
