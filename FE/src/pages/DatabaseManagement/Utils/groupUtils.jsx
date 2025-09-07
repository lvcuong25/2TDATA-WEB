/**
 * Group utilities
 * Provides functions to handle grouping logic, rules, and data aggregation
 */

/**
 * Create a new group rule
 * @param {string} field - Field name to group by
 * @returns {Object} Group rule object
 */
export const createGroupRule = (field) => {
  return {
    field
  };
};

/**
 * Add a new group rule
 * @param {Array} groupRules - Current group rules
 * @param {string} field - Field name to group by
 * @returns {Array} Updated group rules
 */
export const addGroupRule = (groupRules, field) => {
  const newRule = createGroupRule(field);
  return [...groupRules, newRule];
};

/**
 * Remove a group rule by index
 * @param {Array} groupRules - Current group rules
 * @param {number} index - Index of rule to remove
 * @returns {Array} Updated group rules
 */
export const removeGroupRule = (groupRules, index) => {
  return groupRules.filter((_, i) => i !== index);
};

/**
 * Update a group rule
 * @param {Array} groupRules - Current group rules
 * @param {number} index - Index of rule to update
 * @param {string} field - New field name
 * @returns {Array} Updated group rules
 */
export const updateGroupRule = (groupRules, index, field) => {
  const newRules = [...groupRules];
  newRules[index] = { field };
  return newRules;
};

/**
 * Clear all group rules
 * @returns {Array} Empty group rules array
 */
export const clearAllGroupRules = () => {
  return [];
};

/**
 * Get group rules count
 * @param {Array} groupRules - Group rules
 * @returns {number} Number of group rules
 */
export const getGroupRulesCount = (groupRules) => {
  return groupRules ? groupRules.length : 0;
};

/**
 * Check if field is already used in group rules
 * @param {Array} groupRules - Group rules
 * @param {string} field - Field name to check
 * @returns {boolean} True if field is already used
 */
export const isFieldUsedInGroup = (groupRules, field) => {
  return groupRules.some(rule => rule.field === field);
};

/**
 * Get available fields for grouping (excluding already used fields)
 * @param {Array} columns - Available columns
 * @param {Array} groupRules - Current group rules
 * @param {string} searchTerm - Search term to filter fields
 * @returns {Array} Available fields for grouping
 */
export const getAvailableGroupFields = (columns, groupRules, searchTerm = '') => {
  return columns.filter(column => {
    const matchesSearch = column.name.toLowerCase().includes(searchTerm.toLowerCase());
    const notUsed = !isFieldUsedInGroup(groupRules, column.name);
    return matchesSearch && notUsed;
  });
};

/**
 * Generate group key from group rules and record data
 * @param {Array} groupRules - Group rules
 * @param {Object} recordData - Record data
 * @returns {string} Group key
 */
export const generateGroupKey = (groupRules, recordData) => {
  let groupKey = '';
  groupRules.forEach(rule => {
    const value = recordData?.[rule.field] || '';
    groupKey += `${rule.field}:${value}|`;
  });
  return groupKey;
};

/**
 * Generate group values from group rules and record data
 * @param {Array} groupRules - Group rules
 * @param {Object} recordData - Record data
 * @returns {Array} Group values
 */
export const generateGroupValues = (groupRules, recordData) => {
  return groupRules.map(rule => recordData?.[rule.field] || '');
};

/**
 * Group records by group rules
 * @param {Array} records - Records to group
 * @param {Array} groupRules - Group rules
 * @returns {Object} Grouped data with groups and ungrouped records
 */
export const groupRecords = (records, groupRules) => {
  if (!groupRules || groupRules.length === 0) {
    return { groups: [], ungroupedRecords: records };
  }

  const groups = {};
  const ungroupedRecords = [];

  records.forEach(record => {
    const groupKey = generateGroupKey(groupRules, record.data);
    const groupValues = generateGroupValues(groupRules, record.data);

    if (groupKey) {
      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          values: groupValues,
          rules: groupRules,
          records: [],
          count: 0
        };
      }
      groups[groupKey].records.push(record);
      groups[groupKey].count++;
    } else {
      ungroupedRecords.push(record);
    }
  });

  // Convert to array
  const groupArray = Object.values(groups);

  return { groups: groupArray, ungroupedRecords };
};

/**
 * Toggle group expansion state
 * @param {Set} expandedGroups - Current expanded groups
 * @param {string} groupKey - Group key to toggle
 * @returns {Set} Updated expanded groups
 */
export const toggleGroupExpansion = (expandedGroups, groupKey) => {
  const newExpanded = new Set(expandedGroups);
  if (newExpanded.has(groupKey)) {
    newExpanded.delete(groupKey);
  } else {
    newExpanded.add(groupKey);
  }
  return newExpanded;
};

