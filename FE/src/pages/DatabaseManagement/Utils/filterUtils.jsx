/**
 * Filter utilities
 * Provides functions to handle filtering logic, operators, and rules
 */

/**
 * Get operator options based on data type
 * @param {string} dataType - Data type of the field
 * @returns {Array} Array of operator options
 */
export const getOperatorOptions = (dataType) => {
  const textOperators = [
    { value: 'equals', label: 'is equal' },
    { value: 'not_equals', label: 'is not equal' },
    { value: 'contains', label: 'is like' },
    { value: 'not_contains', label: 'is not like' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'is_empty', label: 'is blank' },
    { value: 'is_not_empty', label: 'is not blank' }
  ];

  const numberOperators = [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '!=' },
    { value: 'greater_than', label: '>' },
    { value: 'less_than', label: '<' },
    { value: 'greater_than_or_equal', label: '>=' },
    { value: 'less_than_or_equal', label: '<=' },
    { value: 'is_empty', label: 'is blank' },
    { value: 'is_not_empty', label: 'is not blank' }
  ];

  const dateOperators = [
    { value: 'equals', label: 'is equal' },
    { value: 'not_equals', label: 'is not equal' },
    { value: 'greater_than', label: 'is after' },
    { value: 'less_than', label: 'is before' },
    { value: 'greater_than_or_equal', label: 'is on or after' },
    { value: 'less_than_or_equal', label: 'is on or before' },
    { value: 'is_empty', label: 'is blank' },
    { value: 'is_not_empty', label: 'is not blank' }
  ];

  const booleanOperators = [
    { value: 'equals', label: 'is equal' },
    { value: 'not_equals', label: 'is not equal' },
    { value: 'is_empty', label: 'is blank' },
    { value: 'is_not_empty', label: 'is not blank' }
  ];

  switch (dataType) {
    case 'text':
    case 'email':
    case 'url':
      return textOperators;
    case 'number':
    case 'currency':
      return numberOperators;
    case 'date':
    case 'datetime':
      return dateOperators;
    case 'checkbox':
      return booleanOperators;
    case 'single_select':
    case 'multi_select':
      return textOperators;
    default:
      return textOperators;
  }
};

/**
 * Create a new filter rule
 * @param {string} field - Field name
 * @param {string} operator - Operator
 * @param {any} value - Filter value
 * @returns {Object} Filter rule object
 */
export const createFilterRule = (field, operator = 'equals', value = '') => {
  return {
    field,
    operator,
    value
  };
};

/**
 * Add a new filter rule
 * @param {Array} filterRules - Current filter rules
 * @param {string} field - Field name
 * @param {string} operator - Operator
 * @param {any} value - Filter value
 * @returns {Array} Updated filter rules
 */
export const addFilterRule = (filterRules, field, operator = 'equals', value = '') => {
  const newRule = createFilterRule(field, operator, value);
  return [...filterRules, newRule];
};

/**
 * Remove a filter rule by index
 * @param {Array} filterRules - Current filter rules
 * @param {number} index - Index of rule to remove
 * @returns {Array} Updated filter rules
 */
export const removeFilterRule = (filterRules, index) => {
  return filterRules.filter((_, i) => i !== index);
};

/**
 * Update a filter rule
 * @param {Array} filterRules - Current filter rules
 * @param {number} index - Index of rule to update
 * @param {string} field - New field name
 * @param {string} operator - New operator
 * @param {any} value - New value
 * @returns {Array} Updated filter rules
 */
export const updateFilterRule = (filterRules, index, field, operator, value) => {
  const newRules = [...filterRules];
  newRules[index] = { field, operator, value };
  return newRules;
};

/**
 * Clear all filter rules
 * @returns {Array} Empty filter rules array
 */
export const clearAllFilterRules = () => {
  return [];
};

/**
 * Toggle filter active state
 * @param {boolean} isFilterActive - Current filter active state
 * @returns {boolean} New filter active state
 */
export const toggleFilterActive = (isFilterActive) => {
  return !isFilterActive;
};

/**
 * Check if filter is active
 * @param {boolean} isFilterActive - Filter active state
 * @param {Array} filterRules - Filter rules
 * @returns {boolean} True if filter is active
 */
export const isFilterActive = (isFilterActive, filterRules) => {
  return isFilterActive && filterRules && filterRules.length > 0;
};

/**
 * Get filter rules count
 * @param {Array} filterRules - Filter rules
 * @returns {number} Number of filter rules
 */
export const getFilterRulesCount = (filterRules) => {
  return filterRules ? filterRules.length : 0;
};

/**
 * Apply filter rules to records
 * @param {Array} records - Records to filter
 * @param {Array} filterRules - Filter rules
 * @param {boolean} isFilterActive - Whether filter is active
 * @returns {Array} Filtered records
 */
export const applyFilterRules = (records, filterRules, isFilterActive) => {
  if (!isFilterActive || !filterRules || filterRules.length === 0) {
    return records;
  }

  return records.filter(record => {
    return filterRules.every(rule => {
      const value = record.data?.[rule.field];
      return evaluateFilterRule(value, rule);
    });
  });
};

/**
 * Evaluate a single filter rule
 * @param {any} value - Record value
 * @param {Object} rule - Filter rule
 * @returns {boolean} True if rule matches
 */
/**
 * Smart comparison for filter values
 * Handles type conversion appropriately
 */
