class Calculator {
  /**
   * Creates a new Calculator instance.
   * @param {HTMLElement} previousOperandTextElement - The display element for the previous operand.
   * @param {HTMLElement} currentOperandTextElement - The display element for the current operand.
   */
  constructor(previousOperandTextElement, currentOperandTextElement) {
    this.previousOperandTextElement = previousOperandTextElement;
    this.currentOperandTextElement = currentOperandTextElement;
    this.clear(); // Initialize the calculator state
  }

  /**
   * Clears all operands and selected operation, resetting the calculator to its initial state.
   */
  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = undefined;
    this.lastResult = null; // Store the last computed result if needed for chaining
  }

  /**
   * Deletes the last character from the current operand.
   * If the current operand becomes empty, it defaults to '0'.
   */
  delete() {
    this.currentOperand = this.currentOperand.toString().slice(0, -1);
    if (this.currentOperand === '') {
      this.currentOperand = '0';
    }
  }

  /**
   * Appends a number (or decimal point) to the current operand.
   * Prevents multiple decimal points in a single number.
   * @param {string} number - The digit or decimal point to append.
   */
  appendNumber(number) {
    if (number === '.' && this.currentOperand.includes('.')) {
      return; // Prevent multiple decimal points
    }
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number.toString(); // Replace initial '0' if a non-decimal number is pressed
    } else {
      this.currentOperand = this.currentOperand.toString() + number.toString();
    }
  }

  /**
   * Sets the operation to be performed.
   * If there's already a previous operand and a current operand, it computes the result first.
   * @param {string} operation - The mathematical operation symbol (+, -, *, /).
   */
  chooseOperation(operation) {
    if (this.currentOperand === '') {
      if (this.previousOperand !== '') {
        // Allow changing operation if only previous operand exists
        this.operation = operation;
        return;
      }
      return;
    }
    if (this.previousOperand !== '') {
      this.compute(); // Compute if an operation chain is active
    }
    this.operation = operation;
    this.previousOperand = this.currentOperand;
    this.currentOperand = '';
  }

  /**
   * Performs the selected mathematical operation between the previous and current operands.
   * Updates the current operand with the result and clears the previous operand and operation.
   */
  compute() {
    let computation;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    // Validate inputs
    if (isNaN(prev) || isNaN(current)) {
      return; // Cannot compute without two valid numbers
    }

    switch (this.operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '*':
        computation = prev * current;
        break;
      case '/':
        if (current === 0) {
          // Handle division by zero error
          this.currentOperand = 'Error: Div by 0';
          this.previousOperand = '';
          this.operation = undefined;
          return;
        }
        computation = prev / current;
        break;
      default:
        return; // No valid operation selected
    }

    this.currentOperand = computation.toString();
    this.operation = undefined;
    this.previousOperand = '';
    this.lastResult = computation; // Store the result
  }

  /**
   * Formats a number for display, adding commas for thousands separators.
   * @param {string|number} number - The number to format.
   * @returns {string} The formatted number string.
   */
  getDisplayNumber(number) {
    if (number === 'Error: Div by 0') return number;

    const stringNumber = number.toString();
    const integerDigits = parseFloat(stringNumber.split('.')[0]);
    const decimalDigits = stringNumber.split('.')[1];
    let integerDisplay;

    if (isNaN(integerDigits)) {
      integerDisplay = '';
    } else {
      integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
    }

    if (decimalDigits != null) {
      return `${integerDisplay}.${decimalDigits}`;
    } else {
      return integerDisplay;
    }
  }

  /**
   * Updates the calculator display elements with the current and previous operands.
   */
  updateDisplay() {
    this.currentOperandTextElement.innerText = this.getDisplayNumber(
      this.currentOperand
    );
    if (this.operation != null) {
      this.previousOperandTextElement.innerText = `${this.getDisplayNumber(
        this.previousOperand
      )} ${this.operation}`;
    } else {
      this.previousOperandTextElement.innerText = '';
    }
  }
}

// --- DOM Element Selection ---
const numberButtons = document.querySelectorAll('[data-number]');
const operationButtons = document.querySelectorAll('[data-operation]');
const equalsButton = document.querySelector('[data-equals]');
const deleteButton = document.querySelector('[data-delete]');
const allClearButton = document.querySelector('[data-all-clear]');
const previousOperandTextElement = document.getElementById('previous-operand');
const currentOperandTextElement = document.getElementById('current-operand');

// --- Calculator Initialization ---
const calculator = new Calculator(
  previousOperandTextElement,
  currentOperandTextElement
);

// --- Event Listeners for Buttons ---

// Number buttons
numberButtons.forEach((button) => {
  button.addEventListener('click', () => {
    calculator.appendNumber(button.innerText);
    calculator.updateDisplay();
  });
});

// Operation buttons
operationButtons.forEach((button) => {
  button.addEventListener('click', () => {
    calculator.chooseOperation(button.innerText);
    calculator.updateDisplay();
  });
});

// Equals button
equalsButton.addEventListener('click', () => {
  calculator.compute();
  calculator.updateDisplay();
});

// All Clear button
allClearButton.addEventListener('click', () => {
  calculator.clear();
  calculator.updateDisplay();
});

// Delete button
deleteButton.addEventListener('click', () => {
  calculator.delete();
  calculator.updateDisplay();
});

// --- Keyboard Support ---
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if ((key >= '0' && key <= '9') || key === '.') {
    e.preventDefault(); // Prevent default browser action for number keys
    calculator.appendNumber(key);
    calculator.updateDisplay();
  } else if (key === '+' || key === '-' || key === '*' || key === '/') {
    e.preventDefault(); // Prevent default browser action for operator keys
    calculator.chooseOperation(key);
    calculator.updateDisplay();
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault(); // Prevent default browser action for Enter
    calculator.compute();
    calculator.updateDisplay();
  } else if (key === 'Backspace') {
    e.preventDefault(); // Prevent default browser action for Backspace
    calculator.delete();
    calculator.updateDisplay();
  } else if (key === 'Escape') {
    e.preventDefault(); // Prevent default browser action for Escape
    calculator.clear();
    calculator.updateDisplay();
  }
});
