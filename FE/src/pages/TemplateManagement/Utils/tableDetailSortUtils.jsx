/**
 * Table Detail sorting utilities
 * Provides functions to manage sorting logic for table records
 */

/**
 * Add a new sort rule
 * @param {Array} sortRules - Current sort rules
 * @param {string} currentSortField - Field to sort by
 * @param {string} currentSortOrder - Sort order (asc/desc)
 * @returns {Array} Updated sort rules
 */
export const addSortRule = (sortRules, currentSortField, currentSortOrder) => {
  if (!currentSortField) {
    return sortRules;
  }

  const newRule = {
    field: currentSortField,
    order: currentSortOrder
  };

  return [...sortRules, newRule];
};

/**
 * Remove a sort rule by index
 * @param {Array} sortRules - Current sort rules
 * @param {number} index - Index of rule to remove
 * @returns {Array} Updated sort rules
 */
export const removeSortRule = (sortRules, index) => {
  return sortRules.filter((_, i) => i !== index);
};

/**
 * Clear all sort rules
 * @returns {Array} Empty sort rules array
 */
export const clearAllSorts = () => {
  return [];
};

/**
 * Update a sort rule
 * @param {Array} sortRules - Current sort rules
 * @param {number} index - Index of rule to update
 * @param {string} field - New field name
 * @param {string} order - New sort order
 * @returns {Array} Updated sort rules
 */
export const updateSortRule = (sortRules, index, field, order) => {
  const newRules = [...sortRules];
  newRules[index] = { field, order };
  return newRules;
};

/**
 * Auto-add sort rule when field is selected
 * @param {Array} sortRules - Current sort rules
 * @param {string} fieldName - Field name to add
 * @param {string} currentSortOrder - Sort order
 * @returns {Array} Updated sort rules
 */
export const handleSortFieldSelect = (sortRules, fieldName, currentSortOrder) => {
  const newRule = {
    field: fieldName,
    order: currentSortOrder
  };
  return [...sortRules, newRule];
};

/**
 * Get sort dropdown position
 * @param {Event} e - Click event
 * @returns {Object} Position object with x, y coordinates
 */
export const getSortDropdownPosition = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.bottom + 5
  };
};

/**
 * Toggle sort dropdown visibility
 * @param {boolean} showSortDropdown - Current dropdown visibility
 * @returns {boolean} New dropdown visibility
 */
export const toggleSortDropdown = (showSortDropdown) => {
  return !showSortDropdown;
};

/**
 * Check if sort rules are active
 * @param {Array} sortRules - Current sort rules
 * @returns {boolean} True if sort rules exist
 */
export const isSortActive = (sortRules) => {
  return sortRules && sortRules.length > 0;
};

/**
 * Get sort rules count
 * @param {Array} sortRules - Current sort rules
 * @returns {number} Number of sort rules
 */
export const getSortRulesCount = (sortRules) => {
  return sortRules ? sortRules.length : 0;
};

/**
 * Validate sort rule
 * @param {Object} rule - Sort rule object
 * @returns {boolean} True if rule is valid
 */
export const validateSortRule = (rule) => {
  return rule && 
         typeof rule === 'object' && 
         rule.field && 
         rule.order && 
         ['asc', 'desc'].includes(rule.order);
};

/**
 * Get sort order options
 * @returns {Array} Array of sort order options
 */
export const getSortOrderOptions = () => {
  return [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' }
  ];
};

/**
 * Get sort order label
 * @param {string} order - Sort order
 * @returns {string} Human readable label
 */
export const getSortOrderLabel = (order) => {
  const options = getSortOrderOptions();
  const option = options.find(opt => opt.value === order);
  return option ? option.label : order;
};

/**
 * Create sort rule object
 * @param {string} field - Field name
 * @param {string} order - Sort order
 * @returns {Object} Sort rule object
 */
export const createSortRule = (field, order = 'asc') => {
  return {
    field,
    order
  };
};

/**
 * Check if field is already in sort rules
 * @param {Array} sortRules - Current sort rules
 * @param {string} fieldName - Field name to check
 * @returns {boolean} True if field is already sorted
 */
export const isFieldSorted = (sortRules, fieldName) => {
  return sortRules.some(rule => rule.field === fieldName);
};

/**
 * Get sort order for a specific field
 * @param {Array} sortRules - Current sort rules
 * @param {string} fieldName - Field name
 * @returns {string|null} Sort order or null if not found
 */
export const getFieldSortOrder = (sortRules, fieldName) => {
  const rule = sortRules.find(rule => rule.field === fieldName);
  return rule ? rule.order : null;
};

/**
 * Toggle sort order for a field
 * @param {string} currentOrder - Current sort order
 * @returns {string} Toggled sort order
 */
export const toggleSortOrder = (currentOrder) => {
  return currentOrder === 'asc' ? 'desc' : 'asc';
};

/**
 * Get sort button style based on sort state
 * @param {Array} sortRules - Current sort rules
 * @returns {Object} Style object for sort button
 */
export const getSortButtonStyle = (sortRules) => {
  const isActive = isSortActive(sortRules);
  return {
    color: isActive ? '#fa8c16' : '#666',
    backgroundColor: isActive ? '#fff2e8' : 'transparent',
    border: isActive ? '1px solid #fa8c16' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };
};

/**
 * Get sort badge style
 * @returns {Object} Style object for sort badge
 */
export const getSortBadgeStyle = () => {
  return {
    backgroundColor: '#fa8c16',
    color: 'white',
    borderRadius: '50%',
    minWidth: '18px',
    height: '18px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
};
