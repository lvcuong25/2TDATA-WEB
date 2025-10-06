/**
 * Field visibility utilities
 * Provides functions to handle field visibility, system fields, and field preferences
 */

import { canViewColumn } from './permissionUtils.jsx';

/**
 * System field definitions
 */
export const SYSTEM_FIELDS = [
  { _id: 'system_id', name: 'Id', dataType: 'text', isSystem: true },
  { _id: 'system_createdAt', name: 'CreatedAt', dataType: 'datetime', isSystem: true },
  { _id: 'system_updatedAt', name: 'UpdatedAt', dataType: 'datetime', isSystem: true }
];

/**
 * System field IDs
 */
export const SYSTEM_FIELD_IDS = SYSTEM_FIELDS.map(field => field._id);


/**
 * Get all columns including system fields
 * @param {Array} columns - Regular columns
 * @param {boolean} showSystemFields - Whether to show system fields
 * @returns {Array} All columns with system fields
 */
export const getAllColumnsWithSystem = (columns, showSystemFields) => {
  if (showSystemFields) {
    return [...columns, ...SYSTEM_FIELDS];
  }
  return columns;
};

/**
 * Get visible columns based on visibility settings and permissions
 * @param {Array} columns - Regular columns
 * @param {Object} fieldVisibility - Field visibility object
 * @param {boolean} showSystemFields - Whether to show system fields
 * @param {Array} columnPermissions - Array of column permissions (optional)
 * @param {Object} user - Current user object (optional)
 * @param {string} userRole - User's role in the database (optional)
 * @returns {Array} Visible columns
 */
export const getVisibleColumns = (columns, fieldVisibility, showSystemFields, columnPermissions = null, user = null, userRole = null) => {
  const allColumnsWithSystem = getAllColumnsWithSystem(columns, showSystemFields);

  return allColumnsWithSystem.filter(column => {
    // For system fields, show if showSystemFields is true and not explicitly hidden
    if (column.isSystem) {
      if (!showSystemFields) return false;
      if (fieldVisibility[column._id] === false) return false;
      return true; // Show system fields by default when showSystemFields is true
    }
    
    // For regular fields, first check UI visibility
    let isUIVisible = true;
    if (fieldVisibility[column._id] !== undefined) {
      isUIVisible = fieldVisibility[column._id];
    }
    
    // If UI visibility is false, don't show the column
    if (!isUIVisible) {
      return false;
    }
    
    // If permissions are provided, check column permissions
    if (columnPermissions && user && userRole) {
      // Use imported permission check function
      const hasPermission = canViewColumn(columnPermissions, column._id, user, userRole);
      console.log(`🚨 Column ${column.name} (${column._id}): hasPermission=${hasPermission}, userRole=${userRole}`);
      
      // Find relevant permissions for this column
      const columnPerms = columnPermissions.filter(perm => perm.columnId === column._id);
      console.log(`🚨 Column ${column.name} permissions:`, columnPerms.map(p => ({
        targetType: p.targetType,
        canView: p.canView,
        canEdit: p.canEdit,
        userId: p.userId?._id,
        role: p.role
      })));
      
      if (columnPerms.length > 0) {
        console.log(`🚨 Column ${column.name} will be ${hasPermission ? 'VISIBLE' : 'HIDDEN'} due to permissions`);
      }
      
      return hasPermission;
    }
    
    // Default to visible if no permission check needed
    return true;
  });
};

/**
 * Toggle field visibility
 * @param {Object} fieldVisibility - Current field visibility
 * @param {string} columnId - Column ID to toggle
 * @returns {Object} Updated field visibility
 */
export const toggleFieldVisibility = (fieldVisibility, columnId) => {
  return {
    ...fieldVisibility,
    [columnId]: !fieldVisibility[columnId]
  };
};

/**
 * Set field visibility
 * @param {Object} fieldVisibility - Current field visibility
 * @param {string} columnId - Column ID
 * @param {boolean} isVisible - Whether field should be visible
 * @returns {Object} Updated field visibility
 */
export const setFieldVisibility = (fieldVisibility, columnId, isVisible) => {
  return {
    ...fieldVisibility,
    [columnId]: isVisible
  };
};

/**
 * Toggle system fields visibility
 * @param {boolean} showSystemFields - Current system fields visibility
 * @param {Object} fieldVisibility - Current field visibility
 * @returns {Object} Updated state
 */
