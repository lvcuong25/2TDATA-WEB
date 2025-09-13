/**
 * Row Height Management utilities
 * Provides functions to handle row height settings and display logic
 */

// Row height presets
export const ROW_HEIGHT_PRESETS = {
  SHORT: { key: 'short', label: 'Ngắn', height: 32, icon: 'short' },
  MEDIUM: { key: 'medium', label: 'Trung bình', height: 48, icon: 'medium' },
  TALL: { key: 'tall', label: 'Cao', height: 64, icon: 'tall' },
  CUSTOM: { key: 'custom', label: 'Thêm', height: null, icon: 'custom' }
};

/**
 * Get row height from state or default
 * @param {Object} rowHeightSettings - Row height settings state
 * @param {string} tableId - Table ID
 * @param {number} defaultHeight - Default height if not set
 * @returns {number} Row height in pixels
 */
export const getRowHeight = (rowHeightSettings, tableId, defaultHeight = 48) => {
  const settings = rowHeightSettings[tableId];
  if (!settings) return defaultHeight;
  
  if (settings.preset === 'custom' && settings.customHeight) {
    return settings.customHeight;
  }
  
  const preset = Object.values(ROW_HEIGHT_PRESETS).find(p => p.key === settings.preset);
  return preset ? preset.height : defaultHeight;
};

/**
 * Get current row height preset
 * @param {Object} rowHeightSettings - Row height settings state
 * @param {string} tableId - Table ID
 * @returns {Object} Current preset object
 */
export const getCurrentRowHeightPreset = (rowHeightSettings, tableId) => {
  const settings = rowHeightSettings[tableId];
  if (!settings) return ROW_HEIGHT_PRESETS.MEDIUM;
  
  if (settings.preset === 'custom') {
    return ROW_HEIGHT_PRESETS.CUSTOM;
  }
  
  return Object.values(ROW_HEIGHT_PRESETS).find(p => p.key === settings.preset) || ROW_HEIGHT_PRESETS.MEDIUM;
};

/**
 * Save row height settings to localStorage
 * @param {string} tableId - Table ID
 * @param {Object} settings - Row height settings to save
 */
export const saveRowHeightSettings = (tableId, settings) => {
  localStorage.setItem(`table_${tableId}_row_height`, JSON.stringify(settings));
};

/**
 * Load row height settings from localStorage
 * @param {string} tableId - Table ID
 * @returns {Object} Row height settings object
 */
export const loadRowHeightSettings = (tableId) => {
  const saved = localStorage.getItem(`table_${tableId}_row_height`);
  return saved ? JSON.parse(saved) : { preset: 'medium', customHeight: null };
};

/**
 * Get row height style object
 * @param {number} height - Row height in pixels
 * @returns {Object} Style object for row height
 */
export const getRowHeightStyle = (height) => {
  return {
    minHeight: `${height}px`,
    height: `${height}px`
  };
};

/**
 * Get row content style based on height
 * @param {number} height - Row height in pixels
 * @returns {Object} Style object for row content
 */
export const getRowContentStyle = (height) => {
  const padding = Math.max(4, Math.floor(height * 0.1)); // 10% of height, minimum 4px
  return {
    padding: `${padding}px 8px`,
    minHeight: `${height}px`,
    display: 'flex',
    alignItems: 'center'
  };
};

/**
 * Get cell content style based on height (for data cells only)
 * @param {number} height - Row height in pixels
 * @returns {Object} Style object for cell content
 */
export const getCellContentStyle = (height) => {
  const padding = Math.max(4, Math.floor(height * 0.1)); // 10% of height, minimum 4px
  return {
    padding: `${padding}px 8px`,
    minHeight: `${height}px`
  };
};

/**
 * Get row height icon component - Simple up/down arrow icon
 * @param {string} iconType - Icon type (short, medium, tall, custom)
 * @returns {JSX.Element} Icon component
 */
export const getRowHeightIcon = (iconType) => {
  const iconStyle = {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Simple up/down arrow icon like in the image
  return (
    <div style={iconStyle}>
      <div style={{
        width: '8px',
        height: '12px',
        position: 'relative'
      }}>
        {/* Up arrow */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '3px solid transparent',
          borderRight: '3px solid transparent',
          borderBottom: '4px solid #666'
        }} />
        {/* Down arrow */}
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '3px solid transparent',
          borderRight: '3px solid transparent',
          borderTop: '4px solid #666'
        }} />
      </div>
    </div>
  );
};
