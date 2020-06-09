"use strict";

const ZERO_CONST = new Const(0);
const ONE_CONST = new Const(1);
const NEGATE_CONST = new Const(-1);

function UnaryOperation(a) {
    this.first = a;
}
UnaryOperation.prototype.evaluate = function(x, y, z) { return this.calc(this.first.evaluate(x, y, z)) };
UnaryOperation.prototype.toString = function() { return this.first.toString() + " " + this.opSign };
UnaryOperation.prototype.prefix = function() { return '(' + this.opSign + " " + this.first.prefix() + ')' };
UnaryOperation.prototype.postfix = function() { return '(' + this.first.postfix() + " " + this.opSign + ')' };
UnaryOperation.prototype.printArgs = UnaryOperation.prototype.postfix;

function Sinh(a) {
    UnaryOperation.call(this, a);
}
Sinh.prototype = Object.create(UnaryOperation.prototype);
Sinh.prototype.opSign = "sinh";
Sinh.prototype.calc = (a) => (Math.sinh(a));
Sinh.prototype.diff = function(diffVarName) { return new MultiplyBinary(new Cosh(this.first), this.first.diff(diffVarName)) };

function Cosh(a) {
    UnaryOperation.call(this, a);
}
Cosh.prototype = Object.create(UnaryOperation.prototype);
Cosh.prototype.opSign = "cosh";
Cosh.prototype.calc = (a) => (Math.cosh(a));
Cosh.prototype.diff = function(diffVarName) { return new MultiplyBinary(new Sinh(this.first), this.first.diff(diffVarName)) };

function Const(a) {
    this.first = a;
}
Const.prototype.toString = function() { return this.first.toString() };
Const.prototype.evaluate = function() { return this.first };
Const.prototype.diff = () => ZERO_CONST;
Const.prototype.prefix = Const.prototype.toString;
Const.prototype.postfix = Const.prototype.toString;
Const.prototype.printArgs = Const.prototype.toString;

function Variable(variableName) {
    this.variableName = variableName;
}
Variable.prototype.arrayOfPossibleNames = ['x', 'y', 'z'];
Variable.prototype.toString = function () { return this.variableName };
Variable.prototype.prefix = Variable.prototype.toString;
Variable.prototype.postfix = Variable.prototype.toString;
Variable.prototype.printArgs = Variable.prototype.toString;
Variable.prototype.evaluate = function () { return arguments[this.arrayOfPossibleNames.indexOf(this.variableName)] };
Variable.prototype.diff = function (varToDiff) {
    if (varToDiff === undefined || varToDiff === this.variableName)
        return ONE_CONST;
    else
        return ZERO_CONST;
};

function Negate(a) {
    UnaryOperation.call(this, a);
}
Negate.prototype = Object.create(UnaryOperation.prototype);
Negate.prototype.opSign = "negate";
Negate.prototype.calc = (a) => -(a);
Negate.prototype.diff = function(diffVarName) {
    return new MultiplyBinary(this.first.diff(diffVarName), NEGATE_CONST);
};


function BinaryOperation(first, second) {
    this.first = first;
    this.second = second;
}
BinaryOperation.prototype.evaluate = function(x, y, z) {
    return this.calc(this.first.evaluate(x, y, z), this.second.evaluate(x, y, z));
};
BinaryOperation.prototype.toString = function() {
    return this.first.toString() + ' ' + this.second.toString() + ' ' + this.opSign;
};
BinaryOperation.prototype.printArgs = function() {
    return this.first.printArgs() + ' ' + this.second.printArgs();
};
BinaryOperation.prototype.prefix = function() {
    return '(' + this.opSign + ' ' + this.first.prefix() + ' ' + this.second.prefix() + ')';
};
BinaryOperation.prototype.postfix = function() {
    return '(' + this.first.postfix() + ' ' + this.second.postfix() + ' ' + this.opSign + ')';
};