/**
 * Expand all groups
 * @param {Array} groups - Array of groups
 * @returns {Set} Set of all group keys
 */
export const expandAllGroups = (groups) => {
  const allGroupKeys = groups.map(group => group.key);
  return new Set(allGroupKeys);
};

/**
 * Collapse all groups
 * @returns {Set} Empty set
 */
export const collapseAllGroups = () => {
  return new Set();
};

/**
 * Check if group is expanded
 * @param {Set} expandedGroups - Expanded groups set
 * @param {string} groupKey - Group key to check
 * @returns {boolean} True if group is expanded
 */
export const isGroupExpanded = (expandedGroups, groupKey) => {
  return expandedGroups.has(groupKey);
};

/**
 * Get group button style
 * @param {Array} groupRules - Group rules
 * @returns {Object} Style object for group button
 */
export const getGroupButtonStyle = (groupRules) => {
  const hasRules = groupRules && groupRules.length > 0;
  return {
    color: hasRules ? '#52c41a' : '#666',
    backgroundColor: hasRules ? '#f6ffed' : 'transparent',
    border: hasRules ? '1px solid #52c41a' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };
};

/**
 * Get group dropdown position
 * @param {Event} e - Click event
 * @returns {Object} Position object with x, y coordinates
 */
export const getGroupDropdownPosition = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.bottom + 5
  };
};

/**
 * Toggle group dropdown visibility
 * @param {boolean} showGroupDropdown - Current dropdown visibility
 * @returns {boolean} New dropdown visibility
 */
export const toggleGroupDropdown = (showGroupDropdown) => {
  return !showGroupDropdown;
};

/**
 * Validate group rule
 * @param {Object} rule - Group rule object
 * @returns {boolean} True if rule is valid
 */
export const validateGroupRule = (rule) => {
  return rule && 
         typeof rule === 'object' && 
         rule.field && 
         typeof rule.field === 'string' &&
         rule.field.trim() !== '';
};

/**
 * Get default group rule for a field
 * @param {string} field - Field name
 * @returns {Object} Default group rule
 */
export const getDefaultGroupRule = (field) => {
  return {
    field: field || ''
  };
};

/**
 * Check if field supports grouping
 * @param {string} dataType - Field data type
 * @returns {boolean} True if field supports grouping
 */
export const isFieldGroupable = (dataType) => {
  const supportedTypes = ['text', 'number', 'date', 'checkbox', 'single_select', 'multi_select', 'email', 'url', 'currency'];
  return supportedTypes.includes(dataType);
};

/**
 * Get group summary text
 * @param {Array} groupRules - Group rules
 * @returns {string} Summary text
 */
export const getGroupSummary = (groupRules) => {
  if (!groupRules || groupRules.length === 0) {
    return 'No grouping applied';
  }
  
  const count = groupRules.length;
  return `Grouped by ${count} field${count > 1 ? 's' : ''}`;
};

/**
 * Get group display name
 * @param {Array} groupValues - Group values
 * @param {Array} groupRules - Group rules
 * @returns {string} Display name for the group
 */
export const getGroupDisplayName = (groupValues, groupRules) => {
  if (!groupValues || !groupRules || groupValues.length !== groupRules.length) {
    return 'Unknown Group';
  }

  return groupValues.map((value, index) => {
    const field = groupRules[index].field;
    const displayValue = value === '' || value === null || value === undefined ? '(empty)' : value;
    return `${field}: ${displayValue}`;
  }).join(', ');
};

/**
 * Calculate group statistics
 * @param {Array} records - Records in the group
 * @param {Array} columns - Available columns
 * @returns {Object} Group statistics
 */
export const calculateGroupStats = (records, columns) => {
  if (!records || records.length === 0) {
    return {
      totalRecords: 0,
      numericFields: {},
      textFields: {}
    };
  }

  const stats = {
    totalRecords: records.length,
    numericFields: {},
    textFields: {}
  };

  // Analyze each column
  columns.forEach(column => {
    const values = records.map(record => record.data?.[column.name]).filter(v => v !== null && v !== undefined);
    
    if (values.length === 0) return;

    if (['number', 'currency'].includes(column.dataType)) {
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        stats.numericFields[column.name] = {
          sum: numericValues.reduce((a, b) => a + b, 0),
          avg: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          count: numericValues.length
        };
      }
    } else {
      stats.textFields[column.name] = {
        uniqueValues: new Set(values).size,
        totalValues: values.length
      };
    }
  });

  return stats;
};

/**
 * Sort groups by group values
 * @param {Array} groups - Groups to sort
 * @param {Array} groupRules - Group rules
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Array} Sorted groups
 */
export const sortGroups = (groups, groupRules, sortOrder = 'asc') => {
  return [...groups].sort((a, b) => {
    for (let i = 0; i < groupRules.length; i++) {
      const aValue = a.values[i];
      const bValue = b.values[i];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
};
