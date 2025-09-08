import React, { useState, useMemo } from 'react';
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
  getDataTypeTag,
  getTypeLetter
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
  getColumnWidthString
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

const TableDetail = () => {
  const { databaseId, tableId } = useParams();
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
    defaultValue: null
  });
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
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

  // Group management state
  const [groupFieldSearch, setGroupFieldSearch] = useState('');
  const [currentGroupField, setCurrentGroupField] = useState('');

  // Sort management state
  const [sortFieldSearch, setSortFieldSearch] = useState('');
  const [currentSortField, setCurrentSortField] = useState('');

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

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    return initializeColumnWidths(tableId);
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);


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




  const tableStructure = tableStructureResponse?.data;
  const table = tableStructure?.table;
  const columns = tableStructure?.columns || [];
  const allRecords = recordsResponse?.data || [];

  // Handle clicking outside multi-select dropdown
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCell, columns]);

  // Apply filters to records
  const records = useMemo(() => {
    return applyFilterRules(allRecords, filterRules, isFilterActive);
  }, [allRecords, filterRules, isFilterActive]);

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
        default:
          finalName = 'New Column';
      }
    }
    
    // Prepare column data based on data type
    const columnData = {
      name: finalName,
      dataType: newColumn.dataType
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
    
    // Add URL configuration if data type is url
    if (newColumn.dataType === 'url') {
      columnData.urlConfig = newColumn.urlConfig;
      console.log('Frontend: Sending URL config:', {
        newColumn: newColumn,
        urlConfig: newColumn.urlConfig,
        columnData: columnData
      });
    }
    
    console.log('Frontend: Final columnData:', columnData);
    addColumnMutation.mutate(columnData);
  };

  const handleAddRow = () => {
    if (!visibleColumns || visibleColumns.length === 0) {
      // toast.error('No columns available. Please add a column first.');
      return;
    }
    
    const emptyData = {};
    visibleColumns.forEach(column => {
      if (column.dataType === 'checkbox') {
        // Use default value from checkbox configuration
        const config = column.checkboxConfig || { defaultValue: false };
        emptyData[column.name] = config.defaultValue;
      } else if (column.dataType === 'single_select') {
        // Use default value from single select configuration
        const config = column.singleSelectConfig || { defaultValue: '' };
        emptyData[column.name] = config.defaultValue;
      } else if (column.dataType === 'date') {
        // For date type, leave empty for now (user will select date)
        emptyData[column.name] = '';
      } else if (column.dataType === 'currency') {
        // Use default value for currency type
        emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
      } else {
      emptyData[column.name] = '';
      }
    });
    
    // Add timestamp to ensure new records appear at the bottom
    const recordData = {
      data: emptyData,
      createdAt: new Date().toISOString(),
      order: records.length + 1
    };
    
    addRecordMutation.mutate(recordData);
  };

  const handleAddRowToGroup = (groupValues, groupRules) => {
    if (!visibleColumns || visibleColumns.length === 0) {
      // toast.error('No columns available. Please add a column first.');
      return;
    }
    
    const emptyData = {};
    visibleColumns.forEach(column => {
      if (column.dataType === 'checkbox') {
        // Use default value from checkbox configuration
        const config = column.checkboxConfig || { defaultValue: false };
        emptyData[column.name] = config.defaultValue;
      } else if (column.dataType === 'single_select') {
        // Use default value from single select configuration
        const config = column.singleSelectConfig || { defaultValue: '' };
        emptyData[column.name] = config.defaultValue;
      } else if (column.dataType === 'multi_select') {
        // Use default values from multi select configuration
        const config = column.multiSelectConfig || { defaultValue: [] };
        
        
        emptyData[column.name] = config.defaultValue;
        
      } else if (column.dataType === 'date') {
        // For date type, leave empty for now (user will select date)
        emptyData[column.name] = '';
      } else if (column.dataType === 'currency') {
        // Use default value for currency type
        emptyData[column.name] = column.defaultValue !== null && column.defaultValue !== undefined ? column.defaultValue : 0;
      } else {
      emptyData[column.name] = '';
      }
    });

    // Pre-fill the group fields with the group values
    groupRules.forEach((rule, index) => {
      emptyData[rule.field] = groupValues[index] || '';
    });
    
    // Add timestamp to ensure new records appear at the bottom
    const recordData = {
      data: emptyData,
      createdAt: new Date().toISOString(),
      order: records.length + 1
    };
    
    addRecordMutation.mutate(recordData);
  };

  // Update context when records change
  React.useEffect(() => {
    if (records && records.length > 0) {
      setAllRecords(records);
    }
  }, [records, setAllRecords]);

  const handleDeleteRecord = (recordId) => {
    deleteRecordMutation.mutate(recordId);
  };

  const handleEditColumn = (column) => {
    setEditingColumn({
      _id: column._id,
      name: column.name,
      dataType: column.dataType,
      defaultValue: column.defaultValue !== undefined ? column.defaultValue : (column.dataType === 'currency' ? 0 : null),
      checkboxConfig: column.checkboxConfig || {
        icon: 'check-circle',
        color: '#52c41a',
        defaultValue: false
      },
      singleSelectConfig: column.singleSelectConfig || {
        options: [],
        defaultValue: ''
      },
      multiSelectConfig: column.multiSelectConfig || {
        options: [],
        defaultValue: []
      },
      dateConfig: column.dateConfig || {
        format: 'DD/MM/YYYY'
      },
      formulaConfig: column.formulaConfig || {
        formula: '',
        resultType: 'number',
        dependencies: [],
        description: ''
      },
      currencyConfig: column.currencyConfig || {
        currency: 'USD',
        symbol: '$',
        position: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.'
      },
      urlConfig: column.urlConfig || {
        protocol: 'https'
      }
    });
    setShowEditColumn(true);
  };

  const handleEditColumnSubmit = (e) => {
    e.preventDefault();
    if (!editingColumn || !editingColumn.name.trim()) {
      // toast.error('Column name is required');
      return;
    }
    
    // Prepare column data based on data type
    const columnData = {
        name: editingColumn.name,
        dataType: editingColumn.dataType,
        // Include defaultValue if specified
        ...(editingColumn.defaultValue !== null && editingColumn.defaultValue !== undefined ? { defaultValue: editingColumn.defaultValue } : {})
    };
    
    // Add checkbox configuration if data type is checkbox
    if (editingColumn.dataType === 'checkbox') {
      columnData.checkboxConfig = editingColumn.checkboxConfig;
    }
    
    // Add single select configuration if data type is single_select
    if (editingColumn.dataType === 'single_select') {
      columnData.singleSelectConfig = editingColumn.singleSelectConfig;
    }
    
    // Add multi select configuration if data type is multi_select
    if (editingColumn.dataType === 'multi_select') {
      columnData.multiSelectConfig = editingColumn.multiSelectConfig;
    }
    
    // Add date configuration if data type is date
    if (editingColumn.dataType === 'date') {
      columnData.dateConfig = editingColumn.dateConfig;
    }

    // Add formula configuration if data type is formula
    if (editingColumn.dataType === 'formula') {
      columnData.formulaConfig = editingColumn.formulaConfig;
    }
    
    // Add currency configuration if data type is currency
    if (editingColumn.dataType === 'currency') {
      columnData.currencyConfig = editingColumn.currencyConfig;
      // Add default value for currency
      columnData.defaultValue = editingColumn.defaultValue !== null && editingColumn.defaultValue !== undefined ? editingColumn.defaultValue : 0;
    }
    
    // Add URL configuration if data type is url
    if (editingColumn.dataType === 'url') {
      columnData.urlConfig = editingColumn.urlConfig;
    }
    
    updateColumnMutation.mutate({
      columnId: editingColumn._id,
      columnData
    });
  };

  const handleDeleteColumn = (columnId, columnName) => {
    deleteColumnMutation.mutate(columnId);
  };

  const handleCellClick = (recordId, columnName, currentValue) => {
    const column = columns.find(col => col.name === columnName);
    const { editingCell: newEditingCell, cellValue: newCellValue } = initializeCellEditing(recordId, columnName, currentValue, column);
    
    setEditingCell(newEditingCell);
    setCellValue(newCellValue);
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
      handleDeleteRecord(contextMenu.recordId);
    }
    handleContextMenuClose();
  };

  const handleSortButtonClick = (e) => {
    const position = getSortDropdownPosition(e);
    setSortDropdownPosition(position);
    setShowSortDropdown(toggleSortDropdown(showSortDropdown));
  };

  // Grouping handlers
  const handleGroupButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGroupDropdownPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setShowGroupDropdown(!showGroupDropdown);
  };

  const handleRemoveGroupRule = (index) => {
    const newRules = removeGroupRule(groupRules, index);
    setGroupRules(newRules);
    // Clear expanded groups when removing group rules
    setExpandedGroups(new Set());
    
    // Save to backend immediately
    saveGroupPreferenceMutation.mutate({
      groupRules: newRules,
      expandedGroups: []
    });
  };

  const handleGroupFieldSelect = (fieldName) => {
    const newRules = addGroupRule(groupRules, fieldName);
    setGroupRules(newRules);
    setCurrentGroupField('');
    setGroupFieldSearch('');
    
    // Save to backend immediately
    saveGroupPreferenceMutation.mutate({
      groupRules: newRules,
      expandedGroups: Array.from(expandedGroups)
    });
  };

  // Filter handlers
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
  const handleClearAllGroups = () => {
    setGroupRules(clearAllGroupRules());
    setExpandedGroups(new Set());
    
    // Save to backend immediately
    saveGroupPreferenceMutation.mutate({
      groupRules: [],
      expandedGroups: []
    });
  };

  const handleToggleGroupExpansion = (groupKey) => {
    const newExpanded = toggleGroupExpansion(expandedGroups, groupKey);
    setExpandedGroups(newExpanded);
  };

  const handleExpandAllGroups = () => {
    const allGroupKeys = expandAllGroups(groupedData.groups);
    setExpandedGroups(allGroupKeys);
  };

  const handleCollapseAllGroups = () => {
    setExpandedGroups(collapseAllGroups());
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

  // Fields handlers
  const handleFieldsButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFieldsDropdownPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setShowFieldsDropdown(!showFieldsDropdown);
  };

  // Save field visibility to backend only
  const handleSaveFieldVisibility = (newVisibility) => {
    setFieldVisibility(newVisibility);
    
    // Save to backend
    saveFieldPreferenceMutation.mutate({
      fieldVisibility: newVisibility,
      showSystemFields
    });
  };

  // Toggle field visibility
  const handleToggleFieldVisibility = (columnId) => {
    const newVisibility = toggleFieldVisibility(fieldVisibility, columnId);
    handleSaveFieldVisibility(newVisibility);
  };

  // Toggle system fields visibility
  const handleToggleSystemFields = () => {
    const { showSystemFields: newShowSystemFields, fieldVisibility: newFieldVisibility } = toggleSystemFields(showSystemFields, fieldVisibility);
    
    setShowSystemFields(newShowSystemFields);
      setFieldVisibility(newFieldVisibility);
      
      // Save to backend
      saveFieldPreferenceMutation.mutate({
        fieldVisibility: newFieldVisibility,
        showSystemFields: newShowSystemFields
      });
  };

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
                <Text type="secondary">
                  {table?.description}
                </Text>
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
            addGroupRule={addGroupRule}
            removeGroupRule={removeGroupRule}
            updateGroupRule={updateGroupRule}
            addSortRule={addSortRule}
            removeSortRule={removeSortRule}
            updateSortRule={updateSortRule}
            clearAllSorts={clearAllSorts}
            handleSortFieldSelect={handleSortFieldSelect}
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
          />
          {/* Table Body Component */}
          <TableBody
            // Pass all necessary props
            records={records}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            editingCell={editingCell}
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
            handleEditColumn={handleEditColumn}
            handleDeleteColumn={handleDeleteColumn}
            updateRecordMutation={updateRecordMutation}
            isResizing={isResizing}
            resizingColumn={resizingColumn}
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
            getTypeLetter={getTypeLetter}
            formatDateForDisplay={formatDateForDisplay}
            formatDateForInput={formatDateForInput}
            formatDateTime={formatDateTime}
            isGroupExpanded={isGroupExpanded}
            getGroupDisplayName={getGroupDisplayName}
            calculateGroupStats={calculateGroupStats}
            sortGroups={sortGroups}
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
            onCancel={() => setShowAddColumn(false)}
            onSubmit={handleAddColumn}
            newColumn={newColumn}
            setNewColumn={setNewColumn}
            columns={columns}
            loading={addColumnMutation.isPending}
          />

          {/* Edit Column Modal */}
          <EditColumnModal
            visible={showEditColumn}
            onCancel={() => {
              setShowEditColumn(false);
              setEditingColumn(null);
            }}
            onSubmit={handleEditColumnSubmit}
            editingColumn={editingColumn}
            setEditingColumn={setEditingColumn}
            columns={columns}
            loading={updateColumnMutation.isPending}
          />
        </div>
      );
    };

    export default TableDetail;
