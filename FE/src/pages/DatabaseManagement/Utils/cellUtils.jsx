/**
 * Cell editing utilities
 * Provides functions to handle cell editing, validation, and formatting
 */

/**
 * Initialize cell editing state
 * @param {string} recordId - Record ID
 * @param {string} columnName - Column name
 * @param {any} currentValue - Current cell value
 * @param {Object} column - Column configuration
 * @returns {Object} Cell editing state
 */
export const initializeCellEditing = (recordId, columnName, currentValue, column) => {
  const editingCell = { recordId, columnName };
  
  let cellValue;
  if (column) {
    if (column.dataType === 'multi_select') {
      // For multi-select, ensure we have an array
      cellValue = Array.isArray(currentValue) ? currentValue : [];
    } else if (column.dataType === 'single_select') {
      // For single-select, use string
      cellValue = currentValue || '';
    } else {
      // For other types, use string
      cellValue = currentValue || '';
    }
  } else {
    cellValue = currentValue || '';
  }

  return { editingCell, cellValue };
};

/**
 * Cancel cell editing
 * @returns {Object} Reset state
 */
export const cancelCellEditing = () => {
  return {
    editingCell: null,
    cellValue: ''
  };
};

/**
 * Check if a cell is currently being edited
 * @param {Object} editingCell - Current editing cell state
 * @param {string} recordId - Record ID to check
 * @param {string} columnName - Column name to check
 * @returns {boolean} True if cell is being edited
 */
export const isCellEditing = (editingCell, recordId, columnName) => {
  return editingCell?.recordId === recordId && editingCell?.columnName === columnName;
};

/**
 * Validate cell value based on column data type
 * @param {any} value - Value to validate
 * @param {Object} column - Column configuration
 * @returns {Object} Validation result
 */
export const validateCellValue = (value, column) => {
  if (!column) {
    return { isValid: true, error: null };
  }

  const { dataType } = column;

  switch (dataType) {
    case 'number':
    case 'currency':
      if (value !== '' && value !== null && value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { isValid: false, error: 'Must be a valid number' };
        }
      }
      break;

    case 'email':
      if (value && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { isValid: false, error: 'Must be a valid email address' };
        }
      }
      break;

    case 'url':
      if (value && value !== '') {
        let urlToValidate = value;
        
        // Auto-add protocol
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
            const protocol = column.urlConfig.protocol;
            urlToValidate = `${protocol}://${value}`;
          } else if (!column.urlConfig) {
            // Fallback for old columns without urlConfig
            urlToValidate = `https://${value}`;
          }
          // If protocol is 'none', don't add protocol (keep original value)
        }
        
        try {
          new URL(urlToValidate);
        } catch {
          return { isValid: false, error: 'Must be a valid URL' };
        }
      }
      break;

    case 'date':
    case 'datetime':
      if (value && value !== '') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { isValid: false, error: 'Must be a valid date' };
        }
      }
      break;

    case 'single_select':
      if (value && value !== '') {
        const options = column.singleSelectConfig?.options || [];
        if (!options.includes(value)) {
          return { isValid: false, error: 'Must be one of the available options' };
        }
      }
      break;

    case 'multi_select':
      if (Array.isArray(value) && value.length > 0) {
        const options = column.multiSelectConfig?.options || [];
        const invalidOptions = value.filter(v => !options.includes(v));
        if (invalidOptions.length > 0) {
          return { isValid: false, error: 'All values must be from available options' };
        }
      }
      break;

    default:
      break;
  }

  return { isValid: true, error: null };
};

/**
 * Format cell value for display
 * @param {any} value - Cell value
 * @param {Object} column - Column configuration
 * @returns {string} Formatted value for display
 */
export const formatCellValueForDisplay = (value, column) => {
  if (!column) return value;

  const { dataType } = column;

  switch (dataType) {
    case 'date':
    case 'datetime':
      if (value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return dataType === 'date' 
              ? date.toLocaleDateString()
              : date.toLocaleString();
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      return value || '';

    case 'number':
    case 'currency':
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (dataType === 'currency') {
            const currency = column.currencyConfig?.currency || 'USD';
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency
            }).format(numValue);
          }
          return numValue.toLocaleString();
        }
      }
      return value || '';

    case 'checkbox':
      return value ? '✓' : '';

    case 'multi_select':
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ');
      }
      return '';

    case 'email':
      if (value && value !== '') {
        return value; // Return email as-is for display, will be formatted in component
      }
      return '';

    case 'url':
      if (value && value !== '') {
        let displayUrl = value;
        
        // Auto-add protocol
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
            const protocol = column.urlConfig.protocol;
            displayUrl = `${protocol}://${value}`;
          } else if (column.urlConfig && column.urlConfig.protocol === 'none') {
            // Don't add protocol, keep original value
            displayUrl = value;
          } else if (!column.urlConfig) {
            // Fallback for old columns without urlConfig
            displayUrl = `https://${value}`;
          }
        }
        
        return displayUrl; // Return URL with protocol for display
      }
      return '';

    default:
      return value || '';
  }
};

/**
 * Format cell value for input
 * @param {any} value - Cell value
 * @param {Object} column - Column configuration
 * @returns {string} Formatted value for input
 */
export const formatCellValueForInput = (value, column) => {
  if (!column) return value;

  const { dataType } = column;

  switch (dataType) {
    case 'date':
    case 'datetime':
      if (value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            if (dataType === 'date') {
              return `${year}-${month}-${day}`;
            } else {
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            }
          }
        } catch (e) {
          console.error('Error formatting date for input:', e);
        }
      }
      return '';

    case 'number':
    case 'currency':
      return value || '';

    case 'checkbox':
      return value ? true : false;

    case 'multi_select':
      return Array.isArray(value) ? value : [];

    default:
      return value || '';
  }
};

