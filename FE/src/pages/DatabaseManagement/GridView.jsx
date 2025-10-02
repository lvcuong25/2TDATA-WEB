import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateForDisplay, formatDateForInput } from '../../utils/dateFormatter.js';
import AddColumnModal from './Components/AddColumnModal';
import EditColumnModal from './Components/EditColumnModal';
import TableHeader from './Components/TableHeader';
import TableBody from './Components/TableBody';
import ContextMenu from './Components/ContextMenu';
import {
  addSortRule,
  removeSortRule,
  clearAllSorts,
  updateSortRule,
  handleSortFieldSelect,
  getSortDropdownPosition,
  toggleSortDropdown,
  isSortActive,
  getSortRulesCount,
  getSortButtonStyle,
  getSortBadgeStyle
} from './Utils/tableDetailSortUtils.jsx';
import {
  getDataTypeIcon,
  getDataTypeColor,
  getDataTypeTag
} from './Utils/dataTypeUtils.jsx';
import {
  getColumnWidth,
  isColumnCompact,
  saveColumnWidths,
  calculateNewWidth,
  updateColumnWidth,
  getColumnHeaderStyle,
  getColumnDataStyle,
  getResizeHandleStyle,
  getCompactHeaderStyle,
  getNormalHeaderStyle,
  initializeColumnWidths,
  getColumnWidthString,
  reorderColumns,
  generateColumnOrders,
  saveColumnOrder,
  loadColumnOrder
} from './Utils/columnUtils.jsx';
import {
  getOperatorOptions,
  addFilterRule,
  removeFilterRule,
  updateFilterRule,
  toggleFilterActive,
  applyFilterRules,
  getFilterButtonStyle
} from './Utils/filterUtils.jsx';
import {
  addGroupRule,
  removeGroupRule,
  updateGroupRule,
  clearAllGroupRules,
  groupRecords,
  toggleGroupExpansion,
  expandAllGroups,
  collapseAllGroups,
  isGroupExpanded,
  getGroupButtonStyle,
  getGroupDisplayName,
  calculateGroupStats,
  sortGroups
} from './Utils/groupUtils.jsx';
import {
  initializeCellEditing,
  cancelCellEditing,
  formatCellValueForDisplay,
  formatCellValueForInput,
  getCellInputType,
  getCellInputPlaceholder,
  isCellEditable,
  getCellEditingStyle,
  prepareCellDataForSave,
  getCellDisplayComponentType
} from './Utils/cellUtils.jsx';
import {
  getAllColumnsWithSystem,
  getVisibleColumns,
  toggleFieldVisibility,
  toggleSystemFields,
  getFieldVisibilityButtonStyle
} from './Utils/fieldVisibilityUtils.jsx';
import {
  loadRowHeightSettings,
  saveRowHeightSettings,
  getRowHeight,
  getRowHeightStyle,
  getRowContentStyle
} from './Utils/rowHeightUtils.jsx';
import RowHeightDropdown from './Components/RowHeightDropdown';
import { useParams, useNavigate } from 'react-router-dom';
import { useTableData } from './Hooks/useTableData';
import { useTableContext } from '../../contexts/TableContext';
import {
  Button,
  Typography,
  Spin,
  Alert
} from 'antd';
const { Text } = Typography;

