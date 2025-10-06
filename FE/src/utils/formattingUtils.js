/**
 * Frontend formatting utilities
 */

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
 * Apply formatting styles to a cell
 * @param {Object} baseStyle - Base cell style
 * @param {Object} formatting - Formatting to apply
 * @returns {Object} - Merged style object
 */
export const applyCellFormatting = (baseStyle, formatting) => {
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
 * Get rule type display information
 */
export const getRuleTypeInfo = (ruleType) => {
  const types = {
    cell_value: {
      label: 'Cell Value',
      icon: '🔢',
      description: 'Format based on cell value conditions'
    },
    date: {
      label: 'Date',
      icon: '📅',
      description: 'Format based on date conditions'
    },
    text_contains: {
      label: 'Text Contains',
      icon: '📝',
      description: 'Format based on text content'
    },
    formula: {
      label: 'Formula',
      icon: '🧮',
      description: 'Format based on formula results'
    },
    cross_column: {
      label: 'Cross Column',
      icon: '🔗',
      description: 'Format based on other column values'
    }
  };

  return types[ruleType] || {
    label: 'Unknown',
    icon: '⚙️',
    description: 'Unknown rule type'
  };
};

/**
 * Get operator display information
 */
export const getOperatorInfo = (operator) => {
  const operators = {
    equals: { label: 'Equals', symbol: '=' },
    not_equals: { label: 'Not Equals', symbol: '≠' },
    greater_than: { label: 'Greater Than', symbol: '>' },
    less_than: { label: 'Less Than', symbol: '<' },
    greater_than_or_equal: { label: 'Greater Than or Equal', symbol: '≥' },
    less_than_or_equal: { label: 'Less Than or Equal', symbol: '≤' },
    between: { label: 'Between', symbol: '↔' },
    not_between: { label: 'Not Between', symbol: '↮' },
    contains: { label: 'Contains', symbol: '⊃' },
    not_contains: { label: 'Does Not Contain', symbol: '⊅' },
    starts_with: { label: 'Starts With', symbol: '^' },
    ends_with: { label: 'Ends With', symbol: '$' },
    is_empty: { label: 'Is Empty', symbol: '∅' },
    is_not_empty: { label: 'Is Not Empty', symbol: '∅̸' },
    today: { label: 'Today', symbol: '📅' },
    yesterday: { label: 'Yesterday', symbol: '📅' },
    tomorrow: { label: 'Tomorrow', symbol: '📅' },
    last_7_days: { label: 'Last 7 Days', symbol: '📅' },
    next_7_days: { label: 'Next 7 Days', symbol: '📅' },
    this_month: { label: 'This Month', symbol: '📅' },
    last_month: { label: 'Last Month', symbol: '📅' },
    before: { label: 'Before', symbol: '<' },
    after: { label: 'After', symbol: '>' },
    between_dates: { label: 'Between Dates', symbol: '↔' },
    regex: { label: 'Regular Expression', symbol: '.*' }
  };

  return operators[operator] || {
    label: operator,
    symbol: '?'
  };
};

/**
 * Get target type display information
 */
export const getTargetTypeInfo = (targetType) => {
  const types = {
    all_members: {
      label: 'All Members',
      icon: '👥',
      description: 'Visible to all database members'
    },
    specific_user: {
      label: 'Specific User',
      icon: '👤',
      description: 'Visible to specific user only'
    },
    specific_role: {
      label: 'Specific Role',
      icon: '👑',
      description: 'Visible to users with specific role'
    }
  };

  return types[targetType] || {
    label: 'Unknown',
    icon: '❓',
    description: 'Unknown target type'
  };
};

/**
 * Validate formatting rule on frontend
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

/**
 * Generate preview text for a condition
 */
export const generateConditionPreview = (condition, ruleType) => {
  const operatorInfo = getOperatorInfo(condition.operator);
  
  if (['is_empty', 'is_not_empty', 'today', 'yesterday', 'tomorrow', 'last_7_days', 'next_7_days', 'this_month', 'last_month'].includes(condition.operator)) {
    return operatorInfo.label;
  }

  if (condition.operator === 'between' || condition.operator === 'not_between') {
    return `${operatorInfo.label} ${condition.value?.min || '?'} and ${condition.value?.max || '?'}`;
  }

  if (condition.operator === 'between_dates') {
    return `${operatorInfo.label} ${condition.value?.start || '?'} and ${condition.value?.end || '?'}`;
  }

  return `${operatorInfo.label} ${condition.value || '?'}`;
};

/**
 * Generate preview text for a rule
 */
export const generateRulePreview = (rule) => {
  const ruleTypeInfo = getRuleTypeInfo(rule.ruleType);
  const conditions = rule.conditions || [];
  
  if (conditions.length === 0) {
    return `${ruleTypeInfo.label}: No conditions`;
  }

  const conditionPreviews = conditions.map(condition => 
    generateConditionPreview(condition, rule.ruleType)
  );

  return `${ruleTypeInfo.label}: ${conditionPreviews.join(' AND ')}`;
};

/**
 * Color utilities
 */
export const colorUtils = {
  /**
   * Check if a color is light or dark
   */
  isLightColor: (color) => {
    if (!color) return true;
    
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5;
  },

  /**
   * Get contrasting text color for a background
   */
  getContrastingTextColor: (backgroundColor) => {
    return colorUtils.isLightColor(backgroundColor) ? '#000000' : '#ffffff';
  },

  /**
   * Convert hex to RGB
   */
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex: (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
};
