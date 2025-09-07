/**
 * Column Management utilities
 * Provides functions to handle column width, resize, and display logic
 */

/**
 * Get column width from state or default
 * @param {Object} columnWidths - Column widths state
 * @param {string} columnId - Column ID
 * @param {number} defaultWidth - Default width if not set
 * @returns {number} Column width
 */
export const getColumnWidth = (columnWidths, columnId, defaultWidth = 150) => {
  return columnWidths[columnId] || defaultWidth;
};

/**
 * Check if column is in compact mode (width < threshold)
 * @param {Object} columnWidths - Column widths state
 * @param {string} columnId - Column ID
 * @param {number} threshold - Width threshold for compact mode
 * @returns {boolean} True if column is compact
 */
export const isColumnCompact = (columnWidths, columnId, threshold = 80) => {
  return getColumnWidth(columnWidths, columnId) < threshold;
};

/**
 * Save column widths to localStorage
 * @param {string} tableId - Table ID
 * @param {Object} columnWidths - Column widths to save
 */
export const saveColumnWidths = (tableId, columnWidths) => {
  localStorage.setItem(`table_${tableId}_column_widths`, JSON.stringify(columnWidths));
};

/**
 * Load column widths from localStorage
 * @param {string} tableId - Table ID
 * @returns {Object} Column widths object
 */
export const loadColumnWidths = (tableId) => {
  const saved = localStorage.getItem(`table_${tableId}_column_widths`);
  return saved ? JSON.parse(saved) : {};
};

/**
 * Calculate new column width during resize
 * @param {number} startWidth - Initial width
 * @param {number} startX - Initial mouse X position
 * @param {number} currentX - Current mouse X position
 * @param {number} minWidth - Minimum width
 * @returns {number} New width
 */
export const calculateNewWidth = (startWidth, startX, currentX, minWidth = 50) => {
  const deltaX = currentX - startX;
  return Math.max(minWidth, startWidth + deltaX);
};

/**
 * Update column width in state
 * @param {Object} columnWidths - Current column widths
 * @param {string} columnId - Column ID
 * @param {number} newWidth - New width
 * @returns {Object} Updated column widths
 */
export const updateColumnWidth = (columnWidths, columnId, newWidth) => {
  return {
    ...columnWidths,
    [columnId]: newWidth
  };
};

/**
 * Get column style object for header
 * @param {Object} columnWidths - Column widths state
 * @param {string} columnId - Column ID
 * @param {Object} column - Column object
 * @param {Array} sortRules - Sort rules
 * @param {Array} groupRules - Group rules
 * @returns {Object} Style object
 */
export const getColumnHeaderStyle = (columnWidths, columnId, column, sortRules = [], groupRules = []) => {
  const width = getColumnWidth(columnWidths, columnId);
  const isCompact = isColumnCompact(columnWidths, columnId);
  
  return {
    width: `${width}px`,
    minWidth: '50px',
    padding: isCompact ? '4px' : '8px',
    borderRight: '1px solid #d9d9d9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCompact ? 'center' : 'space-between',
    backgroundColor: column.isSystem ? '#f6ffed' : 
                   sortRules.some(rule => rule.field === column.name) ? '#fff2e8' : 
                   groupRules.some(rule => rule.field === column.name) ? '#f6ffed' : '#f5f5f5',
    position: 'relative',
    borderTop: column.isSystem ? '2px solid #52c41a' :
               sortRules.some(rule => rule.field === column.name) ? '2px solid #fa8c16' : 
               groupRules.some(rule => rule.field === column.name) ? '2px solid #52c41a' : 'none'
  };
};

/**
 * Get column style object for data cells
 * @param {Object} columnWidths - Column widths state
 * @param {string} columnId - Column ID
 * @returns {Object} Style object
 */
export const getColumnDataStyle = (columnWidths, columnId) => {
  const width = getColumnWidth(columnWidths, columnId);
  
  return {
    width: `${width}px`,
    minWidth: '50px',
    padding: '0',
    borderRight: '1px solid #d9d9d9',
    position: 'relative',
    minHeight: '40px'
  };
};

/**
 * Get resize handle style
 * @param {boolean} isResizing - Whether currently resizing
 * @param {string} resizingColumn - Currently resizing column ID
 * @param {string} columnId - Column ID
 * @returns {Object} Style object
 */
export const getResizeHandleStyle = (isResizing, resizingColumn, columnId) => {
  return {
    position: 'absolute',
    right: '-3px',
    top: 0,
    bottom: 0,
    width: '6px',
    cursor: 'col-resize',
    backgroundColor: (isResizing && resizingColumn === columnId) ? '#d9d9d9' : 'transparent',
    zIndex: 10
  };
};

/**
 * Get column header content style for compact mode
 * @param {Object} column - Column object
 * @returns {Object} Style object
 */
export const getCompactHeaderStyle = (column) => {
  return {
    fontSize: '14px',
    fontWeight: 'bold',
    color: column.isSystem ? '#52c41a' : '#666',
    fontStyle: column.isSystem ? 'italic' : 'normal'
  };
};

/**
 * Get column header content style for normal mode
 * @param {Object} column - Column object
 * @param {Object} fieldVisibility - Field visibility state
 * @returns {Object} Style object
 */
export const getNormalHeaderStyle = (column, fieldVisibility) => {
  return {
    fontSize: '13px',
    flex: 1,
    fontWeight: fieldVisibility[column._id] === false ? '400' : (column.isSystem ? '400' : '500'),
    color: fieldVisibility[column._id] === false ? '#999' : (column.isSystem ? '#52c41a' : '#333'),
    fontStyle: column.isSystem ? 'italic' : 'normal',
    textDecoration: fieldVisibility[column._id] === false ? 'line-through' : 'none'
  };
};

/**
 * Initialize column widths state
 * @param {string} tableId - Table ID
 * @returns {Object} Initial column widths state
 */
export const initializeColumnWidths = (tableId) => {
  return loadColumnWidths(tableId);
};

/**
 * Reset column widths to default
 * @param {Array} columns - Array of column objects
 * @param {number} defaultWidth - Default width
 * @returns {Object} Default column widths
 */
export const resetColumnWidths = (columns, defaultWidth = 150) => {
  const defaultWidths = {};
  columns.forEach(column => {
    defaultWidths[column._id] = defaultWidth;
  });
  return defaultWidths;
};

/**
 * Get column width for display
 * @param {Object} columnWidths - Column widths state
 * @param {string} columnId - Column ID
 * @returns {string} Width string for CSS
 */
export const getColumnWidthString = (columnWidths, columnId) => {
  return `${getColumnWidth(columnWidths, columnId)}px`;
};

/**
 * Check if column should show compact content
 * @param {Object} columnWidths - Column widths state
 * @param {string} columnId - Column ID
 * @param {number} threshold - Width threshold
 * @returns {boolean} True if should show compact content
 */
export const shouldShowCompactContent = (columnWidths, columnId, threshold = 80) => {
  return isColumnCompact(columnWidths, columnId, threshold);
};