export const toggleSystemFields = (showSystemFields, fieldVisibility) => {
  const newShowSystemFields = !showSystemFields;
  
  // If showing system fields for the first time, set their default visibility to true
  if (newShowSystemFields) {
    const newFieldVisibility = { ...fieldVisibility };
    
    SYSTEM_FIELD_IDS.forEach(fieldId => {
      if (newFieldVisibility[fieldId] === undefined) {
        newFieldVisibility[fieldId] = true; // Default visible
      }
    });
    
    return {
      showSystemFields: newShowSystemFields,
      fieldVisibility: newFieldVisibility
    };
  }
  
  return {
    showSystemFields: newShowSystemFields,
    fieldVisibility
  };
};

/**
 * Check if field is visible
 * @param {Object} fieldVisibility - Field visibility object
 * @param {string} columnId - Column ID
 * @param {boolean} isSystemField - Whether field is a system field
 * @param {boolean} showSystemFields - Whether system fields are shown
 * @returns {boolean} True if field is visible
 */
export const isFieldVisible = (fieldVisibility, columnId, isSystemField, showSystemFields) => {
  if (isSystemField) {
    if (!showSystemFields) return false;
    if (fieldVisibility[columnId] === false) return false;
    return true;
  }
  
  if (fieldVisibility[columnId] === undefined) {
    return true;
  }
  return fieldVisibility[columnId];
};

/**
 * Get field visibility count
 * @param {Object} fieldVisibility - Field visibility object
 * @returns {number} Number of fields with visibility settings
 */
export const getFieldVisibilityCount = (fieldVisibility) => {
  return Object.keys(fieldVisibility).length;
};

/**
 * Get hidden fields count
 * @param {Object} fieldVisibility - Field visibility object
 * @returns {number} Number of hidden fields
 */
export const getHiddenFieldsCount = (fieldVisibility) => {
  return Object.values(fieldVisibility).filter(visible => visible === false).length;
};

/**
 * Get visible fields count
 * @param {Object} fieldVisibility - Field visibility object
 * @returns {number} Number of visible fields
 */
export const getVisibleFieldsCount = (fieldVisibility) => {
  return Object.values(fieldVisibility).filter(visible => visible === true).length;
};

/**
 * Get field visibility button style
 * @param {Object} fieldVisibility - Field visibility object
 * @returns {Object} Style object for field visibility button
 */
export const getFieldVisibilityButtonStyle = (fieldVisibility) => {
  const hasSettings = getFieldVisibilityCount(fieldVisibility) > 0;
  return {
    color: hasSettings ? '#1890ff' : '#666',
    backgroundColor: hasSettings ? '#e6f7ff' : 'transparent',
    border: hasSettings ? '1px solid #1890ff' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };
};

/**
 * Get system fields button style
 * @param {boolean} showSystemFields - Whether system fields are shown
 * @returns {Object} Style object for system fields button
 */
export const getSystemFieldsButtonStyle = (showSystemFields) => {
  return {
    color: showSystemFields ? '#52c41a' : '#666',
    fontSize: '12px',
    backgroundColor: showSystemFields ? '#f6ffed' : 'transparent',
    border: showSystemFields ? '1px solid #52c41a' : 'none'
  };
};

/**
 * Get field item style
 * @param {Object} fieldVisibility - Field visibility object
 * @param {string} columnId - Column ID
 * @param {boolean} isSystemField - Whether field is a system field
 * @returns {Object} Style object for field item
 */
export const getFieldItemStyle = (fieldVisibility, columnId, isSystemField) => {
  const isHidden = fieldVisibility[columnId] === false;
  return {
    backgroundColor: isHidden ? '#f5f5f5' : (isSystemField ? '#f6ffed' : 'white'),
    opacity: isHidden ? 0.6 : 1,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    borderLeft: isSystemField ? '3px solid #52c41a' : 'none'
  };
};

/**
 * Get field checkbox style
 * @param {Object} fieldVisibility - Field visibility object
 * @param {string} columnId - Column ID
 * @param {boolean} isSystemField - Whether field is a system field
 * @returns {Object} Style object for field checkbox
 */
export const getFieldCheckboxStyle = (fieldVisibility, columnId, isSystemField) => {
  const isHidden = fieldVisibility[columnId] === false;
  return {
    color: isHidden ? '#ff4d4f' : (isSystemField ? '#52c41a' : '#1890ff')
  };
};

