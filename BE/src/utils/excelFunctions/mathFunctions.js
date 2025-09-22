/**
 * Math & Statistical Functions for Excel-like formula engine
 * Compatible with expr-eval library
 */

export const mathFunctions = {
  // Basic Math Functions
  SUM: (...args) => {
    return args.reduce((sum, val) => sum + (Number(val) || 0), 0);
  },

  ADD: (...args) => {
    return args.reduce((sum, val) => sum + (Number(val) || 0), 0);
  },

  MULTIPLY: (...args) => {
    return args.reduce((product, val) => product * (Number(val) || 1), 1);
  },

  AVG: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)) && val !== null && val !== undefined);
    return validArgs.length > 0 ? validArgs.reduce((sum, val) => sum + Number(val), 0) / validArgs.length : 0;
  },

  MIN: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)) && val !== null && val !== undefined);
    return validArgs.length > 0 ? Math.min(...validArgs.map(val => Number(val))) : 0;
  },

  MAX: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)) && val !== null && val !== undefined);
    return validArgs.length > 0 ? Math.max(...validArgs.map(val => Number(val))) : 0;
  },

  COUNT: (...args) => {
    return args.filter(val => val !== null && val !== undefined && val !== '').length;
  },

  // Statistical Functions
  MEDIAN: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)) && val !== null && val !== undefined);
    if (validArgs.length === 0) return 0;
    
    const sorted = validArgs.map(Number).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  STDEV: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)) && val !== null && val !== undefined);
    if (validArgs.length < 2) return 0;
    
    const nums = validArgs.map(Number);
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    const variance = nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
    return Math.sqrt(variance);
  },

  VAR: (...args) => {
    const validArgs = args.filter(val => !isNaN(Number(val)) && val !== null && val !== undefined);
    if (validArgs.length < 2) return 0;
    
    const nums = validArgs.map(Number);
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length;
    return nums.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (nums.length - 1);
  },

  // Rounding Functions
  ROUND: (number, digits = 0) => {
    const factor = Math.pow(10, digits);
    return Math.round(Number(number) * factor) / factor;
  },

  ROUNDUP: (number, digits = 0) => {
    const factor = Math.pow(10, digits);
    return Math.ceil(Number(number) * factor) / factor;
  },

  ROUNDDOWN: (number, digits = 0) => {
    const factor = Math.pow(10, digits);
    return Math.floor(Number(number) * factor) / factor;
  },

  CEIL: (number) => {
    return Math.ceil(Number(number) || 0);
  },


  CEILING: (number) => {
    return Math.ceil(Number(number) || 0);
  },
  FLOOR: (number) => {
    return Math.floor(Number(number) || 0);
  },

  TRUNC: (number, digits = 0) => {
    const factor = Math.pow(10, digits);
    return Math.trunc(Number(number) * factor) / factor;
  },

  // Mathematical Functions
  ABS: (number) => {
    return Math.abs(Number(number) || 0);
  },

  SQRT: (number) => {
    const num = Number(number);
    return num >= 0 ? Math.sqrt(num) : 0;
  },

  POWER: (number, power) => {
    return Math.pow(Number(number) || 0, Number(power) || 0);
  },

  EXP: (number) => {
    return Math.exp(Number(number) || 0);
  },

  LN: (number) => {
    const num = Number(number);
    return num > 0 ? Math.log(num) : 0;
  },

  LOG: (number, base = 10) => {
    const num = Number(number);
    const baseNum = Number(base);
    return num > 0 && baseNum > 0 ? Math.log(num) / Math.log(baseNum) : 0;
  },

  // Random Functions
  RAND: () => {
    return Math.random();
  },

  RANDBETWEEN: (bottom, top) => {
    const min = Math.ceil(Number(bottom) || 0);
    const max = Math.floor(Number(top) || 0);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Modulo
  MOD: (number, divisor) => {
    const num = Number(number) || 0;
    const div = Number(divisor) || 1;
    return div !== 0 ? num % div : 0;
  },

  // Sign
  SIGN: (number) => {
    const num = Number(number) || 0;
    return num > 0 ? 1 : num < 0 ? -1 : 0;
  },

  // Percent Functions
  PERCENT: (number) => {
    return (Number(number) || 0) / 100;
  },

  PERCENTAGE: (number) => {
    return (Number(number) || 0) * 100;
  },

  PERCENTCHANGE: (oldValue, newValue) => {
    const old = Number(oldValue) || 0;
    const newVal = Number(newValue) || 0;
    if (old === 0) return newVal > 0 ? 100 : 0;
    return ((newVal - old) / old) * 100;
  },

  PERCENTRANK: (array, value) => {
    const nums = array.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    const val = Number(value) || 0;
    const rank = nums.filter(n => n < val).length;
    return nums.length > 0 ? (rank / nums.length) * 100 : 0;
  }
};

export default mathFunctions;