/**
 * Get cell input type based on column data type
 * @param {Object} column - Column configuration
 * @returns {string} Input type
 */
export const getCellInputType = (column) => {
  if (!column) return 'text';

  const { dataType } = column;

  switch (dataType) {
    case 'number':
    case 'currency':
      return 'number';
    case 'email':
      return 'email';
    case 'url':
      return 'url';
    case 'date':
      return 'date';
    case 'datetime':
      return 'datetime-local';
    default:
      return 'text';
  }
};

/**
 * Get cell input placeholder
 * @param {Object} column - Column configuration
 * @returns {string} Placeholder text
 */
export const getCellInputPlaceholder = (column) => {
  if (!column) return '';

  const { dataType } = column;

  switch (dataType) {
    case 'number':
    case 'currency':
      return 'Enter number';
    case 'email':
      return 'Enter email';
    case 'url':
      return 'Enter URL';
    case 'date':
      return 'Select date';
    case 'datetime':
      return 'Select date and time';
    case 'text':
      return 'Enter text';
    default:
      return 'Enter value';
  }
};

/**
 * Check if cell should be editable
 * @param {Object} column - Column configuration
 * @returns {boolean} True if cell should be editable
 */
export const isCellEditable = (column) => {
  if (!column) return false;
  
  // System fields are not editable
  if (column.isSystem) return false;
  
  // Formula fields are not editable
  if (column.dataType === 'formula') return false;
  
  return true;
};

/**
 * Get cell editing style
 * @param {boolean} isEditing - Whether cell is being edited
 * @returns {Object} Style object
 */
export const getCellEditingStyle = (isEditing) => {
  return {
    width: '100%',
    height: '100%',
    border: 'none',
    padding: '0',
    margin: '0',
    borderRadius: '0',
    backgroundColor: isEditing ? '#fff' : 'transparent',
    outline: 'none',
    fontSize: '12px'
  };
};

/**
 * Handle cell value change
 * @param {any} newValue - New value
 * @param {Object} column - Column configuration
 * @param {Function} setCellValue - Set cell value function
 * @param {Function} onSave - Save callback
 * @returns {void}
 */
export const handleCellValueChange = (newValue, column, setCellValue, onSave) => {
  setCellValue(newValue);
  
  // Auto-save for certain data types
  if (column && ['checkbox', 'single_select'].includes(column.dataType)) {
    if (onSave) {
      onSave();
    }
  }
};

/**
 * Prepare cell data for saving
 * @param {any} cellValue - Current cell value
 * @param {Object} column - Column configuration
 * @param {Object} record - Record data
 * @returns {Object} Updated record data
 */
export const prepareCellDataForSave = (cellValue, column, record) => {
  const updatedData = { ...record.data };
  
  // Handle URL with protocol
  if (column.dataType === 'url' && cellValue && cellValue !== '') {
    let urlToSave = cellValue;
    
    // Auto-add protocol
    if (!cellValue.startsWith('http://') && !cellValue.startsWith('https://')) {
      if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
        const protocol = column.urlConfig.protocol;
        urlToSave = `${protocol}://${cellValue}`;
      } else if (column.urlConfig && column.urlConfig.protocol === 'none') {
        // Don't add protocol, keep original value
        urlToSave = cellValue;
      } else if (!column.urlConfig) {
        // Fallback for old columns without urlConfig
        urlToSave = `https://${cellValue}`;
      }
    }
    
    updatedData[column.name] = urlToSave;
  } else {
    updatedData[column.name] = cellValue;
  }
  
  return updatedData;
};

/**
 * Get cell validation error message
 * @param {Object} column - Column configuration
 * @param {any} value - Cell value
 * @returns {string|null} Error message or null
 */
export const getCellValidationError = (column, value) => {
  const validation = validateCellValue(value, column);
  return validation.isValid ? null : validation.error;
};

/**
 * Check if cell should auto-save
 * @param {Object} column - Column configuration
 * @returns {boolean} True if cell should auto-save
 */
export const shouldAutoSave = (column) => {
  if (!column) return false;
  
  const autoSaveTypes = ['checkbox', 'single_select'];
  return autoSaveTypes.includes(column.dataType);
};

/**
 * Get cell display component type
 * @param {Object} column - Column configuration
 * @returns {string} Component type
 */
export const getCellDisplayComponentType = (column) => {
  if (!column) return 'text';

  const { dataType } = column;

  switch (dataType) {
    case 'checkbox':
      return 'checkbox';
    case 'single_select':
      return 'select';
    case 'multi_select':
      return 'multiselect';
    case 'date':
    case 'datetime':
      return 'date';
    case 'number':
    case 'currency':
      return 'number';
    case 'email':
      return 'email';
    case 'url':
      return 'url';
    default:
      return 'text';
  }
};

/**
 * Format cell value for export
 * @param {any} value - Cell value
 * @param {Object} column - Column configuration
 * @returns {string} Formatted value for export
 */
export const formatCellValueForExport = (value, column) => {
  if (!column) return value;

  const { dataType } = column;

  switch (dataType) {
    case 'multi_select':
      if (Array.isArray(value) && value.length > 0) {
        return value.join('; ');
      }
      return '';

    case 'checkbox':
      return value ? 'Yes' : 'No';

    case 'date':
    case 'datetime':
      if (value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (e) {
          console.error('Error formatting date for export:', e);
        }
      }
      return '';

    default:
      return value || '';
  }
};