const compareValues = (value, ruleValue, operator) => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (operator === 'is_empty') return true;
    if (operator === 'is_not_empty') return false;
    return ruleValue === null || ruleValue === undefined || ruleValue === '';
  }
  
  if (ruleValue === null || ruleValue === undefined || ruleValue === '') {
    if (operator === 'is_empty') return value === null || value === undefined || value === '';
    if (operator === 'is_not_empty') return !(value === null || value === undefined || value === '');
    return value === null || value === undefined || value === '';
  }
  
  // For number comparisons
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const numValue = Number(value);
    const numRuleValue = Number(ruleValue);
    
    // Only proceed if both can be converted to valid numbers
    if (!isNaN(numValue) && !isNaN(numRuleValue)) {
      return { numValue, numRuleValue, isNumber: true };
    }
  }
  
  // For string comparisons
  return { 
    strValue: String(value), 
    strRuleValue: String(ruleValue), 
    isNumber: false 
  };
};

/**
 * Evaluate a single filter rule
 * @param {any} value - Record value
 * @param {Object} rule - Filter rule
 * @returns {boolean} True if rule matches
 */
export const evaluateFilterRule = (value, rule) => {
  const comparison = compareValues(value, rule.value, rule.operator);
  
  switch (rule.operator) {
    case 'equals':
      if (comparison === true || comparison === false) return comparison;
      return comparison.isNumber 
        ? comparison.numValue === comparison.numRuleValue
        : comparison.strValue === comparison.strRuleValue;
        
    case 'not_equals':
      if (comparison === true || comparison === false) return !comparison;
      return comparison.isNumber 
        ? comparison.numValue !== comparison.numRuleValue
        : comparison.strValue !== comparison.strRuleValue;
        
    case 'contains':
      return String(value || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
    case 'not_contains':
      return !String(value || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
    case 'starts_with':
      return String(value || '').toLowerCase().startsWith(String(rule.value || '').toLowerCase());
    case 'ends_with':
      return String(value || '').toLowerCase().endsWith(String(rule.value || '').toLowerCase());
    case 'greater_than':
      return comparison.isNumber 
        ? comparison.numValue > comparison.numRuleValue
        : Number(value) > Number(rule.value);
    case 'less_than':
      return comparison.isNumber 
        ? comparison.numValue < comparison.numRuleValue
        : Number(value) < Number(rule.value);
    case 'greater_than_or_equal':
      return comparison.isNumber 
        ? comparison.numValue >= comparison.numRuleValue
        : Number(value) >= Number(rule.value);
    case 'less_than_or_equal':
      return comparison.isNumber 
        ? comparison.numValue <= comparison.numRuleValue
        : Number(value) <= Number(rule.value);
    case 'is_empty':
      return value === null || value === undefined || value === '';
    case 'is_not_empty':
      return value !== null && value !== undefined && value !== '';
    default:
      return true;
  }
};
/**
 * Get filter button style
 * @param {Array} filterRules - Filter rules
 * @returns {Object} Style object for filter button
 */
export const getFilterButtonStyle = (filterRules) => {
  const hasRules = filterRules && filterRules.length > 0;
  return {
    color: hasRules ? '#52c41a' : '#666',
    backgroundColor: hasRules ? '#f6ffed' : 'transparent',
    border: hasRules ? '1px solid #52c41a' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: hasRules ? '500' : 'normal'
  };
};

/**
 * Get filter dropdown position
 * @param {Event} e - Click event
 * @returns {Object} Position object with x, y coordinates
 */
export const getFilterDropdownPosition = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.bottom + 5
  };
};

/**
 * Toggle filter dropdown visibility
 * @param {boolean} showFilterDropdown - Current dropdown visibility
 * @returns {boolean} New dropdown visibility
 */
export const toggleFilterDropdown = (showFilterDropdown) => {
  return !showFilterDropdown;
};

/**
 * Validate filter rule
 * @param {Object} rule - Filter rule object
 * @returns {boolean} True if rule is valid
 */
export const validateFilterRule = (rule) => {
  return rule && 
         typeof rule === 'object' && 
         rule.field && 
         rule.operator && 
         rule.value !== undefined;
};

/**
 * Get default filter rule for a field
 * @param {string} field - Field name
 * @param {string} dataType - Field data type
 * @returns {Object} Default filter rule
 */
export const getDefaultFilterRule = (field, dataType = 'text') => {
  const operatorOptions = getOperatorOptions(dataType);
  return {
    field,
    operator: operatorOptions[0]?.value || 'equals',
    value: ''
  };
};

/**
 * Check if field supports filtering
 * @param {string} dataType - Field data type
 * @returns {boolean} True if field supports filtering
 */
export const isFieldFilterable = (dataType) => {
  const supportedTypes = ['text', 'number', 'date', 'checkbox', 'single_select', 'multi_select', 'email', 'url', 'currency'];
  return supportedTypes.includes(dataType);
};

/**
 * Get filter summary text
 * @param {Array} filterRules - Filter rules
 * @param {boolean} isFilterActive - Filter active state
 * @returns {string} Summary text
 */
export const getFilterSummary = (filterRules, isFilterActive) => {
  if (!isFilterActive || !filterRules || filterRules.length === 0) {
    return 'No filters applied';
  }
  
  const count = filterRules.length;
  return `${count} filter${count > 1 ? 's' : ''} applied`;
};
