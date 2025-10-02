/**
 * Formula Engine for calculating column values based on formulas
 */

// Supported operators and functions
const OPERATORS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => b !== 0 ? a / b : 0,
  '%': (a, b) => b !== 0 ? a % b : 0,
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '&&': (a, b) => a && b,
  '||': (a, b) => a || b
};

const FUNCTIONS = {
  // ===== MATHEMATICAL FUNCTIONS =====
  SUM: (...args) => args.reduce((sum, val) => sum + (Number(val) || 0), 0),
  ADD: (...args) => args.reduce((sum, val) => sum + (Number(val) || 0), 0),
  SUBTRACT: (a, b) => (Number(a) || 0) - (Number(b) || 0),
  MULTIPLY: (...args) => args.reduce((product, val) => product * (Number(val) || 1), 1),
  DIVIDE: (a, b) => (Number(b) !== 0) ? (Number(a) || 0) / (Number(b) || 1) : 0,
  MOD: (a, b) => (Number(b) !== 0) ? (Number(a) || 0) % (Number(b) || 1) : 0,
  POWER: (a, b) => Math.pow(Number(a) || 0, Number(b) || 1),
  SQRT: (num) => Math.sqrt(Math.max(0, Number(num) || 0)),
  AVG: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)));
    return validArgs.length > 0 ? validArgs.reduce((sum, val) => sum + Number(val), 0) / validArgs.length : 0;
  },
  MIN: (...args) => Math.min(...args.map(val => Number(val) || Infinity)),
  MAX: (...args) => Math.max(...args.map(val => Number(val) || -Infinity)),
  COUNT: (...args) => args.filter(val => val !== null && val !== undefined && val !== '').length,
  COUNTIF: (range, condition) => {
    // Simple implementation - count non-empty values
    return range.filter(val => val !== null && val !== undefined && val !== '').length;
  },
  ROUND: (num, decimals = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
  ROUNDUP: (num, decimals = 0) => Math.ceil(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
  ROUNDDOWN: (num, decimals = 0) => Math.floor(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
  ABS: (num) => Math.abs(Number(num) || 0),
  CEIL: (num) => Math.ceil(Number(num) || 0),
  FLOOR: (num) => Math.floor(Number(num) || 0),
  RAND: () => Math.random(),
  RANDBETWEEN: (min, max) => Math.floor(Math.random() * (Number(max) - Number(min) + 1)) + Number(min),

  // ===== LOGICAL FUNCTIONS =====
  AND: (...args) => args.every(val => Boolean(val)),
  OR: (...args) => args.some(val => Boolean(val)),
  NOT: (val) => !Boolean(val),
  IF: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
  IFS: (...args) => {
    // IFS(condition1, value1, condition2, value2, ..., default)
    for (let i = 0; i < args.length - 1; i += 2) {
      if (Boolean(args[i])) {
        return args[i + 1];
      }
    }
    return args[args.length - 1] || '';
  },
  SWITCH: (expression, ...cases) => {
    // SWITCH(expression, case1, value1, case2, value2, ..., default)
    for (let i = 1; i < cases.length - 1; i += 2) {
      if (expression === cases[i]) {
        return cases[i + 1];
      }
    }
    return cases[cases.length - 1] || '';
  },
  ISBLANK: (val) => val === null || val === undefined || val === '',
  ISNUMBER: (val) => !isNaN(Number(val)),
  ISTEXT: (val) => typeof val === 'string',
  ISERROR: (val) => val === null || val === undefined || isNaN(Number(val)),

  // ===== TEXT FUNCTIONS =====
  CONCAT: (...args) => `"${args.join('')}"`,
  CONCATENATE: (...args) => `"${args.join('')}"`,
  CONCAT_IF_BOTH: (val1, separator, val2) => {
    // Only concatenate if both values are not empty
    if (val1 && val2 && val1 !== '' && val2 !== '') {
      return `"${val1}${separator}${val2}"`;
    }
    return '""'; // Return empty string if either value is empty
  },
  UPPER: (str) => String(str).toUpperCase(),
  LOWER: (str) => String(str).toLowerCase(),
  PROPER: (str) => String(str).replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  ),
  LEN: (str) => String(str).length,
  LEFT: (str, num) => String(str).substring(0, Math.max(0, Number(num) || 0)),
  RIGHT: (str, num) => {
    const s = String(str);
    return s.substring(Math.max(0, s.length - (Number(num) || 0)));
  },
  MID: (str, start, length) => {
    const s = String(str);
    const startPos = Math.max(0, (Number(start) || 1) - 1);
    const len = Math.max(0, Number(length) || 0);
    return s.substring(startPos, startPos + len);
  },
  FIND: (findText, withinText, startNum = 1) => {
    const pos = String(withinText).indexOf(String(findText), (Number(startNum) || 1) - 1);
    return pos >= 0 ? pos + 1 : 0;
  },
  SEARCH: (findText, withinText, startNum = 1) => {
    const pos = String(withinText).toLowerCase().indexOf(String(findText).toLowerCase(), (Number(startNum) || 1) - 1);
    return pos >= 0 ? pos + 1 : 0;
  },
  SUBSTITUTE: (text, oldText, newText, instanceNum) => {
    let str = String(text);
    const old = String(oldText);
    const newStr = String(newText);
    
    if (instanceNum) {
      // Replace specific instance
      let count = 0;
      let pos = 0;
      while ((pos = str.indexOf(old, pos)) !== -1) {
        count++;
        if (count === Number(instanceNum)) {
          str = str.substring(0, pos) + newStr + str.substring(pos + old.length);
          break;
        }
        pos += old.length;
      }
    } else {
      // Replace all instances
      str = str.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStr);
    }
    return `"${str}"`;
  },
  REPLACE: (oldText, startNum, numChars, newText) => {
    const str = String(oldText);
    const start = Math.max(0, (Number(startNum) || 1) - 1);
    const length = Math.max(0, Number(numChars) || 0);
    const newStr = String(newText);
    return `"${str.substring(0, start)}${newStr}${str.substring(start + length)}"`;
  },
  TRIM: (str) => `"${String(str).trim()}"`,
  CLEAN: (str) => `"${String(str).replace(/[\x00-\x1F\x7F]/g, '')}"`,
  VALUE: (str) => Number(String(str).replace(/[^\d.-]/g, '')) || 0,
  TEXT: (value, format) => {
    // Simple text formatting
    const num = Number(value);
    if (isNaN(num)) return `"${String(value)}"`;
    
    // Basic number formatting
    if (format === '0') return Math.round(num).toString();
    if (format === '0.00') return num.toFixed(2);
    if (format === '#,##0') return num.toLocaleString();
    if (format === '#,##0.00') return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    return `"${num.toString()}"`;
  },

  // ===== DATE FUNCTIONS =====
  TODAY: () => new Date().toISOString().split('T')[0],
  NOW: () => new Date().toISOString(),
  DATE: (year, month, day) => {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toISOString().split('T')[0];
  },
  YEAR: (date) => new Date(date).getFullYear(),
  MONTH: (date) => new Date(date).getMonth() + 1,
  DAY: (date) => new Date(date).getDate(),
  HOUR: (date) => new Date(date).getHours(),
  MINUTE: (date) => new Date(date).getMinutes(),
  SECOND: (date) => new Date(date).getSeconds(),
  WEEKDAY: (date, returnType = 1) => {
    const day = new Date(date).getDay();
    // returnType 1: Sunday = 1, Monday = 2, ..., Saturday = 7
    // returnType 2: Monday = 1, Tuesday = 2, ..., Sunday = 7
    return returnType === 2 ? (day === 0 ? 7 : day) : (day === 0 ? 7 : day);
  },
  DATEDIF: (startDate, endDate, unit) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    switch (unit.toUpperCase()) {
      case 'D': return diffDays;
      case 'M': return Math.floor(diffDays / 30);
      case 'Y': return Math.floor(diffDays / 365);
      default: return diffDays;
    }
  },

  // ===== STATISTICAL FUNCTIONS =====
  MEDIAN: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val))).map(val => Number(val)).sort((a, b) => a - b);
    const len = validArgs.length;
    if (len === 0) return 0;
    if (len % 2 === 0) {
      return (validArgs[len / 2 - 1] + validArgs[len / 2]) / 2;
    }
    return validArgs[Math.floor(len / 2)];
  },
  MODE: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val))).map(val => Number(val));
    const frequency = {};
    let maxFreq = 0;
    let mode = validArgs[0];
    
    validArgs.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        mode = val;
      }
    });
    
    return mode;
  },
  STDEV: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val))).map(val => Number(val));
    if (validArgs.length < 2) return 0;
    
    const mean = validArgs.reduce((sum, val) => sum + val, 0) / validArgs.length;
    const variance = validArgs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (validArgs.length - 1);
    return Math.sqrt(variance);
  },
  VAR: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val))).map(val => Number(val));
    if (validArgs.length < 2) return 0;
    
    const mean = validArgs.reduce((sum, val) => sum + val, 0) / validArgs.length;
    return validArgs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (validArgs.length - 1);
  },

  // ===== LOOKUP FUNCTIONS =====
  VLOOKUP: (lookupValue, tableArray, colIndexNum, rangeLookup = true) => {
    // Simplified VLOOKUP implementation
    // This is a basic implementation - in real scenarios, you'd need more complex logic
    return `"VLOOKUP not fully implemented"`;
  },
  HLOOKUP: (lookupValue, tableArray, rowIndexNum, rangeLookup = true) => {
    // Simplified HLOOKUP implementation
    return `"HLOOKUP not fully implemented"`;
  },
  INDEX: (array, rowNum, colNum = 1) => {
    // Simplified INDEX implementation
    return `"INDEX not fully implemented"`;
  },
  MATCH: (lookupValue, lookupArray, matchType = 1) => {
    // Simplified MATCH implementation
    return `"MATCH not fully implemented"`;
  },

  // ===== FINANCIAL FUNCTIONS =====
  PMT: (rate, nper, pv, fv = 0, type = 0) => {
    // Payment calculation
    const r = Number(rate) / 12; // Monthly rate
    const n = Number(nper);
    const p = Number(pv);
    const f = Number(fv);
    const t = Number(type);
    
    if (r === 0) return -(p + f) / n;
    
    const pmt = -(p * Math.pow(1 + r, n) + f) / (((1 + r) * (Math.pow(1 + r, n) - 1)) / r);
    return t === 1 ? pmt / (1 + r) : pmt;
  },
  FV: (rate, nper, pmt, pv = 0, type = 0) => {
    // Future value calculation
    const r = Number(rate);
    const n = Number(nper);
    const p = Number(pmt);
    const pvVal = Number(pv);
    const t = Number(type);
    
    if (r === 0) return -(pvVal + p * n);
    
    const fv = -(pvVal * Math.pow(1 + r, n) + p * (1 + r * t) * (Math.pow(1 + r, n) - 1) / r);
    return fv;
  },
  PV: (rate, nper, pmt, fv = 0, type = 0) => {
    // Present value calculation
    const r = Number(rate);
    const n = Number(nper);
    const p = Number(pmt);
    const fvVal = Number(fv);
    const t = Number(type);
    
    if (r === 0) return -(fvVal + p * n);
    
    const pv = -(fvVal / Math.pow(1 + r, n) + p * (1 + r * t) * (1 - Math.pow(1 + r, -n)) / r);
    return pv;
  }
};