function AddBinary(a, b) {
    BinaryOperation.call(this, a, b);
}
AddBinary.prototype = Object.create(BinaryOperation.prototype);
AddBinary.prototype.opSign = "+";
AddBinary.prototype.calc = (first, second) => (first + second);
AddBinary.prototype.diff = function(diffVar) {
     return new AddBinary(this.first.diff(diffVar), this.second.diff(diffVar));
};

function SubtractBinary(a, b) {
    BinaryOperation.call(this, a, b);
}
SubtractBinary.prototype = Object.create(BinaryOperation.prototype);
SubtractBinary.prototype.opSign = "-";
SubtractBinary.prototype.calc = (first, second) => (first - second);
SubtractBinary.prototype.diff = function (diffVar) {
    return new SubtractBinary(this.first.diff(diffVar), this.second.diff(diffVar));
};

function MultiplyBinary(a, b) {
    BinaryOperation.call(this, a, b);
}
MultiplyBinary.prototype = Object.create(BinaryOperation.prototype);
MultiplyBinary.prototype.opSign = "*";
MultiplyBinary.prototype.calc = (first, second) => (first * second);
MultiplyBinary.prototype.diff = function (diffVar) {
    return new AddBinary(new MultiplyBinary(this.first.diff(diffVar), this.second),
        new MultiplyBinary(this.first, this.second.diff(diffVar)));
};

function DivideBinary(a, b) {
    BinaryOperation.call(this, a, b);
}
DivideBinary.prototype = Object.create(BinaryOperation.prototype);
DivideBinary.prototype.opSign = "/";
DivideBinary.prototype.calc = (first, second) => (first / second);
DivideBinary.prototype.diff = function (diffVarName) {
    return new DivideBinary(new SubtractBinary(new MultiplyBinary(this.first.diff(diffVarName), this.second),
        new MultiplyBinary(this.first, this.second.diff(diffVarName))), new MultiplyBinary(this.second, this.second))
};

function Power(a, b) {
    BinaryOperation.call(this, a, b);
}
Power.prototype = Object.create(BinaryOperation.prototype);
Power.prototype.opSign = "pow";
Power.prototype.calc = (first, second) => (Math.pow(first, second));
Power.prototype.diff = function (diffVarName) {
    return new MultiplyBinary(new Power(this.first, this.second),
        new AddBinary(new MultiplyBinary(this.second.diff(diffVarName), new Log(new Const(Math.E), this.first)),
            new MultiplyBinary(new DivideBinary(this.second, this.first), this.first.diff(diffVarName))));
};

function Log(a, b) {
    BinaryOperation.call(this, a, b);
}
Log.prototype = Object.create(BinaryOperation.prototype);
Log.prototype.opSign = "log";
Log.prototype.calc = (first, second) => (Math.log(Math.abs(second)) / Math.log(Math.abs(first)));
Log.prototype.diff = function (diffVarName) {
    return new DivideBinary(new SubtractBinary(new MultiplyBinary(new DivideBinary(new Log(new Const(Math.E), this.first), this.second),
        this.second.diff(diffVarName)), new MultiplyBinary(new DivideBinary(new Log(new Const(Math.E), this.second), this.first), this.first.diff(diffVarName))),
        new MultiplyBinary(new Log(new Const(Math.E), this.first), new Log(new Const(Math.E), this.first)))
};


function NaryOperation(args, binOpConstructor) {
    args = args.length === 1 && args[0] instanceof Array ? args[0] : args;
    this.value = args.reduce((sum, cur) =>
        sum = new binOpConstructor(sum, cur));
}
NaryOperation.prototype.evaluate = function (x, y, z) { return this.value.evaluate(x, y, z) };
NaryOperation.prototype.toString = function() { return this.value.toString() };
NaryOperation.prototype.diff = function(diffVar) { return this.value.diff(diffVar) };
NaryOperation.prototype.prefix = function() { return this.value.prefix() };
NaryOperation.prototype.postfix = function() { return this.value.postfix() };
NaryOperation.prototype.printArgs = function() { return this.value.printArgs() };

