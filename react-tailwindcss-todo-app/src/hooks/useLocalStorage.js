import { useState, useEffect } from 'react';

/**
 * Custom hook to synchronize state with local storage.
 * @param {string} key The key under which the value is stored in local storage.
 * @param {any} initialValue The initial value if nothing is found in local storage.
 * @returns {[any, Function]} A tuple containing the current state and a setter function.
 */
function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error("Error reading from local storage:", error);
      return initialValue;
    }
  });

  // useEffect to update local storage when the state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      // A more advanced implementation would handle the error case gracefully, e.g., showing a user notification.
      console.error("Error writing to local storage:", error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