const GridView = () => {
  const { databaseId, tableId, viewId } = useParams();
  const queryClient = useQueryClient();
  
  // Safe console.log helper
  const safeLog = (...args) => {
    if (typeof console !== 'undefined' && console.log) {
      console.log(...args);
    }
  };
  
  // Debug logging
  safeLog('🔍 GridView Debug:', {
    databaseId,
    tableId,
    viewId,
    fromUseParams: { databaseId, tableId, viewId }
  });

  // Reset editingColumn when tableId changes
  useEffect(() => {
    if (editingColumn) {
      safeLog('🔄 Table changed, resetting editingColumn state');
      setEditingColumn(null);
      setShowEditColumn(false);
    }
  }, [tableId]);
  
  const navigate = useNavigate();
  const { 
    selectedRowKeys, 
    setSelectedRowKeys, 
    selectAll, 
    setSelectAll, 
    handleSelectAll, 
    handleSelectRow, 
    setAllRecords 
  } = useTableContext();

  const [newColumn, setNewColumn] = useState({ 
    name: '', 
    dataType: 'text',
    checkboxConfig: {
      icon: 'check-circle',
      color: '#52c41a',
      defaultValue: false
    },
    singleSelectConfig: {
      options: [],
      defaultValue: ''
    },
    multiSelectConfig: {
      options: [],
      defaultValue: []
    },
    dateConfig: {
      format: 'DD/MM/YYYY'
    },
    formulaConfig: {
      formula: '',
      resultType: 'number',
      dependencies: [],
      description: ''
    },
    currencyConfig: {
      currency: 'USD',
      symbol: '$',
      position: 'before',
      decimalPlaces: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.'
    },
    urlConfig: {
      protocol: 'https'
    },
    phoneConfig: {
      // Phone doesn't need special config, but we include it for consistency
    },
    timeConfig: {
      format: '24'
    },
    ratingConfig: {
      maxStars: 5,
      icon: 'star',
      color: '#faad14',
      defaultValue: 0
    },
    linkedTableConfig: {
      linkedTableId: null,
      allowMultiple: false,
      defaultValue: null,
      filterRules: []
    },
    defaultValue: null
  });
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [addColumnPosition, setAddColumnPosition] = useState(null);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, recordId: null });
  const [sortRules, setSortRules] = useState([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortDropdownPosition, setSortDropdownPosition] = useState({ x: 0, y: 0 });

  // Grouping state
  const [groupRules, setGroupRules] = useState([]);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [groupDropdownPosition, setGroupDropdownPosition] = useState({ x: 0, y: 0 });
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Filtering state
  const [filterRules, setFilterRules] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ x: 0, y: 0 });
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Fields management state
  const [showFieldsDropdown, setShowFieldsDropdown] = useState(false);
  const [fieldsDropdownPosition, setFieldsDropdownPosition] = useState({ x: 0, y: 0 });
  const [fieldVisibility, setFieldVisibility] = useState({});
  const [showSystemFields, setShowSystemFields] = useState(false);
  const [fieldSearch, setFieldSearch] = useState('');

  // Row height management state
  const [rowHeightSettings, setRowHeightSettings] = useState({});

  // Group management state
  const [groupFieldSearch, setGroupFieldSearch] = useState('');
  const [currentGroupField, setCurrentGroupField] = useState('');

  // Sort management state
  const [sortFieldSearch, setSortFieldSearch] = useState('');
  const [currentSortField, setCurrentSortField] = useState('');

  // Filter management state
  const [filterFieldSearch, setFilterFieldSearch] = useState('');
  const [currentFilterField, setCurrentFilterField] = useState('');

  // Use table data hook
  const tableContext = {
    selectedRowKeys,
    setSelectedRowKeys,
    selectAll,
    setSelectAll,
    setAllRecords
  };

  // Modal callbacks for handling success states
  const modalCallbacks = {
    onAddColumnSuccess: () => {
      setShowAddColumn(false);
      setNewColumn({ 
        name: '', 
        dataType: 'text',
        checkboxConfig: {
          icon: 'check-circle',
          color: '#52c41a',
          defaultValue: false
        },
        singleSelectConfig: {
          options: [],
          defaultValue: ''
        },
        multiSelectConfig: {
          options: [],
          defaultValue: []
        },
        dateConfig: {
          format: 'DD/MM/YYYY'
        },
        urlConfig: {
          protocol: 'https'
        },
        phoneConfig: {
          // Phone doesn't need special config, but we include it for consistency
        },
        timeConfig: {
          format: '24'
        },
        ratingConfig: {
          maxStars: 5,
          icon: 'star',
          color: '#faad14',
          defaultValue: 0
        },
        linkedTableConfig: {
          linkedTableId: null,
          allowMultiple: false,
          defaultValue: null,
          filterRules: []
        }
      });
    },
    onEditColumnSuccess: () => {
      setShowEditColumn(false);
      setEditingColumn(null);
    }
  };

  const {
    groupPreferenceResponse,
    fieldPreferenceResponse,
    tableStructureResponse,
    recordsResponse,
    isLoading,
    error,
    saveGroupPreferenceMutation,
    saveFieldPreferenceMutation,
    addColumnMutation,
    addRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
    deleteAllRecordsMutation,
    updateColumnMutation,
    deleteColumnMutation,
  } = useTableData(tableId, databaseId, sortRules, filterRules, isFilterActive, tableContext, modalCallbacks);

  // Load group preferences from backend when data is available
  React.useEffect(() => {
    if (groupPreferenceResponse?.data) {
      const preference = groupPreferenceResponse.data;
      setGroupRules(preference.groupRules || []);
      setExpandedGroups(new Set(preference.expandedGroups || []));
    }
  }, [groupPreferenceResponse]);

  // Load field preferences from backend when data is available
  React.useEffect(() => {
    if (fieldPreferenceResponse?.data) {
      const preference = fieldPreferenceResponse.data;
      setFieldVisibility(preference.fieldVisibility || {});
      setShowSystemFields(preference.showSystemFields || false);
    }
  }, [fieldPreferenceResponse]);

  // Load row height settings from localStorage
  React.useEffect(() => {
    if (tableId && viewId) {
      const settings = loadRowHeightSettings(viewId);
      setRowHeightSettings(prev => ({
        ...prev,
        [viewId]: settings
      }));
    }
  }, [tableId, viewId]);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    return initializeColumnWidths(tableId);
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Column reordering state
  const [columnOrder, setColumnOrder] = useState(() => {
    return loadColumnOrder(tableId);
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Handle clicking outside sort dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown) {
        const dropdown = document.querySelector('[data-sort-dropdown]');
        const button = document.querySelector('[data-sort-button]');
        const antSelectDropdown = document.querySelector('.ant-select-dropdown');
        
        // Check if click is inside sort dropdown, sort button, or ant-select dropdown
        const isInsideSortDropdown = dropdown && dropdown.contains(event.target);
        const isInsideSortButton = button && button.contains(event.target);
        const isInsideAntSelectDropdown = antSelectDropdown && antSelectDropdown.contains(event.target);
        
        if (!isInsideSortDropdown && !isInsideSortButton && !isInsideAntSelectDropdown) {
          setShowSortDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSortDropdown]);

  // Handle clicking outside group dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGroupDropdown) {
        const dropdown = document.querySelector('[data-group-dropdown]');
        const button = document.querySelector('[data-group-button]');
        const antSelectDropdown = document.querySelector('.ant-select-dropdown');
        
        // Check if click is inside group dropdown, group button, or ant-select dropdown
        const isInsideGroupDropdown = dropdown && dropdown.contains(event.target);
        const isInsideGroupButton = button && button.contains(event.target);
        const isInsideAntSelectDropdown = antSelectDropdown && antSelectDropdown.contains(event.target);
        
        if (!isInsideGroupDropdown && !isInsideGroupButton && !isInsideAntSelectDropdown) {
          setShowGroupDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupDropdown]);

  // Handle clicking outside filter dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown) {
        const dropdown = document.querySelector('[data-filter-dropdown]');
        const button = document.querySelector('[data-filter-button]');
        
        const isInsideFilterDropdown = dropdown && dropdown.contains(event.target);
        const isInsideFilterButton = button && button.contains(event.target);
        
        if (!isInsideFilterDropdown && !isInsideFilterButton) {
          setShowFilterDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Handle clicking outside fields dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFieldsDropdown) {
        const dropdown = document.querySelector('[data-fields-dropdown]');
        const button = document.querySelector('[data-fields-button]');
        
        const isInsideFieldsDropdown = dropdown && dropdown.contains(event.target);
        const isInsideFieldsButton = button && button.contains(event.target);
        
        if (!isInsideFieldsDropdown && !isInsideFieldsButton) {
          setShowFieldsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFieldsDropdown]);

  // Column resizing handlers
  const handleResizeStart = (e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentWidth = getColumnWidth(columnWidths, columnId);
    const startClientX = e.clientX;
    
    setIsResizing(true);
    setResizingColumn(columnId);
    setStartX(startClientX);
    setStartWidth(currentWidth);

    const handleMouseMove = (moveEvent) => {
      const newWidth = calculateNewWidth(currentWidth, startClientX, moveEvent.clientX);
      const newWidths = updateColumnWidth(columnWidths, columnId, newWidth);
      
      setColumnWidths(newWidths);
      saveColumnWidths(tableId, newWidths);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      setStartX(0);
      setStartWidth(0);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Format datetime to YYYY-MM-DD HH:MM format
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  // Cell editing handlers
  const handleCellClick = (recordId, columnName, currentValue) => {
    const column = columns.find(col => col.name === columnName);
    
    // Set selected cell
    setSelectedCell({ recordId, columnName });
    
    // Only start editing if it's not a system field or checkbox
    if (!column.isSystem && column.dataType !== 'checkbox') {
      const { editingCell: newEditingCell, cellValue: newCellValue } = initializeCellEditing(recordId, columnName, currentValue, column);
      setEditingCell(newEditingCell);
      setCellValue(newCellValue);
    }
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    
    const record = records.find(r => r._id === editingCell.recordId);
    if (!record) return;

    const column = columns.find(col => col.name === editingCell.columnName);
    const updatedData = prepareCellDataForSave(cellValue, column, record);

    updateRecordMutation.mutate({
      recordId: editingCell.recordId,
      data: updatedData
    });
  };

  const handleCellCancel = () => {
    const { editingCell: newEditingCell, cellValue: newCellValue } = cancelCellEditing();
    setEditingCell(newEditingCell);
    setCellValue(newCellValue);
  };

  // Context menu handlers
  const handleContextMenu = (e, recordId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      recordId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({ visible: false, x: 0, y: 0, recordId: null });
  };

  const handleContextMenuDelete = () => {
    if (contextMenu.recordId) {
      deleteRecordMutation.mutate(contextMenu.recordId);
      handleContextMenuClose();
    }
  };

  // Group expansion handlers
  const handleToggleGroupExpansion = (groupKey) => {
    const newExpandedGroups = toggleGroupExpansion(expandedGroups, groupKey);
    setExpandedGroups(newExpandedGroups);
    
    // Save to backend
    saveGroupPreferenceMutation.mutate({
      groupRules,
      expandedGroups: Array.from(newExpandedGroups)
    });
  };

  const handleExpandAllGroups = () => {
    const allGroupKeys = expandAllGroups(groupedData.groups);
    setExpandedGroups(allGroupKeys);
  };

  const handleCollapseAllGroups = () => {
    const newExpandedGroups = collapseAllGroups();
    setExpandedGroups(newExpandedGroups);
    
    // Save to backend
    saveGroupPreferenceMutation.mutate({
      groupRules,
      expandedGroups: Array.from(newExpandedGroups)
    });
  };

  // Field visibility handlers
  const handleToggleFieldVisibility = (fieldName) => {
    const newFieldVisibility = toggleFieldVisibility(fieldVisibility, fieldName);
    setFieldVisibility(newFieldVisibility);
    
    // Save to backend
    saveFieldPreferenceMutation.mutate({
      fieldVisibility: newFieldVisibility,
      showSystemFields
    });
  };

  const handleToggleSystemFields = () => {
    const newShowSystemFields = toggleSystemFields(showSystemFields);
    setShowSystemFields(newShowSystemFields);
    
    // Save to backend
    saveFieldPreferenceMutation.mutate({
      fieldVisibility,
      showSystemFields: newShowSystemFields
    });
  };

  // Handle row height change
  const handleRowHeightChange = (tableId, settings) => {
    setRowHeightSettings(prev => ({
      ...prev,
      [viewId]: settings
    }));
    saveRowHeightSettings(viewId, settings);
  };

  // Filter handlers
  const handleFilterButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFilterDropdownPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setShowFilterDropdown(!showFilterDropdown);
  };

  const handleUpdateFilterRule = (index, field, operator, value) => {
    const newRules = updateFilterRule(filterRules, index, field, operator, value);
    setFilterRules(newRules);
  };

  const handleRemoveFilterRule = (index) => {
    const newRules = removeFilterRule(filterRules, index);
    setFilterRules(newRules);
  };

  const handleToggleFilterActive = () => {
    setIsFilterActive(!isFilterActive);
  };

  const handleAddFilterRule = () => {
    const newRules = addFilterRule(filterRules, '', 'equals', '');
    setFilterRules(newRules);
  };

  // Sort handlers
  const handleSortButtonClick = (e) => {
    const position = getSortDropdownPosition(e);
    setSortDropdownPosition(position);
    setShowSortDropdown(toggleSortDropdown(showSortDropdown));
  };

  const onSortFieldSelect = (fieldName) => {
    const newRules = addSortRule(sortRules, fieldName, 'asc');
    setSortRules(newRules);
    setCurrentSortField('');
    setSortFieldSearch('');
  };

  const handleUpdateSortRule = (index, field, order) => {
    const newRules = updateSortRule(sortRules, index, field, order);
    setSortRules(newRules);
  };

  const handleRemoveSortRule = (index) => {
    const newRules = removeSortRule(sortRules, index);
    setSortRules(newRules);
  };

  // Group handlers
  const handleGroupButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGroupDropdownPosition({
      x: rect.left,
      y: rect.bottom + 4
    });
    setShowGroupDropdown(!showGroupDropdown);
  };

  const handleGroupFieldSelect = (fieldName) => {
    const newGroupRules = addGroupRule(groupRules, fieldName);
    setGroupRules(newGroupRules);
    
    // Save to backend
    saveGroupPreferenceMutation.mutate({
      groupRules: newGroupRules,
      expandedGroups: Array.from(expandedGroups)
    });
  };

  const handleRemoveGroupRule = (index) => {
    const newGroupRules = removeGroupRule(groupRules, index);
    setGroupRules(newGroupRules);
    
    // Save to backend
    saveGroupPreferenceMutation.mutate({
      groupRules: newGroupRules,
      expandedGroups: Array.from(expandedGroups)
    });
  };

  const handleAddGroupRule = () => {
    const newGroupRules = addGroupRule(groupRules, '');
    setGroupRules(newGroupRules);
    
    // Save to backend
    saveGroupPreferenceMutation.mutate({
      groupRules: newGroupRules,
      expandedGroups: Array.from(expandedGroups)
    });
  };

  // Fields handlers
  const handleFieldsButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFieldsDropdownPosition({
      x: rect.left,
      y: rect.bottom + 4
    });
    setShowFieldsDropdown(!showFieldsDropdown);
  };

  // Add row handlers
  const handleAddRow = () => {
    if (!visibleColumns || visibleColumns.length === 0) {
      console.log('No visible columns available');
      return;
    }
    
    const emptyData = {};
    visibleColumns.forEach(column => {
      // Handle required fields specially
      if (column.isRequired) {
        if (column.dataType === 'text' || column.dataType === 'email' || column.dataType === 'phone' || column.dataType === 'url') {
          emptyData[column.name] = column.defaultValue || 'New Record';
        } else if (column.dataType === 'number' || column.dataType === 'currency') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'checkbox') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : false;
        } else if (column.dataType === 'rating') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'single_select') {
          emptyData[column.name] = column.defaultValue || '';
        } else if (column.dataType === 'multi_select') {
          emptyData[column.name] = column.defaultValue || [];
        } else if (column.dataType === 'linked_table') {
          emptyData[column.name] = column.defaultValue || null;
        } else {
          emptyData[column.name] = 'New Record';
        }
      } else {
        // Non-required fields
        if (column.dataType === 'checkbox') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : false;
        } else if (column.dataType === 'number' || column.dataType === 'currency') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'rating') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'single_select') {
          emptyData[column.name] = column.defaultValue || '';
        } else if (column.dataType === 'multi_select') {
          emptyData[column.name] = column.defaultValue || [];
        } else if (column.dataType === 'linked_table') {
          emptyData[column.name] = column.defaultValue || null;
        } else {
          emptyData[column.name] = '';
        }
      }
    });
    
    console.log('Adding new record with data:', emptyData);
    console.log('Table ID:', tableId);
    
    const recordData = {
      data: emptyData
    };
    
    addRecordMutation.mutate(recordData);
  };

  const handleAddRowToGroup = (groupValues, groupRules) => {
    if (!visibleColumns || visibleColumns.length === 0) {
      console.log('No visible columns available');
      return;
    }
    
    const emptyData = {};
    visibleColumns.forEach(column => {
      // Handle required fields specially
      if (column.isRequired) {
        if (column.dataType === 'text' || column.dataType === 'email' || column.dataType === 'phone' || column.dataType === 'url') {
          emptyData[column.name] = column.defaultValue || 'New Record';
        } else if (column.dataType === 'number' || column.dataType === 'currency') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'checkbox') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : false;
        } else if (column.dataType === 'rating') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'single_select') {
          emptyData[column.name] = column.defaultValue || '';
        } else if (column.dataType === 'multi_select') {
          emptyData[column.name] = column.defaultValue || [];
        } else if (column.dataType === 'linked_table') {
          emptyData[column.name] = column.defaultValue || null;
        } else {
          emptyData[column.name] = 'New Record';
        }
      } else {
        // Non-required fields
        if (column.dataType === 'checkbox') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : false;
        } else if (column.dataType === 'number' || column.dataType === 'currency') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'rating') {
          emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
        } else if (column.dataType === 'single_select') {
          emptyData[column.name] = column.defaultValue || '';
        } else if (column.dataType === 'multi_select') {
          emptyData[column.name] = column.defaultValue || [];
        } else if (column.dataType === 'linked_table') {
          emptyData[column.name] = column.defaultValue || null;
        } else {
          emptyData[column.name] = '';
        }
      }
    });
    
    // Set group values
    groupRules.forEach(rule => {
      if (groupValues[rule.field]) {
        emptyData[rule.field] = groupValues[rule.field];
      }
    });
    
    console.log('Adding new record to group with data:', emptyData);
    console.log('Table ID:', tableId);
    
    const recordData = {
      data: emptyData
    };
    
    addRecordMutation.mutate(recordData);
  };

  // Handle Add Column - similar to TableDetail
  const handleAddColumn = (e) => {
    e.preventDefault();
    
    // Auto-generate name if empty
    let finalName = newColumn.name.trim();
    if (!finalName) {
      switch (newColumn.dataType) {
        case 'text':
          finalName = 'Text';
          break;
        case 'number':
          finalName = 'Number';
          break;
        case 'date':
          finalName = 'Date';
          break;
        case 'year':
          finalName = 'Year';
          break;
        case 'checkbox':
          finalName = 'Checkbox';
          break;
        case 'single_select':
          finalName = 'Single Select';
          break;
        case 'multi_select':
          finalName = 'Multi Select';
          break;
        case 'formula':
          finalName = 'Formula';
          break;
        case 'currency':
          finalName = 'Currency';
          break;
        case 'percent':
          finalName = 'Percent';
          break;
        case 'phone':
          finalName = 'Phone';
          break;
        case 'time':
          finalName = 'Time';
          break;
        case 'rating':
          finalName = 'Rating';
          break;
        case 'linked_table':
          // Use the connected table name if available
          if (newColumn.linkedTableConfig?.linkedTableName) {
            finalName = newColumn.linkedTableConfig.linkedTableName;
          } else {
            finalName = 'Linked Table';
          }
          break;
        case 'lookup':
          // Use the lookup column name if available
          if (newColumn.lookupConfig?.lookupColumnName && newColumn.lookupConfig?.linkedTableName) {
            finalName = `${newColumn.lookupConfig.lookupColumnName} (from ${newColumn.lookupConfig.linkedTableName})`;
          } else if (newColumn.lookupConfig?.linkedTableName) {
            finalName = `Lookup (${newColumn.lookupConfig.linkedTableName})`;
          } else {
            finalName = 'Lookup';
          }
          break;
        default:
          finalName = 'New Column';
      }
      
      // Check if column name already exists and add number suffix
      let counter = 1;
      let originalName = finalName;
      while (columns.some(col => col.name === finalName)) {
        finalName = `${originalName} ${counter}`;
        counter++;
      }
    }
    
    // Prepare column data based on data type
    const columnData = {
      name: finalName,
      dataType: newColumn.dataType,
      tableId: tableId,
      databaseId: databaseId,
      isRequired: newColumn.isRequired || false,
      isUnique: newColumn.isUnique || false,
      defaultValue: newColumn.defaultValue
    };
    
    // Add checkbox configuration if data type is checkbox
    if (newColumn.dataType === 'checkbox') {
      columnData.checkboxConfig = newColumn.checkboxConfig;
    }
    
    // Add single select configuration if data type is single_select
    if (newColumn.dataType === 'single_select') {
      columnData.singleSelectConfig = newColumn.singleSelectConfig;
    }
    
    // Add multi select configuration if data type is multi_select
    if (newColumn.dataType === 'multi_select') {
      columnData.multiSelectConfig = newColumn.multiSelectConfig;
    }
    
    // Add date configuration if data type is date
    if (newColumn.dataType === 'date') {
      columnData.dateConfig = newColumn.dateConfig;
    }

    // Add formula configuration if data type is formula
    if (newColumn.dataType === 'formula') {
      columnData.formulaConfig = newColumn.formulaConfig;
    }
    
    // Add currency configuration if data type is currency
    if (newColumn.dataType === 'currency') {
      columnData.currencyConfig = newColumn.currencyConfig;
      // Add default value for currency
      columnData.defaultValue = newColumn.defaultValue !== null && newColumn.defaultValue !== undefined ? newColumn.defaultValue : 0;
    }
    
    // Add percent configuration if data type is percent
    if (newColumn.dataType === 'percent') {
      columnData.percentConfig = newColumn.percentConfig;
    }
    
    // Add URL configuration if data type is url
    if (newColumn.dataType === 'url') {
      columnData.urlConfig = newColumn.urlConfig;
    }
    
    // Phone data type doesn't need special config
    if (newColumn.dataType === 'phone') {
      // Phone doesn't need special config
    }
    
    // Time data type
    if (newColumn.dataType === 'time') {
      columnData.timeConfig = newColumn.timeConfig;
    }
    
    // Rating data type
    if (newColumn.dataType === 'rating') {
      columnData.ratingConfig = newColumn.ratingConfig;
    }
    
    // Add linked table configuration if data type is linked_table
    if (newColumn.dataType === 'linked_table') {
      columnData.linkedTableConfig = newColumn.linkedTableConfig;
    }
    
    // Add lookup configuration if data type is lookup
    if (newColumn.dataType === 'lookup') {
      columnData.lookupConfig = newColumn.lookupConfig;
    }
    
    console.log('Adding new column with data:', columnData);
    
    // If adding column at specific position, use different API
    if (addColumnPosition) {
      const { position, referenceColumnId } = addColumnPosition;
      const url = `/api/database/tables/${tableId}/columns/${position}/${referenceColumnId}`;
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(columnData)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to create column at position');
        }
        return response.json();
      })
      .then(data => {
        // Invalidate and refetch table structure
        queryClient.invalidateQueries(['tableStructure', tableId]);
        setShowAddColumn(false);
        setAddColumnPosition(null);
        setNewColumn({ 
          name: '', 
          dataType: 'text',
          isRequired: false,
          isUnique: false,
          defaultValue: null,
          filterRules: []
        });
      })
      .catch(error => {
        console.error('Error creating column at position:', error);
        // Fallback to regular add column
        addColumnMutation.mutate(columnData);
      });
    } else {
      // Use the addColumnMutation from useTableData hook
      addColumnMutation.mutate(columnData);
    }
  };

  // Handle Add Column Left
  const handleAddColumnLeft = (referenceColumn) => {
    setShowAddColumn(true);
    setAddColumnPosition({ position: 'left', referenceColumnId: referenceColumn._id });
  };

  // Handle Add Column Right
  const handleAddColumnRight = (referenceColumn) => {
    setShowAddColumn(true);
    setAddColumnPosition({ position: 'right', referenceColumnId: referenceColumn._id });
  };

  // Column reordering handlers
  const handleColumnDragStart = (e, dragIndex) => {
    // Check if dataTransfer is available
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', dragIndex);
    }
    
    setIsDragging(true);
    setDraggedColumn(dragIndex);
  };

  const handleColumnDragOver = (e, hoverIndex) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    setDragOverColumn(hoverIndex);
  };

  const handleColumnDrop = async (e, hoverIndex) => {
    e.preventDefault();
    
    const dragIndex = e.dataTransfer ? parseInt(e.dataTransfer.getData('text/html')) : null;
    
    if (dragIndex === null || isNaN(dragIndex)) {
      setIsDragging(false);
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    
    if (dragIndex === hoverIndex) {
      setIsDragging(false);
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }
    
    setIsDragging(false);
    setDraggedColumn(null);
    setDragOverColumn(null);
    
    // Get original columns (not filtered by visibility)
    const originalColumns = columns;
    
    // Reorder original columns
    const reorderedColumns = reorderColumns(originalColumns, dragIndex, hoverIndex);
    const newColumnOrder = generateColumnOrders(reorderedColumns);
    
    setColumnOrder(newColumnOrder);
    saveColumnOrder(tableId, newColumnOrder);

    // Update backend
    try {
      const response = await fetch(`/api/database/tables/${tableId}/columns/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ columnOrders: newColumnOrder })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder columns');
      }

      // Invalidate and refetch table structure to get updated order
      queryClient.invalidateQueries(['tableStructure', tableId]);
    } catch (error) {
      console.error('Error reordering columns:', error);
      // Revert local changes on error
      const originalOrder = loadColumnOrder(tableId);
      setColumnOrder(originalOrder);
    }
  };

  const handleColumnDragEnd = (e) => {
    setIsDragging(false);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const tableStructure = tableStructureResponse?.data;
  const table = tableStructure?.table;
  const columns = tableStructure?.columns || [];
  const allRecords = recordsResponse?.data || [];

  // Handle clicking outside multi-select dropdown and cell selection
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (editingCell) {
        const column = columns.find(col => col.name === editingCell.columnName);
        if (column && column.dataType === 'multi_select') {
          // Check if click is inside multi-select dropdown
          const multiSelectDropdown = event.target.closest('[data-multiselect-dropdown]');
          const multiSelectContainer = event.target.closest('[data-multiselect-container]');
          
          if (!multiSelectDropdown && !multiSelectContainer) {
            // Click outside multi-select, close it
            setEditingCell(null);
            setCellValue('');
          }
        }
      }
      
      // Handle cell selection - clear selected cell if clicking outside table
      if (selectedCell) {
        const tableContainer = event.target.closest('[data-table-container]');
        if (!tableContainer) {
          setSelectedCell(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCell, selectedCell, columns]);

  // Apply filters to records
  const records = useMemo(() => {
    return applyFilterRules(allRecords, filterRules, isFilterActive);
  }, [allRecords, filterRules, isFilterActive]);

  // Get visible columns based on visibility settings
  const visibleColumns = useMemo(() => {
    return getVisibleColumns(columns, fieldVisibility, showSystemFields);
  }, [columns, fieldVisibility, showSystemFields]);

  // Get all columns including system fields
  const allColumnsWithSystem = useMemo(() => {
    return getAllColumnsWithSystem(columns, showSystemFields);
  }, [columns, showSystemFields]);

  // Group data by rules
  const groupedData = useMemo(() => {
    return groupRecords(records, groupRules);
  }, [records, groupRules]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <Alert
          message="Error loading table"
          description={error.message}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={() => navigate(`/database/${databaseId}/tables`)}>
              Back to Tables
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ margin: '0', padding: '0' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            {/* Description hidden for grid view */}
          </div>
        </div>
      </div>

      {/* Table Header Component */}
      <TableHeader
        // Pass all necessary props
        table={table}
        columns={columns}
        fieldVisibility={fieldVisibility}
        showFieldsDropdown={showFieldsDropdown}
        fieldsDropdownPosition={fieldsDropdownPosition}
        showFilterDropdown={showFilterDropdown}
        filterDropdownPosition={filterDropdownPosition}
        showGroupDropdown={showGroupDropdown}
        groupDropdownPosition={groupDropdownPosition}
        showSortDropdown={showSortDropdown}
        sortDropdownPosition={sortDropdownPosition}
        filterRules={filterRules}
        groupRules={groupRules}
        sortRules={sortRules}
        isFilterActive={isFilterActive}
        // Event handlers
        handleFieldsButtonClick={handleFieldsButtonClick}
        handleFilterButtonClick={handleFilterButtonClick}
        handleGroupButtonClick={handleGroupButtonClick}
        handleSortButtonClick={handleSortButtonClick}
        setShowAddColumn={setShowAddColumn}
        handleExpandAllGroups={handleExpandAllGroups}
        handleCollapseAllGroups={handleCollapseAllGroups}
        // Utility functions
        getFieldVisibilityButtonStyle={getFieldVisibilityButtonStyle}
        getFilterButtonStyle={getFilterButtonStyle}
        getGroupButtonStyle={getGroupButtonStyle}
        getSortButtonStyle={getSortButtonStyle}
        getSortRulesCount={getSortRulesCount}
        getSortBadgeStyle={getSortBadgeStyle}
        getOperatorOptions={getOperatorOptions}
        addFilterRule={handleAddFilterRule}
        removeFilterRule={handleRemoveFilterRule}
        updateFilterRule={handleUpdateFilterRule}
        toggleFilterActive={handleToggleFilterActive}
        addGroupRule={handleAddGroupRule}
        removeGroupRule={handleRemoveGroupRule}
        updateGroupRule={updateGroupRule}
        addSortRule={addSortRule}
        removeSortRule={handleRemoveSortRule}
        updateSortRule={handleUpdateSortRule}
        clearAllSorts={clearAllSorts}
        handleSortFieldSelect={onSortFieldSelect}
        toggleSortDropdown={toggleSortDropdown}
        isSortActive={isSortActive}
        toggleFieldVisibility={toggleFieldVisibility}
        toggleSystemFields={toggleSystemFields}
        getAllColumnsWithSystem={getAllColumnsWithSystem}
        getVisibleColumns={getVisibleColumns}
        allColumnsWithSystem={allColumnsWithSystem}
        fieldSearch={fieldSearch}
        setFieldSearch={setFieldSearch}
        showSystemFields={showSystemFields}
        handleToggleFieldVisibility={handleToggleFieldVisibility}
        handleToggleSystemFields={handleToggleSystemFields}
        groupFieldSearch={groupFieldSearch}
        setGroupFieldSearch={setGroupFieldSearch}
        currentGroupField={currentGroupField}
        setCurrentGroupField={setCurrentGroupField}
        handleGroupFieldSelect={handleGroupFieldSelect}
        handleRemoveGroupRule={handleRemoveGroupRule}
        sortFieldSearch={sortFieldSearch}
        setSortFieldSearch={setSortFieldSearch}
        currentSortField={currentSortField}
        setCurrentSortField={setCurrentSortField}
        handleUpdateFilterRule={handleUpdateFilterRule}
        handleRemoveFilterRule={handleRemoveFilterRule}
        handleToggleFilterActive={handleToggleFilterActive}
        onSortFieldSelect={onSortFieldSelect}
        handleUpdateSortRule={handleUpdateSortRule}
        handleRemoveSortRule={handleRemoveSortRule}
        // Filter field search props
        filterFieldSearch={filterFieldSearch}
        setFilterFieldSearch={setFilterFieldSearch}
        currentFilterField={currentFilterField}
        setCurrentFilterField={setCurrentFilterField}
        // Row height props
        tableId={viewId}
        rowHeightSettings={rowHeightSettings}
        onRowHeightChange={handleRowHeightChange}
      />
      
      {/* Table Body Component */}
      <TableBody
        // Pass all necessary props
        records={records}
        visibleColumns={visibleColumns}
        columnWidths={columnWidths}
        editingCell={editingCell}
        selectedCell={selectedCell}
        cellValue={cellValue}
        groupedData={groupedData}
        expandedGroups={expandedGroups}
        selectedRowKeys={selectedRowKeys}
        // Event handlers
        handleCellClick={handleCellClick}
        handleCellSave={handleCellSave}
        handleCellCancel={handleCellCancel}
        setCellValue={setCellValue}
        handleResizeStart={handleResizeStart}
        handleToggleGroupExpansion={handleToggleGroupExpansion}
        handleAddRow={handleAddRow}
        handleAddRowToGroup={handleAddRowToGroup}
        handleContextMenu={handleContextMenu}
        handleSelectRow={handleSelectRow}
        handleSelectAll={handleSelectAll}
        selectAll={selectAll}
        setShowAddColumn={setShowAddColumn}
        handleEditColumn={() => {}}
        handleDeleteColumn={(columnId, columnName) => {
          deleteColumnMutation.mutate(columnId);
        }}
        handleAddColumnLeft={handleAddColumnLeft}
        handleAddColumnRight={handleAddColumnRight}
        updateRecordMutation={updateRecordMutation}
        updateColumnMutation={updateColumnMutation}
        isResizing={isResizing}
        resizingColumn={resizingColumn}
        // Column reordering props
        isDragging={isDragging}
        draggedColumn={draggedColumn}
        dragOverColumn={dragOverColumn}
        handleColumnDragStart={handleColumnDragStart}
        handleColumnDragOver={handleColumnDragOver}
        handleColumnDrop={handleColumnDrop}
        handleColumnDragEnd={handleColumnDragEnd}
        // Utility functions
        getColumnWidthString={getColumnWidthString}
        getColumnHeaderStyle={getColumnHeaderStyle}
        getColumnDataStyle={getColumnDataStyle}
        getResizeHandleStyle={getResizeHandleStyle}
        getCompactHeaderStyle={getCompactHeaderStyle}
        getNormalHeaderStyle={getNormalHeaderStyle}
        isColumnCompact={isColumnCompact}
        formatCellValueForDisplay={formatCellValueForDisplay}
        formatCellValueForInput={formatCellValueForInput}
        getCellInputType={getCellInputType}
        getCellInputPlaceholder={getCellInputPlaceholder}
        isCellEditable={isCellEditable}
        getCellEditingStyle={getCellEditingStyle}
        getCellDisplayComponentType={getCellDisplayComponentType}
        getDataTypeIcon={getDataTypeIcon}
        getDataTypeColor={getDataTypeColor}
        getDataTypeTag={getDataTypeTag}
        formatDateForDisplay={formatDateForDisplay}
        formatDateForInput={formatDateForInput}
        formatDateTime={formatDateTime}
        isGroupExpanded={isGroupExpanded}
        getGroupDisplayName={getGroupDisplayName}
        calculateGroupStats={calculateGroupStats}
        sortGroups={sortGroups}
        // Row height props
        tableId={viewId}
        rowHeightSettings={rowHeightSettings}
      />
      
      {/* Context Menu Component */}
      <ContextMenu
        contextMenu={contextMenu}
        handleContextMenuClose={handleContextMenuClose}
        handleContextMenuDelete={handleContextMenuDelete}
      />

      {/* Add Column Modal */}
      <AddColumnModal
        visible={showAddColumn}
        onCancel={() => {
          setShowAddColumn(false);
          setAddColumnPosition(null);
        }}
        onSubmit={handleAddColumn}
        newColumn={newColumn}
        setNewColumn={setNewColumn}
        columns={columns}
        loading={addColumnMutation.isPending}
        currentTableId={tableId}
        currentDatabaseId={databaseId}
        addColumnPosition={addColumnPosition}
      />

      {/* Edit Column Modal */}
      <EditColumnModal
        visible={showEditColumn}
        onCancel={() => {
          setShowEditColumn(false);
          setEditingColumn(null);
        }}
        onSubmit={() => {}}
        editingColumn={editingColumn}
        setEditingColumn={setEditingColumn}
        columns={columns}
        loading={updateColumnMutation.isPending}
        currentTableId={tableId}
        currentDatabaseId={databaseId}
      />
    </div>
  );
};

export default GridView;