function Add() {
    NaryOperation.call(this, Array.prototype.slice.call(arguments), AddBinary);
}
Add.prototype = Object.create(NaryOperation.prototype);

function Subtract() {
    NaryOperation.call(this, Array.prototype.slice.call(arguments), SubtractBinary);
}
Subtract.prototype = Object.create(NaryOperation.prototype);

function Multiply() {
    NaryOperation.call(this, Array.prototype.slice.call(arguments), MultiplyBinary);
}
Multiply.prototype = Object.create(NaryOperation.prototype);

function Divide() {
    NaryOperation.call(this, Array.prototype.slice.call(arguments), DivideBinary);
}
Divide.prototype = Object.create(NaryOperation.prototype);


function MultiArgOperation(args, func, opSign) {
    this.opSign = opSign;
    this.args = args[0] instanceof Array ? args[0] : args;
    if (this.args.length > 1) {
        this.value = func(this.args);
    } else if (this.args.length === 1)
        this.value = this.args[0];
    else
        this.value = ZERO_CONST;
}
MultiArgOperation.prototype.evaluate = function (x, y, z) { return this.value.evaluate(x, y, z) };
MultiArgOperation.prototype.diff = function(diffVar) { return this.value.diff(diffVar) };
MultiArgOperation.prototype.prefix = function() {
    let stringOfArgs = this.args.reduce((finalString, current) => {
        return finalString += " " + current.prefix()
    }, "");
    return "(" + this.opSign + (stringOfArgs.length === 0 ? " " : stringOfArgs) + ")";
};
MultiArgOperation.prototype.postfix = function() {
    let stringOfArgs = this.args.reduce((finalString, current) => {
        return finalString += current.postfix() + " "
    }, "");
    return "(" + (stringOfArgs.length === 0 ? " " : stringOfArgs) + this.opSign + ")";
};

function Avg() {
    MultiArgOperation.call(this, Array.prototype.slice.call(arguments), arr => new Divide(new Add(arr), new Const(arr.length)),
        "avg");
}
Avg.prototype = Object.create(MultiArgOperation.prototype);

function Sum() {
    MultiArgOperation.call(this, Array.prototype.slice.call(arguments), arr => new Add(arr), "sum");
}
Sum.prototype = Object.create(MultiArgOperation.prototype);


