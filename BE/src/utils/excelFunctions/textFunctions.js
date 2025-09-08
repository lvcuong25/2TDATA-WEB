/**
 * Text Functions for Excel-like formula engine
 * Compatible with expr-eval library
 */

export const textFunctions = {
  // Basic Text Functions
  CONCAT: (...args) => {
    return args.map(val => String(val || '')).join('');
  },

  UPPER: (text) => {
    return String(text || '').toUpperCase();
  },

  LOWER: (text) => {
    return String(text || '').toLowerCase();
  },

  PROPER: (text) => {
    return String(text || '').replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  LEN: (text) => {
    return String(text || '').length;
  },

  // Text Extraction Functions
  LEFT: (text, numChars) => {
    const str = String(text || '');
    const num = Number(numChars) || 0;
    return str.substring(0, Math.max(0, num));
  },

  RIGHT: (text, numChars) => {
    const str = String(text || '');
    const num = Number(numChars) || 0;
    return str.slice(-Math.max(0, num));
  },

  MID: (text, start, numChars) => {
    const str = String(text || '');
    const startPos = Number(start) || 1;
    const num = Number(numChars) || 0;
    const startIndex = Math.max(0, startPos - 1);
    return str.substring(startIndex, startIndex + Math.max(0, num));
  },

  // Text Search Functions
  FIND: (findText, withinText, startNum = 1) => {
    const searchText = String(findText || '');
    const searchIn = String(withinText || '');
    const start = Number(startNum) || 1;
    const startIndex = Math.max(0, start - 1);
    const index = searchIn.indexOf(searchText, startIndex);
    return index === -1 ? null : index + 1;
  },

  SEARCH: (findText, withinText, startNum = 1) => {
    const searchText = String(findText || '').toLowerCase();
    const searchIn = String(withinText || '').toLowerCase();
    const start = Number(startNum) || 1;
    const startIndex = Math.max(0, start - 1);
    const index = searchIn.indexOf(searchText, startIndex);
    return index === -1 ? null : index + 1;
  },

  // Text Replacement Functions
  SUBSTITUTE: (text, oldText, newText, instanceNum) => {
    const str = String(text || '');
    const oldStr = String(oldText || '');
    const newStr = String(newText || '');
    
    if (instanceNum) {
      const instance = Number(instanceNum);
      let count = 0;
      return str.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), (match) => {
        count++;
        return count === instance ? newStr : match;
      });
    }
    
    return str.replace(new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
  },

  REPLACE: (oldText, startNum, numChars, newText) => {
    const str = String(oldText || '');
    const start = Number(startNum) || 1;
    const num = Number(numChars) || 0;
    const replacement = String(newText || '');
    const startIndex = Math.max(0, start - 1);
    const endIndex = startIndex + Math.max(0, num);
    
    return str.substring(0, startIndex) + replacement + str.substring(endIndex);
  },

  // Text Cleaning Functions
  TRIM: (text) => {
    return String(text || '').trim();
  },

  CLEAN: (text) => {
    return String(text || '').replace(/[\x00-\x1F\x7F]/g, '');
  },

  // Text Formatting Functions
  TEXT: (value, format) => {
    const val = Number(value);
    const fmt = String(format || '');
    
    if (isNaN(val)) return String(value || '');
    
    // Simple number formatting
    if (fmt.includes('0')) {
      const decimals = (fmt.match(/0/g) || []).length;
      return val.toFixed(decimals);
    }
    
    return String(val);
  },

  VALUE: (text) => {
    const str = String(text || '').trim();
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  },

  // Text Repetition
  REPT: (text, numberTimes) => {
    const str = String(text || '');
    const times = Math.max(0, Number(numberTimes) || 0);
    return str.repeat(times);
  },

  // Text Comparison
  EXACT: (text1, text2) => {
    return String(text1 || '') === String(text2 || '');
  },

  // Text Case Functions
  CHAR: (number) => {
    const num = Number(number) || 0;
    return num >= 0 && num <= 255 ? String.fromCharCode(num) : '';
  },

  CODE: (text) => {
    const str = String(text || '');
    return str.length > 0 ? str.charCodeAt(0) : 0;
  }
};

export default textFunctions;
