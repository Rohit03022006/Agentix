/**
 * Validates a todo text input.
 * @param {string} text The text to validate.
 * @returns {string | null} An error message if invalid, otherwise null.
 */
export function validateTodoText(text) {
  if (!text || text.trim() === '') {
    return 'Todo text cannot be empty.';
  }
  if (text.trim().length < 3) {
    return 'Todo text must be at least 3 characters long.';
  }
  if (text.trim().length > 100) {
    return 'Todo text cannot exceed 100 characters.';
  }
  return null; // No error
}