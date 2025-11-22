type Operation = (a: number, b?: number) => number;

const add: Operation = (a, b = 0) => a + b;
const subtract: Operation = (a, b = 0) => a - b;
const multiply: Operation = (a, b = 1) => a * b;
const divide: Operation = (a, b = 1) => a / b;
const power: Operation = (a, b = 1) => Math.pow(a, b);
const sqrt: Operation = (a) => Math.sqrt(a);

const withValidation = (
    operation: Operation,
    validate: (a: number, b?: number) => void
): Operation => (a, b) => {
    validate(a, b);
    return operation(a, b);
};

const safeDivide = withValidation(divide, (a, b) => {
    if (b === 0) throw new Error("Cannot divide by zero");
});

const safeSqrt = withValidation(sqrt, (a) => {
    if (a < 0) throw new Error("Negative number under root");
});


type CalculatorState = {
    currentValue: string;
    previousValue: number | null;
    operation: Operation | null;
    shouldResetDisplay: boolean;
    currentExpression: string;
};

const createCalculator = () => {
    let state: CalculatorState = {
        currentValue: '0',
        previousValue: null,
        operation: null,
        shouldResetDisplay: false,
        currentExpression: ''
    };

    const updateDisplay = (value: string) => {
        const display = document.getElementById('display')!;
        display.textContent = value;

        const expression = document.getElementById('expression')!;
        expression.textContent = state.currentExpression;
    };
  
    const handleBackspace = () => {
        if (state.currentValue.length === 1 || 
           (state.currentValue.startsWith('-') && state.currentValue.length === 2)) {
            state = { ...state, currentValue: '0' };
        } else {
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
    
    const setError = (message: string) => {
        const error = document.getElementById('error')!;
        error.textContent = message;
    };

    const clearError = () => setError('');

    const performOperation = () => {
        if (!state.operation || state.previousValue === null) return;
        
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
        } catch (error: any) {
            setError(error.message);
            state = { ...state, shouldResetDisplay: true };
        }
    };

    const handleNumber = (value: string) => {
        if (state.shouldResetDisplay) {
            state = { ...state, currentValue: value, shouldResetDisplay: false };
        } else {
            state = { 
                ...state, 
                currentValue: state.currentValue === '0' ? value : state.currentValue + value 
            };
        }
        updateDisplay(state.currentValue);
    };

const handleOperation = (operation: Operation, opSymbol: string, isUnary: boolean = false) => {
    try {
        if (!isUnary && state.previousValue !== null && state.operation !== null && !state.shouldResetDisplay) {
            const currentNum = parseFloat(state.currentValue);
            const result = state.operation!(state.previousValue!, currentNum);
            state = {
                ...state,
                currentValue: result.toString(),
                previousValue: result,
                operation,
                currentExpression: `${state.currentExpression} ${currentNum} ${opSymbol}`,
                shouldResetDisplay: true
            };
        } else if (isUnary) {
            const result = operation(parseFloat(state.currentValue));
            state = {
                ...state,
                currentValue: result.toString(),
                shouldResetDisplay: true,
                currentExpression: `${opSymbol}(${state.currentValue})`
            };
        } else {
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
    } catch (error: any) {
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
    const handleKeyPress = (event: KeyboardEvent) => {
        const key = event.key;
        
        // Цифры и точка
        if (/[0-9.]/.test(key)) {
            event.preventDefault();
            if (key === '.' && state.currentValue.includes('.')) return;
            handleNumber(key);
            return;
        }
    
        // Привязки клавиш к операциям
        const keyOperations: { [key: string]: string } = {
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
            if (button) (button as HTMLElement).click();
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
            const value = button.getAttribute('data-value')!;
            calculator.handleNumber(value);
        });
    });
    // Ввод с клавиатуры
    document.addEventListener('keydown', calculator.handleKeyPress);
    document.querySelectorAll('[data-operation]').forEach(button => {
        button.addEventListener('click', () => {
            const operation = button.getAttribute('data-operation')!;
            const operationSymbols: { [key: string]: string } = {
                add: '+',
                subtract: '-',
                multiply: '×',
                divide: '÷',
                power: '^',
                sqrt: '√'
            };            
            const operations: { [key: string]: Operation } = {
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