/**
 * Get field hover style
 * @param {Object} fieldVisibility - Field visibility object
 * @param {string} columnId - Column ID
 * @returns {Object} Style object for field hover
 */
export const getFieldHoverStyle = (fieldVisibility, columnId) => {
  const isHidden = fieldVisibility[columnId] === false;
  if (isHidden) {
    return {
      backgroundColor: '#e6f7ff',
      opacity: '1'
    };
  }
  return {};
};

/**
 * Get field leave style
 * @param {Object} fieldVisibility - Field visibility object
 * @param {string} columnId - Column ID
 * @param {boolean} isSystemField - Whether field is a system field
 * @returns {Object} Style object for field leave
 */
export const getFieldLeaveStyle = (fieldVisibility, columnId, isSystemField) => {
  const isHidden = fieldVisibility[columnId] === false;
  return {
    backgroundColor: isHidden ? '#f5f5f5' : (isSystemField ? '#f6ffed' : 'white'),
    opacity: isHidden ? 0.6 : 1
  };
};

/**
 * Filter fields by search term
 * @param {Array} fields - Fields to filter
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered fields
 */
export const filterFieldsBySearch = (fields, searchTerm) => {
  if (!searchTerm) return fields;
  
  return fields.filter(field => 
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

/**
 * Sort fields by visibility and name
 * @param {Array} fields - Fields to sort
 * @param {Object} fieldVisibility - Field visibility object
 * @returns {Array} Sorted fields
 */
export const sortFieldsByVisibility = (fields, fieldVisibility) => {
  return [...fields].sort((a, b) => {
    // First sort by visibility (visible first)
    const aVisible = isFieldVisible(fieldVisibility, a._id, a.isSystem, true);
    const bVisible = isFieldVisible(fieldVisibility, b._id, b.isSystem, true);
    
    if (aVisible !== bVisible) {
      return aVisible ? -1 : 1;
    }
    
    // Then sort by system fields (regular fields first)
    if (a.isSystem !== b.isSystem) {
      return a.isSystem ? 1 : -1;
    }
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get field visibility summary
 * @param {Object} fieldVisibility - Field visibility object
 * @param {boolean} showSystemFields - Whether system fields are shown
 * @returns {string} Summary text
 */
export const getFieldVisibilitySummary = (fieldVisibility, showSystemFields) => {
  const totalFields = Object.keys(fieldVisibility).length;
  const hiddenFields = getHiddenFieldsCount(fieldVisibility);
  const visibleFields = getVisibleFieldsCount(fieldVisibility);
  
  if (totalFields === 0) {
    return 'No visibility settings';
  }
  
  let summary = `${visibleFields} visible`;
  if (hiddenFields > 0) {
    summary += `, ${hiddenFields} hidden`;
  }
  
  if (showSystemFields) {
    summary += ', system fields shown';
  }
  
  return summary;
};

/**
 * Reset field visibility to default
 * @param {Array} columns - All columns
 * @param {boolean} showSystemFields - Whether system fields are shown
 * @returns {Object} Default field visibility
 */
export const resetFieldVisibilityToDefault = (columns, showSystemFields) => {
  const defaultVisibility = {};
  
  // Set all regular fields to visible by default
  columns.forEach(column => {
    defaultVisibility[column._id] = true;
  });
  
  // Set system fields to visible if showSystemFields is true
  if (showSystemFields) {
    SYSTEM_FIELD_IDS.forEach(fieldId => {
      defaultVisibility[fieldId] = true;
    });
  }
  
  return defaultVisibility;
};

/**
 * Export field visibility settings
 * @param {Object} fieldVisibility - Field visibility object
 * @param {boolean} showSystemFields - Whether system fields are shown
 * @returns {Object} Exportable field visibility settings
 */
export const exportFieldVisibilitySettings = (fieldVisibility, showSystemFields) => {
  return {
    fieldVisibility,
    showSystemFields,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
};

/**
 * Import field visibility settings
 * @param {Object} settings - Imported settings
 * @returns {Object} Field visibility settings
 */
export const importFieldVisibilitySettings = (settings) => {
  return {
    fieldVisibility: settings.fieldVisibility || {},
    showSystemFields: settings.showSystemFields || false
  };
};
