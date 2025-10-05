/**
 * Conditional Formatting Engine
 * Handles evaluation of formatting rules and application of styles
 */

/**
 * Apply conditional formatting to a record
 * @param {Object} record - Record data
 * @param {Array} columns - Array of column definitions
 * @param {Array} formattingRules - Array of formatting rules
 * @param {Object} user - Current user object
 * @returns {Object} - Record with applied formatting
 */
export const applyConditionalFormatting = (record, columns, formattingRules, user = null) => {
  if (!formattingRules || formattingRules.length === 0) {
    return record;
  }

  const formattedData = { ...record.data };
  const appliedFormatting = {};

  // Sort rules by priority (higher priority first)
  const sortedRules = [...formattingRules].sort((a, b) => b.priority - a.priority);

  columns.forEach(column => {
    // Use column.key for data access (lowercase) instead of column.name (display name)
    const cellValue = record.data?.[column.key] || record.data?.[column.name];
    const applicableRules = getApplicableRules(cellValue, column, sortedRules, user);

    if (applicableRules.length > 0) {
      // Apply formatting from the highest priority rule
      const topRule = applicableRules[0];
      appliedFormatting[column.name] = topRule.formatting;
    }
  });

  return {
    ...record,
    data: formattedData,
    formatting: appliedFormatting
  };
};

/**
 * Get rules that apply to a specific cell
 * @param {*} cellValue - Value of the cell
 * @param {Object} column - Column definition
 * @param {Array} rules - Array of formatting rules
 * @param {Object} user - Current user object
 * @returns {Array} - Array of applicable rules
 */
export const getApplicableRules = (cellValue, column, rules, user = null) => {
  return rules.filter(rule => {
    // Check if rule is active
    if (!rule.isActive) {
      return false;
    }

    // Check column match
    // If rule has columnId, it must match this column
    if (rule.columnId && rule.columnId !== column._id && rule.columnId !== column.id) {
      return false;
    }

    // Check user permissions for this rule
    if (!hasPermissionForRule(rule, user)) {
      return false;
    }

    // Check conditions
    return evaluateConditions(cellValue, rule.conditions, rule.ruleType);
  });
};

/**
 * Check if user has permission to see this formatting rule
 * @param {Object} rule - Formatting rule
 * @param {Object} user - Current user object
 * @returns {Boolean} - Whether user has permission
 */
export const hasPermissionForRule = (rule, user) => {
  if (!user) {
    return false;
  }

  // Super admin can see all rules
  if (user.role === 'super_admin') {
    return true;
  }

  // Check target type
  switch (rule.targetType) {
    case 'all_members':
      return true;
    case 'specific_user':
      return rule.targetUserId === user._id;
    case 'specific_role':
      return rule.targetRole === user.role;
    default:
      return false;
  }
};

/**
 * Evaluate conditions for a cell value
 * @param {*} cellValue - Value of the cell
 * @param {Array} conditions - Array of conditions
 * @param {String} ruleType - Type of rule
 * @returns {Boolean} - Whether conditions are met
 */
export const evaluateConditions = (cellValue, conditions, ruleType) => {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  // Handle different rule types
  switch (ruleType) {
    case 'cell_value':
      return evaluateCellValueConditions(cellValue, conditions);
    case 'date':
      return evaluateDateConditions(cellValue, conditions);
    case 'text_contains':
      return evaluateTextConditions(cellValue, conditions);
    case 'formula':
      return evaluateFormulaConditions(cellValue, conditions);
    case 'cross_column':
      return evaluateCrossColumnConditions(cellValue, conditions);
    default:
      return false;
  }
};

/**
 * Evaluate cell value conditions
 */
const evaluateCellValueConditions = (cellValue, conditions) => {
  return conditions.every(condition => {
    const { operator, value } = condition;
    
    switch (operator) {
      case 'equals':
        return cellValue == value;
      case 'not_equals':
        return cellValue != value;
      case 'greater_than':
        return Number(cellValue) > Number(value);
      case 'less_than':
        return Number(cellValue) < Number(value);
      case 'greater_than_or_equal':
        return Number(cellValue) >= Number(value);
      case 'less_than_or_equal':
        return Number(cellValue) <= Number(value);
      case 'between':
        return Number(cellValue) >= Number(value.min) && Number(cellValue) <= Number(value.max);
      case 'not_between':
        return Number(cellValue) < Number(value.min) || Number(cellValue) > Number(value.max);
      case 'is_empty':
        return !cellValue || cellValue === '';
      case 'is_not_empty':
        return cellValue && cellValue !== '';
      default:
        return false;
    }
  });
};

