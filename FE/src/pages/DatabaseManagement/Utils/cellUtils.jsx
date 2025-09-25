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
    } else if (column.dataType === 'percent') {
      // For percent, use the raw value or default value
      if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
        // If currentValue is a formatted string like "12%", extract the number
        if (typeof currentValue === 'string' && currentValue.includes('%')) {
          cellValue = currentValue.replace('%', '');
        } else {
          cellValue = currentValue;
        }
      } else {
        // Use default value if no current value
        cellValue = column.percentConfig?.defaultValue || 0;
      }
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

    case 'year':
      if (value !== '' && value !== null && value !== undefined) {
        const yearValue = Number(value);
        if (isNaN(yearValue)) {
          return { isValid: false, error: 'Must be a valid year' };
        }
        
        // Check if it's a whole number
        if (!Number.isInteger(yearValue)) {
          return { isValid: false, error: 'Year must be a whole number' };
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

    case 'phone':
      if (value && value !== '') {
        // Phone number validation - supports various formats including Vietnamese numbers
        const phoneRegex = /^[\+]?[0-9][\d]{6,15}$/;
        const cleanPhone = value.replace(/[\s\-\(\)\.]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          return { isValid: false, error: 'Phone number should be 7-16 digits and can start with 0 or +' };
        }
      }
      break;

    case 'time':
      if (value && value !== '') {
        // Time validation - supports both 12h and 24h format based on column config
        const format = column.timeConfig?.format || '24';
        
        if (format === '24') {
          // 24-hour format: HH:MM (00:00 to 23:59)
          const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!time24Regex.test(value)) {
            return { isValid: false, error: 'Time must be in 24-hour format (e.g., 14:30)' };
          }
        } else {
          // 12-hour format: H:MM AM/PM (1:00 AM to 12:59 PM)
          const time12Regex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
          if (!time12Regex.test(value)) {
            return { isValid: false, error: 'Time must be in 12-hour format (e.g., 2:30 PM)' };
          }
        }
      }
      break;

    case 'rating':
      if (value && value !== '') {
        // Rating validation - always supports half ratings
        const maxStars = column.ratingConfig?.maxStars || 5;
        const allowHalf = true; // Always allow half stars
        
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return { isValid: false, error: 'Rating must be a number' };
        }
        
        if (numValue < 0) {
          return { isValid: false, error: 'Rating cannot be negative' };
        }
        
        if (numValue > maxStars) {
          return { isValid: false, error: `Rating cannot exceed ${maxStars} stars` };
        }
        
        if (!allowHalf && numValue % 1 !== 0) {
          return { isValid: false, error: 'Half stars are not allowed' };
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

    case 'percent':
      // Use default value if no value provided
      const displayValue = (value !== null && value !== undefined && value !== '') ? value : (column.percentConfig?.defaultValue || 0);
      
      console.log('Percent display debug:', {
        value,
        percentConfig: column.percentConfig,
        defaultValue: column.percentConfig?.defaultValue,
        displayValue
      });
      
      // Always display something if we have a displayValue
      if (displayValue !== null && displayValue !== undefined) {
        const numValue = Number(displayValue);
        if (!isNaN(numValue)) {
          const { displayFormat = 'percentage', displayAsProgress = false } = column.percentConfig || {};
          
          if (displayAsProgress) {
            // Progress bar is handled in TableBody component
            // Return empty string here as the actual display is handled by ProgressBar component
            return '';
          } else {
            // Normal display
            if (displayFormat === 'percentage') {
              return `${numValue.toFixed(0)}%`;
            } else {
              return numValue.toFixed(2);
            }
          }
        }
      }
      return '';

    case 'checkbox':
      return value ? '✓' : '';

    case 'rating':
      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          const maxStars = column.ratingConfig?.maxStars || 5;
          const starIcon = '★';
          const emptyStarIcon = '☆';
          
          // Create visual star representation
          let stars = '';
          for (let i = 1; i <= maxStars; i++) {
            if (i <= Math.floor(numValue)) {
              stars += starIcon;
            } else if (i - 0.5 <= numValue) {
              stars += '★'; // Half star (for now, use full star)
            } else {
              stars += emptyStarIcon;
            }
          }
          
          return `${stars} (${numValue})`;
        }
      }
      return '';

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
    case 'formula':
      // Formula columns display their calculated results
      if (value !== null && value !== undefined) {
        // Format the calculated result based on its type
        if (typeof value === 'number') {
          return value.toLocaleString();
        } else if (typeof value === 'boolean') {
          return value ? '✓' : '✗';
        } else if (value instanceof Date) {
          return value.toLocaleString();
        } else {
          return String(value);
        }
      }
      return 'No result';


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
    case 'percent':
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
    case 'percent':
      return 'number';
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'time':
      return 'time';
    case 'rating':
      return 'number';
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
    case 'phone':
      return 'Enter phone number';
    case 'time':
      const format = column.timeConfig?.format || '24';
      return format === '24' ? 'Enter time (HH:MM)' : 'Enter time (H:MM AM/PM)';
    case 'rating':
      const maxStars = column.ratingConfig?.maxStars || 5;
      return `Enter rating (0-${maxStars}, e.g., 3.5)`;
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
  } else if (column.dataType === 'year' && cellValue && cellValue !== '') {
    // Convert year to number
    const yearValue = Number(cellValue);
    updatedData[column.name] = isNaN(yearValue) ? cellValue : yearValue;
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
