import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { validateTodoText } from '../utils/validation';

/**
 * AddTodoForm Component
 * Provides an input field and a button to add new todo items.
 * Includes basic client-side validation for the input.
 * @param {object} props
 * @param {function} props.onAddTodo - Function to call when a new todo is submitted.
 */
function AddTodoForm({ onAddTodo }) {
  const [newTodoText, setNewTodoText] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateTodoText(newTodoText);

    if (validationError) {
      setError(validationError);
      return;
    }

    onAddTodo(newTodoText.trim());
    setNewTodoText('');
    setError(null); // Clear error on successful submission
  };

  const handleChange = (e) => {
    setNewTodoText(e.target.value);
    // Clear error as user types, or re-validate instantly if an error is currently displayed
    if (error) {
        setError(validateTodoText(e.target.value));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-stretch w-full mb-6">
      <div className="flex-grow w-full sm:w-auto mb-3 sm:mb-0 sm:mr-4">
        <input
          type="text"
          value={newTodoText}
          onChange={handleChange}
          placeholder="Add a new todo..."
          className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          aria-label="New todo text"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150 ease-in-out font-semibold"
      >
        Add Todo
      </button>
    </form>
  );
}

AddTodoForm.propTypes = {
  onAddTodo: PropTypes.func.isRequired,
};

export default AddTodoForm;