function parsePostfix(expression) {
    expression = expression.split(/\ +/).reverse().filter((tok) => tok.length > 0);
    let opstack = [], argstack = [], brstack = [], token = expression.pop();

    if (token === undefined)
        throw Error("Empty expression\n");

    let countInsideBraces = function() {
        let argsInBrAmnt = 0, opInBrAmnt = 0;

        while ((expression.length !== 0 || token.length !== 0)) {
            if (token.length === 0)
                token = expression.pop();
            let char = token.charAt(0);

            switch (char) {
                case '(':
                    brstack.push(char);
                    token = token.substring(1);
                    countInsideBraces();
                    argsInBrAmnt++;
                    break;
                case ')':
                    if (brstack.pop() !== '(')
                        throw Error("Unnecessary close braces. Missing \'(\'\n");
                    if (opInBrAmnt === 0)
                        throw Error("No operation in braces (" + argsInBrAmnt + " args)\n");
                    return; ///Return
                case 'x':
                case 'y':
                case 'z':
                    argstack.push(new Variable(char));
                    argsInBrAmnt++;
                    break;
                case '*':
                case '/':
                case '+':
                    opstack.push(char);
                    opInBrAmnt++;
                    break;
                case '-':
                    if (!/^-\d+/.test(token)) {
                        opstack.push(char);
                        opInBrAmnt++;
                        break;
                    }
                default: {
                    let num = token.match(/^-?\d+/);
                    if (num !== null) {
                        num = num.pop();
                        if (!isNaN(Number.parseInt(num))) {
                            argstack.push(new Const(Number.parseInt(num)));
                            token = token.substring(num.length - 1);
                            argsInBrAmnt++;
                            break;
                        }
                    } else {
                        let expr = token.match(/^(negate|sum|avg)/); /* add (negate|sin|cos...) */
                        if (expr === null)
                            throw Error("Unhandled token\n");
                        switch (expr[0]) {
                            case "negate":
                                opstack.push("negate");
                                break;
                            case "sum":
                                opstack.push("sum");
                                break;
                            case "avg":
                                opstack.push("avg");
                                break;
                        }
                        token = token.substring(expr[0].length - 1);
                        opInBrAmnt++;
                    }
                    break;
                }
            }
            token = token.substring(1);
            if (opInBrAmnt > 0) {
                if (opInBrAmnt > 1)
                    throw Error("Two operations in brackets\n");
                processOperation(argsInBrAmnt);
            }
        }

        if (opstack.length !== 0)
            processOperation(argsInBrAmnt);
        if (brstack.length !== 0)
            throw Error("Unclosed bracket. Missing \')\'\n");
        else if (argstack.length > 1)
            throw Error("Operation or argument missed. Excessive info\n");
        else if (argstack.length === 0)
            throw Error("Empty expression\n");
    };

    let processOperation = function (argsAmount) {
        if (opstack.length === 0)
            throw Error("Operations expected\n");

        let opSign = opstack.pop();
        let args = argstack.splice(argstack.length - argsAmount, argsAmount);
        switch (opSign) {
            case "negate":
                if (argsAmount > 1)
                    throw Error("Wrong args amount for unary operation (" + argsAmount + " args)\n");
                else if (args.length === 0)
                    throw Error("Operation without argument\n");
                argstack.push(new Negate(args[0]));
                break;
            case "avg":
                argstack.push(new Avg(args));
                break;
            case "sum":
                argstack.push(new Sum(args));
                break;
            default:
                if (argsAmount !== 2 || args.length < 2)
                    throw Error("Wrong arguments amount for binary operation (" + argsAmount + " arguments)\n");

                switch (opSign) {
                    case "+":
                        argstack.push(new Add(args));
                        break;
                    case '-':
                        argstack.push(new Subtract(args));
                        break;
                    case '*':
                        argstack.push(new Multiply(args));
                        break;
                    case '/':
                        argstack.push(new Divide(args));
                        break;
                    default:
                        throw Error("invalid operation sign\n");
                }
                break;
        }
    };

    countInsideBraces();
    /*    if (!(argstack[0] instanceof Const))
            throw Error("Can only parse const\n");*/

    return argstack.pop();
}

function parse(expression) {
    return expression.split(/ +/).reduce((stack, current_object) => {
        if (current_object.length !== 0) {
            switch (current_object) {
                case 'x':
                case 'y':
                case 'z':
                    stack.push(new Variable(current_object));
                    break;
                default:
                    if (String(Number(current_object)) !== "NaN") {
                        stack.push(new Const(Number(current_object)));
                        break;
                    }
                    let b = stack.pop();
                    switch (current_object) {
                        case "negate":
                            stack.push(new Negate(b));
                            break;
                        case "sinh":
                            stack.push(new Sinh(b));
                            break;
                        case "cosh":
                            stack.push(new Cosh(b));
                            break;
                        default:
                            let a = stack.pop();
                            switch (current_object) {
                                case "pow":
                                    stack.push(new Power(a, b));
                                    break;
                                case "log":
                                    stack.push(new Log(a, b));
                                    break;
                                case '/':
                                    stack.push(new Divide(a, b));
                                    break;
                                case '*':
                                    stack.push(new Multiply(a, b));
                                    break;
                                case '+':
                                    stack.push(new Add(a, b));
                                    break;
                                case '-':
                                    stack.push(new Subtract(a, b));
                                    break;
                                default:
                                    /* throw exception */
                                    break;
                            }
                            break;
                    }
                    break;
            }
        }
        return stack;
    }, []).pop();
}