/**
 * Parse and evaluate a formula
 * @param {string} formula - The formula string
 * @param {Object} recordData - The record data containing column values
 * @param {Array} columns - Array of column definitions
 * @returns {*} The calculated result
 */
export const evaluateFormula = (formula, recordData, columns) => {
  try {
    console.log('🔍 Evaluating formula:', formula);
    console.log('📊 Record data:', recordData);
    
    // Replace column references with actual values
    let processedFormula = formula;
    
    // Find all column references (e.g., {columnName})
    const columnRefs = formula.match(/\{([^}]+)\}/g) || [];
    console.log('🔗 Found column references:', columnRefs);
    
    for (const ref of columnRefs) {
      const columnName = ref.slice(1, -1); // Remove { and }
      const column = columns.find(col => col.name === columnName);
      
      if (column && recordData[columnName] !== undefined && recordData[columnName] !== null) {
        let value = recordData[columnName];
        
        // Convert value based on column data type
        switch (column.dataType) {
          case 'number':
            value = Number(value) || 0;
            break;
          case 'date':
            value = new Date(value).getTime();
            break;
          case 'checkbox':
            value = Boolean(value);
            break;
          case 'text':
          case 'string':
          case 'email':
          case 'url':
            value = String(value);
            break;
          default:
            value = value;
        }
        
        console.log(`📝 Replacing ${ref} with ${value} (type: ${typeof value})`);
        // Replace the reference with the actual value
        // For strings, wrap in quotes to preserve format
        if (typeof value === 'string') {
          processedFormula = processedFormula.replace(ref, `"${value}"`);
        } else {
          processedFormula = processedFormula.replace(ref, value);
        }
      } else {
        // Column not found or no value, replace with 0 for numbers
        console.log(`⚠️ Column ${columnName} not found or no value, using 0`);
        processedFormula = processedFormula.replace(ref, '0');
      }
    }
    
    console.log('🔄 After column replacement:', processedFormula);
    
    // Replace function calls with actual function calls
    for (const [funcName, func] of Object.entries(FUNCTIONS)) {
      const regex = new RegExp(`\\b${funcName}\\s*\\(([^)]*)\\)`, 'gi');
      processedFormula = processedFormula.replace(regex, (match, args) => {
        try {
          console.log(`🔧 Processing function ${funcName} with args:`, args);
          
          // Handle mathematical expressions in arguments
          let argValues;
          // Only treat as mathematical expression if it's a simple expression without quotes
          if ((args.includes('+') || args.includes('-') || args.includes('*') || args.includes('/')) && 
              !args.includes('"') && !args.includes("'")) {
            // If it's a mathematical expression, evaluate it first
            try {
              const evaluated = new Function('return ' + args)();
              argValues = [evaluated];
            } catch (error) {
              // If evaluation fails, treat as string
              argValues = [args];
            }
          } else {
            // Parse arguments more carefully to handle quoted strings
            argValues = [];
            let currentArg = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let i = 0; i < args.length; i++) {
              const char = args[i];
              
              if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
                currentArg += char;
              } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
                currentArg += char;
              } else if (char === ',' && !inQuotes) {
                // End of argument
                const trimmed = currentArg.trim();
                if (trimmed !== '') {
                  // Remove quotes if present
                  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                    argValues.push(trimmed.slice(1, -1));
                  } else if (!isNaN(Number(trimmed))) {
                    argValues.push(Number(trimmed));
                  } else {
                    argValues.push(trimmed);
                  }
                }
                currentArg = '';
              } else {
                currentArg += char;
              }
            }
            
            // Add the last argument
            if (currentArg.trim() !== '') {
              const trimmed = currentArg.trim();
              if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                  (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                argValues.push(trimmed.slice(1, -1));
              } else if (!isNaN(Number(trimmed))) {
                argValues.push(Number(trimmed));
              } else {
                argValues.push(trimmed);
              }
            }
          }
          
          console.log(`📊 Function ${funcName} arguments:`, argValues);
          const result = func(...argValues);
          console.log(`✅ Function ${funcName} result:`, result);
          
          return result;
        } catch (error) {
          console.error(`❌ Error in function ${funcName}:`, error);
          return match; // Keep original if parsing fails
        }
      });
    }
    
    console.log('🏁 Final result:', processedFormula);
    
    // If the result contains quotes, it's likely a string result from CONCAT
    if (processedFormula.includes('"')) {
      console.log('📝 Result contains quotes, returning as string');
      // Remove outer quotes if present
      if (processedFormula.startsWith('"') && processedFormula.endsWith('"')) {
        return processedFormula.slice(1, -1);
      }
      return processedFormula;
    }
    
    // Try to evaluate the final formula as a mathematical expression
    try {
      // Use Function constructor to safely evaluate mathematical expressions
      const result = new Function('return ' + processedFormula)();
      console.log('🧮 Evaluated result:', result);
      return result;
    } catch (evalError) {
      console.log('⚠️ Could not evaluate as math expression, returning as string');
      // Return as string if it's not a valid mathematical expression
      return processedFormula;
    }
    
  } catch (error) {
    console.error('❌ Error evaluating formula:', error);
    return null;
  }
};

