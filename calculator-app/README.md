# Simple Calculator App

A straightforward calculator application built using HTML for structure, Tailwind CSS for styling, and vanilla JavaScript for logic. This project aims to demonstrate a clean, production-ready setup for a simple web application.

## Features

- Basic arithmetic operations (addition, subtraction, multiplication, division)
- Clear all input
- Delete last digit
- Decimal point support
- Keyboard support for numbers, operators, Enter, Escape, and Backspace
- Responsive design using Tailwind CSS
- Basic error handling (e.g., division by zero)

## Setup Instructions

Follow these steps to get the calculator app up and running on your local machine.

### 1. Clone the repository (if applicable)

If you're cloning this project from a repository, use the following command:

```bash
git clone <repository-url>
cd calculator-app
```

### 2. Install Dependencies

Navigate to the project directory and install the required Node.js packages. This includes Tailwind CSS, PostCSS, Autoprefixer, concurrently, and http-server.

```bash
npm install
```

### 3. Run the Application

To start the development server and automatically watch for Tailwind CSS changes, use the `start` script. This will compile your CSS and serve the application on `http://localhost:8080`.

```bash
npm start
```

This command will:
- Watch for changes in `src/input.css` and compile them to `dist/output.css`.
- Start a static file server at `http://localhost:8080`.

Open your web browser and navigate to `http://localhost:8080` to see the calculator in action.

### 4. Build for Production (Optional)

If you want to build the CSS once without watching for changes, for example, for a production deployment, use the `build:css` command:

```bash
npm run build:css
```

This will generate the final `dist/output.css` file.
