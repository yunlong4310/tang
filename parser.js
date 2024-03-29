"use strict";
/**
 * 语法分析器
 * 采用了递归下降+LL算法来做语法分析
 */
exports.__esModule = true;
exports.Parser = void 0;
var scanner_1 = require("./scanner");
var ast_1 = require("./ast");
/**
 * 语法解析类
 */
var Parser = /** @class */ (function () {
    function Parser(scanner) {
        /**
         * 二元运算符的优先级。
         */
        this.opPrec = new Map([
            ['=', 2],
            ['+=', 2],
            ['-=', 2],
            ['*=', 2],
            ['-=', 2],
            ['%=', 2],
            ['&=', 2],
            ['|=', 2],
            ['^=', 2],
            ['~=', 2],
            ['<<=', 2],
            ['>>=', 2],
            ['>>>=', 2],
            ['||', 4],
            ['&&', 5],
            ['|', 6],
            ['^', 7],
            ['&', 8],
            ['==', 9],
            ['===', 9],
            ['!=', 9],
            ['!==', 9],
            ['>', 10],
            ['>=', 10],
            ['<', 10],
            ['<=', 10],
            ['<<', 11],
            ['>>', 11],
            ['>>>', 11],
            ['+', 12],
            ['-', 12],
            ['*', 13],
            ['/', 13],
            ['%', 13],
        ]);
        this.scanner = scanner;
    }
    /**
     * 解析Prog
     * 语法规则：
     * prog = (functionDecl | functionCall)* ;
     */
    Parser.prototype.parseProg = function () {
        return new ast_1.Prog(this.parseStatementList());
    };
    Parser.prototype.parseStatementList = function () {
        var stmts = [];
        var t = this.scanner.peek();
        //statementList的Follow集合里有EOF和'}'这两个元素，分别用于prog和functionBody等场景。
        while (t.kind != scanner_1.TokenKind.EOF && t.text != '}') {
            var stmt = this.parseStatement();
            if (stmt != null) {
                stmts.push(stmt);
            }
            else {
            }
            t = this.scanner.peek();
        }
        return stmts;
    };
    /**
     * 解析语句。
     * 在这里，遇到了函数调用、变量声明和变量赋值，都可能是以Identifier开头的情况，所以预读一个Token是不够的，
     * 所以这里预读了两个Token。
     */
    Parser.prototype.parseStatement = function () {
        var t = this.scanner.peek();
        if (t.kind == scanner_1.TokenKind.Keyword && t.text == 'function') {
            return this.parseFunctionDecl();
        }
        else if (t.text == 'let') {
            return this.parseVariableDecl();
        }
        else if (t.kind == scanner_1.TokenKind.Identifier ||
            t.kind == scanner_1.TokenKind.DecimalLiteral ||
            t.kind == scanner_1.TokenKind.IntegerLiteral ||
            t.kind == scanner_1.TokenKind.StringLiteral ||
            t.text == '(') {
            return this.parseExpressionStatement();
        }
        else {
            console.log("Can not recognize a expression starting with: " + this.scanner.peek().text);
            return null;
        }
    };
    /**
     * 解析变量声明
     * 语法规则：
     * variableDecl : 'let'? Identifier typeAnnotation？ ('=' singleExpression) ';';
     */
    Parser.prototype.parseVariableDecl = function () {
        //跳过'let'    
        this.scanner.next();
        var t = this.scanner.next();
        if (t.kind == scanner_1.TokenKind.Identifier) {
            var varName = t.text;
            var varType = 'any';
            var init = null;
            var t1 = this.scanner.peek();
            //类型标注
            if (t1.text == ':') {
                this.scanner.next();
                t1 = this.scanner.peek();
                if (t1.kind == scanner_1.TokenKind.Identifier) {
                    this.scanner.next();
                    varType = t1.text;
                    t1 = this.scanner.peek();
                }
                else {
                    console.log("Error parsing type annotation in VariableDecl");
                    return null;
                }
            }
            //初始化部分
            if (t1.text == '=') {
                this.scanner.next();
                init = this.parseExpression();
            }
            //分号
            t1 = this.scanner.peek();
            if (t1.text == ';') {
                this.scanner.next();
                return new ast_1.VariableDecl(varName, varType, init);
            }
            else {
                console.log("Expecting ; at the end of varaible declaration, while we meet " + t1.text);
                return null;
            }
        }
        else {
            console.log("Expecting variable name in VariableDecl, while we meet " + t.text);
            return null;
        }
    };
    /**
     * 解析函数声明
     * 语法规则：
     * functionDecl: "function" Identifier "(" ")"  functionBody;
     * 返回值：
     * null-意味着解析过程出错。
     */
    Parser.prototype.parseFunctionDecl = function () {
        //跳过关键字'function'
        this.scanner.next();
        var t = this.scanner.next();
        if (t.kind == scanner_1.TokenKind.Identifier) {
            //读取()
            var t1 = this.scanner.next();
            if (t1.text == "(") {
                var t2 = this.scanner.next();
                if (t2.text == ")") {
                    var functionBody = this.parseFunctionBody();
                    if (functionBody != null) {
                        //如果解析成功，从这里返回
                        return new ast_1.FunctionDecl(t.text, functionBody);
                    }
                    else {
                        console.log("Error parsing FunctionBody in FunctionDecl");
                        return null;
                    }
                }
                else {
                    console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                    return null;
                }
            }
            else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t.text);
                return null;
            }
        }
        else {
            console.log("Expecting a function name, while we got a " + t.text);
            return null;
        }
        return null;
    };
    /**
   * 解析函数体
   * 语法规则：
   * functionBody : '{' functionCall* '}' ;
   */
    Parser.prototype.parseFunctionBody = function () {
        var t = this.scanner.peek();
        if (t.text == "{") {
            this.scanner.next();
            var stmts = this.parseStatementList();
            t = this.scanner.next();
            if (t.text == "}") {
                return new ast_1.Block(stmts);
            }
            else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return null;
            }
        }
        else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
            return null;
        }
    };
    /**
     * 解析表达式语句
     */
    Parser.prototype.parseExpressionStatement = function () {
        var exp = this.parseExpression();
        if (exp != null) {
            var t = this.scanner.peek();
            if (t.text == ';') {
                this.scanner.next();
                return new ast_1.ExpressionStatement(exp);
            }
            else {
                console.log("Expecting a semicolon at the end of an expresson statement, while we got a " + t.text);
            }
        }
        else {
            console.log("Error parsing ExpressionStatement");
        }
        return null;
    };
    /**
     * 解析表达式
     */
    Parser.prototype.parseExpression = function () {
        return this.parseBinary(0);
    };
    Parser.prototype.getPrec = function (op) {
        var ret = this.opPrec.get(op);
        if (typeof ret == 'undefined') {
            return -1;
        }
        else {
            return ret;
        }
    };
    /**
     * 采用运算符优先级算法，解析二元表达式。
     * 这是一个递归算法。一开始，提供的参数是最低优先级，
     *
     * @param prec 当前运算符的优先级
     */
    Parser.prototype.parseBinary = function (prec) {
        // console.log("parseBinary : " + prec);
        var exp1 = this.parsePrimary();
        if (exp1 != null) {
            var t = this.scanner.peek();
            var tprec = this.getPrec(t.text);
            //下面这个循环的意思是：只要右边出现的新运算符的优先级更高，
            //那么就把右边出现的作为右子节点。
            /**
             * 对于2+3*5
             * 第一次循环，遇到+号，优先级大于零，所以做一次递归的binary
             * 在递归的binary中，遇到乘号，优先级大于+号，所以形成3*5返回，又变成上一级的右子节点。
             *
             * 反过来，如果是3*5+2
             * 第一次循环还是一样。
             * 在递归中，新的运算符的优先级要小，所以只返回一个5，跟前一个节点形成3*5.
             */
            while (t.kind == scanner_1.TokenKind.Operator && tprec > prec) {
                this.scanner.next(); //跳过运算符
                var exp2 = this.parseBinary(tprec);
                if (exp2 != null) {
                    var exp = new ast_1.Binary(t.text, exp1, exp2);
                    exp1 = exp;
                    t = this.scanner.peek();
                    tprec = this.getPrec(t.text);
                }
                else {
                    console.log("Can not recognize a expression starting with: " + t.text);
                }
            }
            return exp1;
        }
        else {
            console.log("Can not recognize a expression starting with: " + this.scanner.peek().text);
            return null;
        }
    };
    /**
     * 解析基础表达式。
     */
    Parser.prototype.parsePrimary = function () {
        var t = this.scanner.peek();
        //知识点：以Identifier开头，可能是函数调用，也可能是一个变量，所以要再多向后看一个Token，
        //这相当于在局部使用了LL(2)算法。
        if (t.kind == scanner_1.TokenKind.Identifier) {
            if (this.scanner.peek2().text == '(') {
                return this.parseFunctionCall();
            }
            else {
                this.scanner.next();
                return new ast_1.Variable(t.text);
            }
        }
        else if (t.kind == scanner_1.TokenKind.IntegerLiteral) {
            this.scanner.next();
            return new ast_1.IntegerLiteral(parseInt(t.text));
        }
        else if (t.kind == scanner_1.TokenKind.DecimalLiteral) {
            this.scanner.next();
            return new ast_1.DecimalLiteral(parseFloat(t.text));
        }
        else if (t.kind == scanner_1.TokenKind.StringLiteral) {
            this.scanner.next();
            return new ast_1.StringLiteral(t.text);
        }
        else if (t.text == '(') {
            this.scanner.next();
            var exp = this.parseExpression();
            var t1 = this.scanner.peek();
            if (t1.text == ')') {
                this.scanner.next();
                return exp;
            }
            else {
                console.log("Expecting a ')' at the end of a primary expresson, while we got a " + t.text);
                return null;
            }
        }
        else {
            console.log("Can not recognize a primary expression starting with: " + t.text);
            return null;
        }
    };
    /**
     * 解析函数调用
     * 语法规则：
     * functionCall : Identifier '(' parameterList? ')' ;
     * parameterList : StringLiteral (',' StringLiteral)* ;
     */
    Parser.prototype.parseFunctionCall = function () {
        var params = [];
        var t = this.scanner.next();
        if (t.kind == scanner_1.TokenKind.Identifier) {
            var t1 = this.scanner.next();
            if (t1.text == "(") {
                //循环，读出所有参数
                t1 = this.scanner.peek();
                while (t1.text != ")") {
                    var exp = this.parseExpression();
                    if (exp != null) {
                        params.push(exp);
                    }
                    else {
                        console.log("Error parsing parameter in function call");
                        return null;
                    }
                    t1 = this.scanner.peek();
                    if (t1.text != ")") {
                        if (t1.text == ",") {
                            t1 = this.scanner.next();
                        }
                        else {
                            console.log("Expecting a comma at the end of a function call, while we got a " + t1.text);
                            return null;
                        }
                    }
                }
                //消化掉')'
                this.scanner.next();
                return new ast_1.FunctionCall(t.text, params);
            }
        }
        return null;
    };
    return Parser;
}());
exports.Parser = Parser;
