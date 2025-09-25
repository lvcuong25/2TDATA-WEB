/**
 * Logical Functions for Excel-like formula engine
 * Compatible with expr-eval library
 */

export const logicalFunctions = {
  // Basic Logical Functions
  IF: (condition, trueValue, falseValue) => {
    return condition ? trueValue : falseValue;
  },

  AND: (...args) => {
    return args.every(arg => Boolean(arg));
  },

  OR: (...args) => {
    return args.some(arg => Boolean(arg));
  },

  NOT: (logical) => {
    return !Boolean(logical);
  },

  // Logical Comparison Functions
  IFERROR: (value, valueIfError) => {
    try {
      const val = value;
      if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
        return valueIfError;
      }
      return val;
    } catch (error) {
      return valueIfError;
    }
  },

  IFNA: (value, valueIfNA) => {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
      return valueIfNA;
    }
    return value;
  },

  // Information Functions
  ISBLANK: (value) => {
    return value === null || value === undefined || value === '';
  },

  ISNUMBER: (value) => {
    return typeof value === 'number' && !isNaN(value);
  },

  ISTEXT: (value) => {
    return typeof value === 'string';
  },

  ISLOGICAL: (value) => {
    return typeof value === 'boolean';
  },

  ISERROR: (value) => {
    return value === null || value === undefined || (typeof value === 'number' && isNaN(value));
  },

  ISNA: (value) => {
    return value === null || value === undefined || (typeof value === 'number' && isNaN(value));
  },

  ISEVEN: (value) => {
    const num = Number(value);
    return !isNaN(num) && num % 2 === 0;
  },

  ISODD: (value) => {
    const num = Number(value);
    return !isNaN(num) && num % 2 !== 0;
  },

  // Choice Functions
  CHOOSE: (index, ...values) => {
    const idx = Number(index) || 0;
    if (idx < 1 || idx > values.length) return null;
    return values[idx - 1];
  },

  SWITCH: (expression, ...cases) => {
    if (cases.length < 2) return null;
    
    const expr = expression;
    const defaultValue = cases.length % 2 === 1 ? cases[cases.length - 1] : null;
    
    for (let i = 0; i < cases.length - (defaultValue ? 1 : 0); i += 2) {
      if (expr === cases[i]) {
        return cases[i + 1];
      }
    }
    
    return defaultValue;
  },

  // Comparison Functions
  EXACT: (text1, text2) => {
    return String(text1 || '') === String(text2 || '');
  },

  // Array Functions
  IFS: (...conditions) => {
    if (conditions.length < 2) return null;
    
    for (let i = 0; i < conditions.length - 1; i += 2) {
      if (Boolean(conditions[i])) {
        return conditions[i + 1];
      }
    }
    
    // If no condition is true and there's an odd number of arguments, return the last one
    if (conditions.length % 2 === 1) {
      return conditions[conditions.length - 1];
    }
    
    return null;
  },

  // Nested IF alternative
  NESTEDIF: (...conditions) => {
    if (conditions.length < 3) return null;
    
    for (let i = 0; i < conditions.length - 1; i += 2) {
      if (Boolean(conditions[i])) {
        return conditions[i + 1];
      }
    }
    
    // Return the last value as default
    return conditions[conditions.length - 1];
  },

  // Boolean Conversion
  BOOLEAN: (value) => {
    return Boolean(value);
  },

  // Conditional Aggregation
  SUMIF: (range, criteria, sumRange) => {
    // This is a simplified version - in real implementation, you'd need access to actual ranges
    if (Array.isArray(range) && Array.isArray(sumRange)) {
      return range.reduce((sum, val, index) => {
        if (this.evaluateCondition(val, criteria)) {
          return sum + (Number(sumRange[index]) || 0);
        }
        return sum;
      }, 0);
    }
    return 0;
  },

  COUNTIF: (range, criteria) => {
    if (Array.isArray(range)) {
      return range.filter(val => this.evaluateCondition(val, criteria)).length;
    }
    return 0;
  },

  // Helper function for condition evaluation
  evaluateCondition: (value, criteria) => {
    if (typeof criteria === 'string') {
      // Handle string criteria with operators
      if (criteria.startsWith('>')) {
        return Number(value) > Number(criteria.substring(1));
      } else if (criteria.startsWith('<')) {
        return Number(value) < Number(criteria.substring(1));
      } else if (criteria.startsWith('>=')) {
        return Number(value) >= Number(criteria.substring(2));
      } else if (criteria.startsWith('<=')) {
        return Number(value) <= Number(criteria.substring(2));
      } else if (criteria.startsWith('<>') || criteria.startsWith('!=')) {
        return value != criteria.substring(2);
      } else if (criteria.startsWith('=')) {
        return value == criteria.substring(1);
      } else {
        // Exact match
        return String(value) === criteria;
      }
    }
    
    return value == criteria;
  }
};

export default logicalFunctions;