/**
 * Evaluate date conditions
 */
const evaluateDateConditions = (cellValue, conditions) => {
  if (!cellValue) return false;
  
  const cellDate = new Date(cellValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return conditions.every(condition => {
    const { operator, value } = condition;
    
    switch (operator) {
      case 'today':
        return cellDate.toDateString() === today.toDateString();
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return cellDate.toDateString() === yesterday.toDateString();
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return cellDate.toDateString() === tomorrow.toDateString();
      case 'last_7_days':
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return cellDate >= lastWeek && cellDate <= today;
      case 'next_7_days':
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return cellDate >= today && cellDate <= nextWeek;
      case 'this_month':
        return cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
      case 'last_month':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return cellDate.getMonth() === lastMonth.getMonth() && cellDate.getFullYear() === lastMonth.getFullYear();
      case 'before':
        return cellDate < new Date(value);
      case 'after':
        return cellDate > new Date(value);
      case 'between_dates':
        return cellDate >= new Date(value.start) && cellDate <= new Date(value.end);
      default:
        return false;
    }
  });
};

/**
 * Evaluate text conditions
 */
const evaluateTextConditions = (cellValue, conditions) => {
  const cellText = String(cellValue || '').toLowerCase();
  
  return conditions.every(condition => {
    const { operator, value } = condition;
    const searchText = String(value || '').toLowerCase();
    
    switch (operator) {
      case 'contains':
        return cellText.includes(searchText);
      case 'not_contains':
        return !cellText.includes(searchText);
      case 'starts_with':
        return cellText.startsWith(searchText);
      case 'ends_with':
        return cellText.endsWith(searchText);
      case 'equals':
        return cellText === searchText;
      case 'not_equals':
        return cellText !== searchText;
      case 'regex':
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(cellValue);
        } catch (e) {
          return false;
        }
      case 'is_empty':
        return !cellValue || cellValue === '';
      case 'is_not_empty':
        return cellValue && cellValue !== '';
      default:
        return false;
    }
  });
};

/**
 * Evaluate formula conditions (placeholder for future implementation)
 */
const evaluateFormulaConditions = (cellValue, conditions) => {
  // TODO: Implement formula evaluation
  // This would require a formula parser and evaluator
  return false;
};

/**
 * Evaluate cross-column conditions (placeholder for future implementation)
 */
const evaluateCrossColumnConditions = (cellValue, conditions) => {
  // TODO: Implement cross-column comparisons
  // This would require access to other column values
  return false;
};

/**
 * Merge formatting styles
 * @param {Object} baseStyle - Base cell style
 * @param {Object} formatting - Formatting to apply
 * @returns {Object} - Merged style object
 */
export const mergeFormattingStyles = (baseStyle, formatting) => {
  if (!formatting) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundColor: formatting.backgroundColor || baseStyle.backgroundColor,
    color: formatting.textColor || baseStyle.color,
    fontWeight: formatting.fontWeight || baseStyle.fontWeight,
    fontStyle: formatting.fontStyle || baseStyle.fontStyle,
    textDecoration: formatting.textDecoration || baseStyle.textDecoration,
    borderColor: formatting.borderColor || baseStyle.borderColor,
    borderStyle: formatting.borderStyle || baseStyle.borderStyle,
    borderWidth: formatting.borderWidth || baseStyle.borderWidth
  };
};

/**
 * Get default formatting options
 */
export const getDefaultFormattingOptions = () => {
  return {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    borderColor: '#d9d9d9',
    borderStyle: 'solid',
    borderWidth: '1px'
  };
};

/**
 * Validate formatting rule
 * @param {Object} rule - Formatting rule to validate
 * @returns {Object} - Validation result
 */
export const validateFormattingRule = (rule) => {
  const errors = [];

  if (!rule.ruleName || rule.ruleName.trim() === '') {
    errors.push('Rule name is required');
  }

  if (!rule.ruleType) {
    errors.push('Rule type is required');
  }

  if (!rule.conditions || !Array.isArray(rule.conditions) || rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  }

  if (!rule.formatting || typeof rule.formatting !== 'object') {
    errors.push('Formatting options are required');
  }

  if (rule.priority && (typeof rule.priority !== 'number' || rule.priority < 1)) {
    errors.push('Priority must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