/*function parsePrefix(expression) {
    let tmp = expression.split(/\ +/).reverse().filter((tok) => tok.length > 0);
    let opstack = [], argstack = [], brstack = [], token = tmp.pop();

    let countBraces = function() {
        let argsInBrAmnt = 0, opInBrAmnt = 0, isPostfix = /^\(?([xyz]|\d)/.test(token);

        while ((tmp.length !== 0 || token.length !== 0)) {
            if (token.length === 0)
                token = tmp.pop();
            let char = token.charAt(0);

            switch (char) {
                case '(':
                    brstack.push(char);
                    token = token.substring(1);
                    countBraces();
                    argsInBrAmnt++;
                    break;
                case ')':
                    if (opstack.length > brstack.length)
                        throw Error("Two binary operators in brackets\n");
                    else if (brstack.pop() !== '(')
                        throw Error("Unnecessary close brackets\n");
                    processOperation(isPostfix, argsInBrAmnt);
                    // token = token.substring(1);
                    return; ///Return
                case 'x':
                case 'y':
                case 'z':
                    argstack.push(new Variable(char));
                    argsInBrAmnt++;
                    break;
                case '*':
                case '/':
                case '+':
                    opstack.push(char);
                    opInBrAmnt++;
                    break;
                case '-':
                    if (!/-\d+/.test(token)) {
                        opstack.push(char);
                        opInBrAmnt++;
                        break;
                    }
                default: {
                    let num = token.match(/-?\d+/);
                    if (num !== null) {
                        num = num.pop();
                        if (!isNaN(Number.parseInt(num))) {
                            argstack.push(new Const(Number.parseInt(num)));
                            token = token.substring(num.length - 1);
                            argsInBrAmnt++;
                            break;
                        }
                    } else {
                        let expr = token.match(/^(negate|sin|cos)/); /!* add (negate|sin|cos...) *!/
                        switch (expr[0]) {
                            case "negate":
                                opstack.push("negate");
                                token = token.substring("negate".length - 1);
                                break;
                            default:
                                throw Error("Unhandled token\n");
                        }
                        opInBrAmnt++;
                    }
                }
            }
            token = token.substring(1);
            if (isPostfix) {
                if (opInBrAmnt > 0) {
                    processOperation(isPostfix, argsInBrAmnt);
                    break;
                }
            }
        }

        if (brstack.length !== 0)
            throw Error("Unclosed bracket\n");
        else if (tmp.length !== 0)
            throw Error("Incorrect arguments and operations order\n");
        else if (argstack.length > 1)
            throw Error("Operation or argument missed\n");
        if (opstack.length !== 0)
            processOperation(isPostfix, argsInBrAmnt);
    };

    let processOperation = function (isPostfix, argsAmount) {
        if (opstack.length !== 0) {
            let opSign = opstack.pop();
            switch (opSign) {
                case "negate":
                    argstack.push(new Negate(argstack.pop()));
                    break;
                default:
                    let args = [];
                    if (argsAmount < 2)
                        throw Error("Missing second argument for " +
                            isPostfix ? "multiple arguments" : "binary" + " operation\n");
                    else if (!isPostfix && argsAmount > 2)
                        throw Error("Too many arguments for binary operation\n");

                    args = argstack.splice(argstack.length - argsAmount, argsAmount);
                    if (argsAmount > 2)
                        throw Error("Too many arguments for binary operation\n");
                    switch (opSign) {
                        case "+":
                            argstack.push(new Add(args));
                            break;
                        case '-':
                            argstack.push(new Subtract(args));
                            break;
                        case '*':
                            argstack.push(new Multiply(args));
                            break;
                        case '/':
                            argstack.push(new Divide(args));
                            break;
                        default:
                            throw Error("invalid operation sign\n");
                    }
                    break;
            }
        } else if (argstack.length > 1)
            throw Error("Two arguments without operation\n");
    };

    countBraces();

    return argstack.pop();
}*/
