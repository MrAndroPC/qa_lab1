"use strict";
const add = (a, b = 0) => a + b;
const subtract = (a, b = 0) => a - b;
const multiply = (a, b = 1) => a * b;
const divide = (a, b = 1) => a / b;
const power = (a, b = 1) => Math.pow(a, b);
const sqrt = (a) => Math.sqrt(a);
const withValidation = (operation, validate) => (a, b) => {
    validate(a, b);
    return operation(a, b);
};
const safeDivide = withValidation(divide, (a, b) => {
    if (b === 0)
        throw new Error("Cannot divide by zero");
});
const safeSqrt = withValidation(sqrt, (a) => {
    if (a < 0)
        throw new Error("Negative number under root");
});
const createCalculator = () => {
    let state = {
        currentValue: '0',
        previousValue: null,
        operation: null,
        shouldResetDisplay: false,
        currentExpression: ''
    };
    const updateDisplay = (value) => {
        const display = document.getElementById('display');
        display.textContent = value;
        const expression = document.getElementById('expression');
        expression.textContent = state.currentExpression;
    };
    const handleBackspace = () => {
        if (state.currentValue.length === 1 ||
            (state.currentValue.startsWith('-') && state.currentValue.length === 2)) {
            state = { ...state, currentValue: '0' };
        }
        else {
            state = { ...state, currentValue: state.currentValue.slice(0, -1) };
        }
        updateDisplay(state.currentValue);
    };
    const handleSign = () => {
        if (state.currentValue !== '0') {
            const newValue = state.currentValue.startsWith('-')
                ? state.currentValue.slice(1)
                : `-${state.currentValue}`;
            state = { ...state, currentValue: newValue };
            updateDisplay(newValue);
        }
    };
    const setError = (message) => {
        const error = document.getElementById('error');
        error.textContent = message;
    };
    const clearError = () => setError('');
    const performOperation = () => {
        if (!state.operation || state.previousValue === null)
            return;
        const current = parseFloat(state.currentValue);
        try {
            const result = state.operation(state.previousValue, current);
            state = {
                currentValue: result.toString(),
                previousValue: null,
                operation: null,
                shouldResetDisplay: true,
                currentExpression: `${state.currentExpression} ${current} =`
            };
            clearError();
            updateDisplay(state.currentValue);
        }
        catch (error) {
            setError(error.message);
            state = { ...state, shouldResetDisplay: true };
        }
    };
    const handleNumber = (value) => {
        if (state.shouldResetDisplay) {
            state = { ...state, currentValue: value, shouldResetDisplay: false };
        }
        else {
            state = {
                ...state,
                currentValue: state.currentValue === '0' ? value : state.currentValue + value
            };
        }
        updateDisplay(state.currentValue);
    };
    const handleOperation = (operation, opSymbol, isUnary = false) => {
        try {
            if (!isUnary && state.previousValue !== null && state.operation !== null && !state.shouldResetDisplay) {
                const currentNum = parseFloat(state.currentValue);
                const result = state.operation(state.previousValue, currentNum);
                state = {
                    ...state,
                    currentValue: result.toString(),
                    previousValue: result,
                    operation,
                    currentExpression: `${state.currentExpression} ${currentNum} ${opSymbol}`,
                    shouldResetDisplay: true
                };
            }
            else if (isUnary) {
                const result = operation(parseFloat(state.currentValue));
                state = {
                    ...state,
                    currentValue: result.toString(),
                    shouldResetDisplay: true,
                    currentExpression: `${opSymbol}(${state.currentValue})`
                };
            }
            else {
                state = {
                    ...state,
                    previousValue: parseFloat(state.currentValue),
                    operation,
                    shouldResetDisplay: true,
                    currentExpression: `${state.currentValue} ${opSymbol}`
                };
            }
            updateDisplay(state.currentValue);
            clearError();
        }
        catch (error) {
            state = { ...state, shouldResetDisplay: true };
            setError(error.message);
        }
    };
    const handleClear = () => {
        state = {
            currentValue: '0',
            previousValue: null,
            operation: null,
            shouldResetDisplay: false,
            currentExpression: ''
        };
        updateDisplay('0');
        clearError();
    };
    // Обработка нажатия клавиш
    const handleKeyPress = (event) => {
        const key = event.key;
        // Цифры и точка
        if (/[0-9.]/.test(key)) {
            event.preventDefault();
            if (key === '.' && state.currentValue.includes('.'))
                return;
            handleNumber(key);
            return;
        }
        // Привязки клавиш к операциям
        const keyOperations = {
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '/': 'divide',
            '^': 'power',
            'Enter': 'equals',
            'Escape': 'clear',
            'Delete': 'clear',
            'c': 'clear',
            '=': 'equals',
            'Backspace': 'backspace',
            'r': 'sqrt',
            '_': 'sign'
        };
        const operation = keyOperations[key];
        if (operation) {
            event.preventDefault();
            const button = document.querySelector(`[data-operation="${operation}"]`);
            if (button)
                button.click();
        }
    };
    return {
        handleNumber,
        handleOperation,
        handleClear,
        performOperation,
        handleBackspace,
        handleSign,
        handleKeyPress
    };
};
document.addEventListener('DOMContentLoaded', () => {
    const calculator = createCalculator();
    document.querySelectorAll('[data-value]').forEach(button => {
        button.addEventListener('click', () => {
            const value = button.getAttribute('data-value');
            calculator.handleNumber(value);
        });
    });
    // Ввод с клавиатуры
    document.addEventListener('keydown', calculator.handleKeyPress);
    document.querySelectorAll('[data-operation]').forEach(button => {
        button.addEventListener('click', () => {
            const operation = button.getAttribute('data-operation');
            const operationSymbols = {
                add: '+',
                subtract: '-',
                multiply: '×',
                divide: '÷',
                power: '^',
                sqrt: '√'
            };
            const operations = {
                add,
                subtract,
                multiply,
                divide: safeDivide,
                power,
                sqrt: safeSqrt
            };
            if (operation === 'clear') {
                calculator.handleClear();
                return;
            }
            if (operation === 'equals') {
                calculator.performOperation();
                return;
            }
            if (operation === 'backspace') {
                calculator.handleBackspace();
                return;
            }
            if (operation === 'sign') {
                calculator.handleSign();
                return;
            }
            const isUnary = ['sqrt'].includes(operation);
            calculator.handleOperation(operations[operation], operationSymbols[operation], isUnary);
        });
    });
});
