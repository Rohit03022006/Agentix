import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import useLocalStorage from './hooks/useLocalStorage';
import AddTodoForm from './components/AddTodoForm';
import TodoItem from './components/TodoItem';

/**
 * Main App Component
 * Manages the state of todo items, and provides functions to add, toggle, and delete todos.
 * Persists todos to local storage using a custom hook.
 */
function App() {
  // Use custom hook to manage todos and persist them to local storage
  const [todos, setTodos] = useLocalStorage('react-todo-app', []);

  /**
   * Adds a new todo item to the list.
   * @param {string} text The text content of the new todo.
   */
  const addTodo = useCallback((text) => {
    // Basic check to prevent adding empty todos, though validation is also in AddTodoForm
    if (!text || text.trim() === '') {
      console.warn("Attempted to add an empty todo.");
      return;
    }
    const newTodo = {
      id: uuidv4(), // Generate a unique ID for the new todo
      text: text.trim(),
      completed: false,
    };
    setTodos((prevTodos) => [...prevTodos, newTodo]);
  }, [setTodos]); // setTodos is stable from useState, but useCallback protects against re-renders if it were not.

  /**
   * Toggles the completion status of a todo item.
   * @param {string} id The ID of the todo item to toggle.
   */
  const toggleComplete = useCallback((id) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, [setTodos]);

  /**
   * Deletes a todo item from the list.
   * @param {string} id The ID of the todo item to delete.
   */
  const deleteTodo = useCallback((id) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  }, [setTodos]);

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md mx-auto my-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">Todo List</h1>

      <AddTodoForm onAddTodo={addTodo} />

      {todos.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No todos yet! Add some above.</p>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggleComplete={toggleComplete}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}

      {/* Optional: Footer or clear all button */}
      {todos.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setTodos([])}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            Clear All Todos
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
