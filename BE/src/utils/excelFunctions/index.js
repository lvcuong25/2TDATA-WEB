/**
 * Excel Functions Index
 * Exports all function categories for the formula engine
 */

import mathFunctions from './mathFunctions.js';
import textFunctions from './textFunctions.js';
import dateFunctions from './dateFunctions.js';
import logicalFunctions from './logicalFunctions.js';

// Combine all functions into a single object
export const allExcelFunctions = {
  ...mathFunctions,
  ...textFunctions,
  ...dateFunctions,
  ...logicalFunctions
};

// Export individual categories
export { mathFunctions, textFunctions, dateFunctions, logicalFunctions };

// Export function categories for UI
export const functionCategories = {
  'Math & Statistical': {
    functions: [
      'SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'MEDIAN', 'STDEV', 'VAR',
      'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'CEIL', 'FLOOR', 'TRUNC',
      'ABS', 'SQRT', 'POWER', 'EXP', 'LN', 'LOG', 'RAND', 'RANDBETWEEN', 'MOD', 'SIGN'
    ],
    description: 'Mathematical and statistical calculations'
  },
  'Text': {
    functions: [
      'CONCAT', 'UPPER', 'LOWER', 'PROPER', 'LEN',
      'LEFT', 'RIGHT', 'MID', 'FIND', 'SEARCH',
      'SUBSTITUTE', 'REPLACE', 'TRIM', 'CLEAN',
      'TEXT', 'VALUE', 'REPT', 'EXACT', 'CHAR', 'CODE'
    ],
    description: 'Text manipulation and formatting'
  },
  'Date & Time': {
    functions: [
      'TODAY', 'NOW', 'DATE', 'TIME',
      'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
      'DATEDIF', 'DATEADD', 'WEEKDAY', 'WEEKNUM',
      'EOMONTH', 'EDATE', 'DATESTR', 'ISDATE', 'WORKDAY'
    ],
    description: 'Date and time calculations'
  },
  'Logical': {
    functions: [
      'IF', 'AND', 'OR', 'NOT', 'IFERROR', 'IFNA',
      'ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISLOGICAL', 'ISERROR', 'ISNA', 'ISEVEN', 'ISODD',
      'CHOOSE', 'SWITCH', 'EXACT', 'IFS', 'NESTEDIF', 'BOOLEAN',
      'SUMIF', 'COUNTIF'
    ],
    description: 'Logical operations and conditional functions'
  }
};

export default allExcelFunctions;
