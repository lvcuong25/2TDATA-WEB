/**
 * Enhanced Formula Engine using expr-eval with Excel-like functions
 * Replaces the custom formulaEngine.js
 */

import { Parser } from 'expr-eval';
import { allExcelFunctions, functionCategories } from './excelFunctions/index.js';

class ExprEvalEngine {
  constructor() {
    this.parser = new Parser();
    this.setupCustomFunctions();
  }

  /**
   * Setup all Excel-like custom functions
   */
  setupCustomFunctions() {
    // Add all Excel functions to the parser
    Object.entries(allExcelFunctions).forEach(([name, func]) => {
      this.parser.functions[name] = func;
    });

    console.log(`✅ Loaded ${Object.keys(allExcelFunctions).length} Excel functions`);
  }

  /**
   * Evaluate a formula with record data and column definitions
   * @param {string} formula - The formula string
   * @param {Object} recordData - The record data containing column values
   * @param {Array} columns - Array of column definitions
   * @returns {*} The calculated result
   */
  evaluateFormula(formula, recordData, columns) {
    try {
      console.log('🔍 Evaluating formula:', formula);
      console.log('📊 Record data:', recordData);
      
      if (!formula || formula.trim() === '') {
        return null;
      }

      // Convert {columnName} references to variables
      let processedFormula = formula;
      const variables = {};
      
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
              value = new Date(value);
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
          
          variables[columnName] = value;
          processedFormula = processedFormula.replace(ref, columnName);
          
          console.log(`📝 Replacing ${ref} with ${value} (type: ${typeof value})`);
        } else {
          // Column not found or no value, use default based on context
          console.log(`⚠️ Column ${columnName} not found or no value, using default`);
          variables[columnName] = 0; // Default to 0 for numbers
          processedFormula = processedFormula.replace(ref, columnName);
        }
      }
      
      console.log('🔄 After column replacement:', processedFormula);
      console.log('📊 Variables:', variables);
      
      // Parse and evaluate the formula
      const expr = this.parser.parse(processedFormula);
      const result = expr.evaluate(variables);
      
      console.log('✅ Formula result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error evaluating formula:', error);
      console.error('Formula:', formula);
      console.error('Error details:', error.message);
      return null;
    }
  }

  /**
   * Extract dependencies from a formula
   * @param {string} formula - The formula string
   * @returns {Array} Array of column names that the formula depends on
   */
  extractDependencies(formula) {
    const dependencies = [];
    const columnRefs = formula.match(/\{([^}]+)\}/g) || [];
    
    for (const ref of columnRefs) {
      const columnName = ref.slice(1, -1);
      if (!dependencies.includes(columnName)) {
        dependencies.push(columnName);
      }
    }
    
    return dependencies;
  }

  /**
   * Validate a formula syntax
   * @param {string} formula - The formula string
   * @param {Array} columns - Array of available columns
   * @returns {Object} Validation result with isValid and errors
   */
  validateFormula(formula, columns) {
    const errors = [];
    
    if (!formula || formula.trim() === '') {
      errors.push('Formula cannot be empty');
      return { isValid: false, errors };
    }
    
    try {
      // Test if formula can be parsed
      const testFormula = formula.replace(/\{[^}]+\}/g, '0'); // Replace column refs with 0
      this.parser.parse(testFormula);
    } catch (error) {
      errors.push(`Syntax error: ${error.message}`);
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
      if (!allExcelFunctions[funcName]) {
        errors.push(`Unknown function '${funcName}'`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get available functions by category
   * @returns {Object} Function categories
   */
  getFunctionCategories() {
    return functionCategories;
  }

  /**
   * Get all available functions
   * @returns {Array} Array of function names
   */
  getAvailableFunctions() {
    return Object.keys(allExcelFunctions);
  }

  /**
   * Test a formula with sample data
   * @param {string} formula - The formula to test
   * @param {Object} sampleData - Sample data for testing
   * @returns {Object} Test result
   */
  testFormula(formula, sampleData = {}) {
    try {
      const testFormula = formula.replace(/\{[^}]+\}/g, (match) => {
        const columnName = match.slice(1, -1);
        return sampleData[columnName] !== undefined ? sampleData[columnName] : '0';
      });
      
      const expr = this.parser.parse(testFormula);
      const result = expr.evaluate(sampleData);
      
      return {
        success: true,
        result,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }
}

// Create and export a singleton instance
const exprEvalEngine = new ExprEvalEngine();

export default exprEvalEngine;
export { ExprEvalEngine };