/**
 * Extract dependencies from a formula
 * @param {string} formula - The formula string
 * @returns {Array} Array of column names that the formula depends on
 */
export const extractDependencies = (formula) => {
  const dependencies = [];
  const columnRefs = formula.match(/\{([^}]+)\}/g) || [];
  
  for (const ref of columnRefs) {
    const columnName = ref.slice(1, -1);
    if (!dependencies.includes(columnName)) {
      dependencies.push(columnName);
    }
  }
  
  return dependencies;
};

/**
 * Validate a formula syntax
 * @param {string} formula - The formula string
 * @param {Array} columns - Array of available columns
 * @returns {Object} Validation result with isValid and errors
 */
export const validateFormula = (formula, columns) => {
  const errors = [];
  
  if (!formula || formula.trim() === '') {
    errors.push('Formula cannot be empty');
    return { isValid: false, errors };
  }
  
  // Check for balanced braces
  const openBraces = (formula.match(/\{/g) || []).length;
  const closeBraces = (formula.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in formula');
  }
  
  // Check for valid column references
  const columnRefs = formula.match(/\{([^}]+)\}/g) || [];
  for (const ref of columnRefs) {
    const columnName = ref.slice(1, -1);
    const column = columns.find(col => col.name === columnName);
    
    if (!column) {
      errors.push(`Column '${columnName}' not found`);
    }
  }
  
  // Check for valid function calls
  const functionCalls = formula.match(/[A-Z]+\([^)]*\)/gi) || [];
  for (const call of functionCalls) {
    const funcName = call.split('(')[0].toUpperCase();
    if (!FUNCTIONS[funcName]) {
      errors.push(`Unknown function '${funcName}'`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  evaluateFormula,
  extractDependencies,
  validateFormula,
  OPERATORS,
  FUNCTIONS
};
