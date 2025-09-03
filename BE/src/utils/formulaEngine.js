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
  SUM: (...args) => args.reduce((sum, val) => sum + (Number(val) || 0), 0),
  ADD: (...args) => args.reduce((sum, val) => sum + (Number(val) || 0), 0),
  MULTIPLY: (...args) => args.reduce((product, val) => product * (Number(val) || 1), 1),
  AVG: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)));
    return validArgs.length > 0 ? validArgs.reduce((sum, val) => sum + Number(val), 0) / validArgs.length : 0;
  },
  MIN: (...args) => Math.min(...args.map(val => Number(val) || Infinity)),
  MAX: (...args) => Math.max(...args.map(val => Number(val) || -Infinity)),
  COUNT: (...args) => args.filter(val => val !== null && val !== undefined && val !== '').length,
  IF: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
  CONCAT: (...args) => args.join(''),
  UPPER: (str) => String(str).toUpperCase(),
  LOWER: (str) => String(str).toLowerCase(),
  LEN: (str) => String(str).length,
  ROUND: (num, decimals = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),
  ABS: (num) => Math.abs(Number(num) || 0),
  CEIL: (num) => Math.ceil(Number(num) || 0),
  FLOOR: (num) => Math.floor(Number(num) || 0)
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
        // Replace the reference with the actual value (no JSON.stringify for numbers)
        processedFormula = processedFormula.replace(ref, value);
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
          
          const argValues = args.split(',').map(arg => {
            const trimmed = arg.trim();
            // Parse as number if possible
            if (!isNaN(Number(trimmed))) {
              return Number(trimmed);
            }
            return trimmed;
          }).filter(val => val !== null && val !== undefined && val !== '');
          
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
    
    // Return the final result
    const finalResult = Number(processedFormula) || processedFormula;
    return finalResult;
    
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
