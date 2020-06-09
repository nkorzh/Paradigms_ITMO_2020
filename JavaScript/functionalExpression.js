"use strict";

function binaryOp(a, b, oper) {
    return (x, y, z) => oper(a(x, y, z), b(x, y, z));
}

function unaryOp(a, oper) {
    return (x, y, z) => oper(a(x, y, z));
}

function negate(a) {
    return unaryOp(a, (a) => -a);
}

function sin(a) {
    return unaryOp(a, (a) => Math.sin(a));
}

function cos(a) {
    return unaryOp(a, (a) => Math.cos(a));
}

function cnst(a) {
    return () => a;
}

function pi() {
    return Math.PI;
}

function e() {
    return Math.E;
}

function naryOp(operation, args) {
    return args.reduce((res, cur) =>
        res = binaryOp(res, cur, operation));
}

function multiply() {
    return naryOp((a, b) => a * b, Array.prototype.slice.call(arguments));
}

function divide() {
    return naryOp((a, b) => a / b, Array.prototype.slice.call(arguments));
}

function add() {
    return naryOp((a, b) => a + b, Array.prototype.slice.call(arguments));
}

function subtract() {
    return naryOp((a, b) => a - b, Array.prototype.slice.call(arguments));
}

function parse(expression) {
    return expression.split(/ +/).reduce((stack, current_object) => {
        if (current_object.length !== 0) {
            switch (current_object) {
                case 'x':
                case 'y':
                case 'z':
                    stack.push(variable(current_object));
                    break;
                case "pi":
                    stack.push(pi);
                    break;
                case "e":
                    stack.push(e);
                    break;
                default:
                    if (String(Number(current_object)) !== "NaN") {
                        stack.push(cnst(Number(current_object)));
                        break;
                    }
                    let b = stack.pop();
                    switch (current_object) {
                        case "negate":
                            stack.push(negate(b));
                            break;
                        case "sin":
                            stack.push(sin(b));
                            break;
                        case "cos":
                            stack.push(cos(b));
                            break;
                        default:
                            let a = stack.pop();
                            switch (current_object) {
                                case '/':
                                    stack.push(divide(a, b));
                                    break;
                                case '*':
                                    stack.push(multiply(a, b));
                                    break;
                                case '+':
                                    stack.push(add(a, b));
                                    break;
                                case '-':
                                    stack.push(subtract(a, b));
                                    break;
                                default:
                                    /* throw exception */
                                    break;
                            }
                    }
                    break;
            }
        }
        return stack;
    }, []).pop();
}

function variable(variableName) {
    let varNumber = ['x', 'y', 'z'].indexOf(variableName);
    return (...args) => args[varNumber];
}
