/**
 * Safe console.log utility
 * Prevents "console.log is not a function" errors in production or restricted environments
 */

export const safeLog = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.log && typeof console.log === 'function') {
      console.log(...args);
    }
  } catch (error) {
    // Silently ignore console errors
  }
};

export const safeWarn = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.warn && typeof console.warn === 'function') {
      console.warn(...args);
    }
  } catch (error) {
    // Silently ignore console errors
  }
};

export const safeError = (...args) => {
  try {
    if (typeof console !== 'undefined' && console.error && typeof console.error === 'function') {
      console.error(...args);
    }
  } catch (error) {
    // Silently ignore console errors
  }
};

export default safeLog;