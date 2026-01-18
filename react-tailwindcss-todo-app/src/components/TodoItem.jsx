import React from 'react';
import PropTypes from 'prop-types'; // For prop-types validation

/**
 * TodoItem Component
 * Renders a single todo item with options to toggle completion and delete.
 * @param {object} props
 * @param {object} props.todo - The todo object { id, text, completed }
 * @param {function} props.onToggleComplete - Function to call when todo completion is toggled.
 * @param {function} props.onDelete - Function to call when todo is deleted.
 */
function TodoItem({ todo, onToggleComplete, onDelete }) {
  return (
    <li className="flex items-center justify-between p-4 bg-white border-b border-gray-200 last:border-b-0">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo.id)}
          className="mr-3 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
        />
        <span
          className={`text-lg ${todo.completed ? 'todo-completed' : 'text-gray-800'}`}
        >
          {todo.text}
        </span>
      </div>
      <button
        onClick={() => onDelete(todo.id)}
        className="ml-4 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        aria-label={`Delete todo: ${todo.text}`}
      >
        Delete
      </button>
    </li>
  );
}

TodoItem.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
  }).isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default React.memo(TodoItem); // Memoize for performance
