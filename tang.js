"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var scanner_1 = require("./scanner");
var ast_1 = require("./ast");
var parser_1 = require("./parser");
var semantic_1 = require("./semantic");
/**
 * 简易版AST解析器：遍历AST，并执行
 */
var Intepretor = /** @class */ (function (_super) {
    __extends(Intepretor, _super);
    function Intepretor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        //存储变量值的区域
        _this.values = new Map();
        return _this;
    }
    /**
     * 运行函数调用。
     */
    Intepretor.prototype.visitFunctionCall = function (functionCall) {
        if (functionCall.name == "println") { //内置函数
            if (functionCall.parameters.length > 0) {
                var retVal = this.visit(functionCall.parameters[0]);
                if (typeof retVal.variable == 'object') {
                    retVal = this.getVariableValue(retVal.variable.name);
                }
                console.log(retVal);
            }
            else {
                console.log();
            }
            return 0;
        }
        else { //找到函数定义，继续遍历函数体
            if (functionCall.decl != null) {
                this.visitBlock(functionCall.decl.body);
            }
        }
    };
    /**
     * 变量声明
     * 如果存在变量初始化部分，要存下变量值。
     */
    Intepretor.prototype.visitVariableDecl = function (variableDecl) {
        if (variableDecl.init != null) {
            var v = this.visit(variableDecl.init);
            if (this.isLeftValue(v)) {
                v = this.getVariableValue(v.variable.name);
            }
            this.setVariableValue(variableDecl.name, v);
            return v;
        }
    };
    /**
     * 获取变量的值。
     * 这里给出的是左值。左值既可以赋值（写），又可以获取当前值（读）。
     */
    Intepretor.prototype.visitVariable = function (v) {
        return new LeftValue(v);
    };
    Intepretor.prototype.getVariableValue = function (varName) {
        return this.values.get(varName);
    };
    Intepretor.prototype.setVariableValue = function (varName, value) {
        return this.values.set(varName, value);
    };
    Intepretor.prototype.isLeftValue = function (v) {
        return typeof v.variable == 'object';
    };
    Intepretor.prototype.visitBinary = function (bi) {
        var ret;
        var v1 = this.visit(bi.exp1);
        var v2 = this.visit(bi.exp2);
        var v1left = null;
        var v2left = null;
        if (this.isLeftValue(v1)) {
            v1left = v1;
            v1 = this.getVariableValue(v1left.variable.name);
            console.log("value of " + v1left.variable.name + " : " + v1);
        }
        if (this.isLeftValue(v2)) {
            v2left = v2;
            v2 = this.getVariableValue(v2left.variable.name);
        }
        switch (bi.op) {
            case '+':
                ret = v1 + v2;
                break;
            case '-':
                ret = v1 - v2;
                break;
            case '*':
                ret = v1 * v2;
                break;
            case '/':
                ret = v1 / v2;
                break;
            case '%':
                ret = v1 % v2;
                break;
            case '>':
                ret = v1 > v2;
                break;
            case '>=':
                ret = v1 >= v2;
                break;
            case '<':
                ret = v1 < v2;
                break;
            case '<=':
                ret = v1 <= v2;
            case '&&':
                ret = v1 && v2;
                break;
            case '||':
                ret = v1 || v2;
                break;
            case '=':
                if (v1left != null) {
                    this.setVariableValue(v1left.variable.name, v2);
                }
                else {
                    console.log("Assignment need a left value: ");
                }
                break;
            default:
                console.log("Unsupported binary operation: " + bi.op);
        }
        return ret;
    };
    return Intepretor;
}(ast_1.AstVisitor));
/**
 * 左值。
 * 暂时只支持变量。
 */
var LeftValue = /** @class */ (function () {
    function LeftValue(variable) {
        this.variable = variable;
    }
    return LeftValue;
}());
// 编译及运行代码
function compileAndRun(program) {
    //输出源代码
    console.log("====源代码内容===:");
    console.log(program);
    //词法分析
    console.log("\n====词法分析结果====:");
    var tokenizer = new scanner_1.Scanner(new scanner_1.CharStream(program));
    while (tokenizer.peek().kind != scanner_1.TokenKind.EOF) {
        console.log(tokenizer.next());
    }
    //重置tokenizer,回到开头。
    tokenizer = new scanner_1.Scanner(new scanner_1.CharStream(program));
    //语法分析
    var prog = new parser_1.Parser(tokenizer).parseProg();
    console.log("\n===语法分析后的AST===:");
    prog.dump("tang---");
    //语义分析
    var symTable = new semantic_1.SymTable();
    new semantic_1.Enter(symTable).visit(prog); //建立符号表
    new semantic_1.RefResolver(symTable).visit(prog); //引用消解
    console.log("\n===语义分析后的AST===");
    prog.dump("tang---");
    //运行程序
    console.log("\n===运行程序===:");
    var retVal = new Intepretor().visit(prog);
    console.log("===返回值：" + retVal);
}
//处理命令行参数，从文件里读取源代码
var process = require("process");
// 要求命令行的第三个参数，一定是一个文件名。格式：node tang test.ts
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}
// 读取并运行代码
var fs = require('fs');
var filename = process.argv[2];
fs.readFile(filename, 'utf8', function (err, data) {
    if (err)
        throw err;
    compileAndRun(data);
});
