import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateForDisplay, formatDateForInput } from '../../utils/dateFormatter.js';
import AddColumnModal from './Components/AddColumnModal';
import EditColumnModal from './Components/EditColumnModal';
import TableHeader from './Components/TableHeader';
import TableBody from './Components/TableBody';
import ContextMenu from './Components/ContextMenu';
import RowColumnCellPermissionModal from '../../components/Table/RowColumnCellPermissionModal';
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
  loadColumnOrder,
  applyColumnOrder
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
  filterColumnsByPermission,
  filterRecordsByPermission,
  getUserDatabaseRole,
  canEditCell
} from './Utils/permissionUtils.jsx';
import {
  loadRowHeightSettings,
  saveRowHeightSettings,
  getRowHeight,
  getRowHeightStyle,
  getRowContentStyle
} from './Utils/rowHeightUtils.jsx';
import RowHeightDropdown from './Components/RowHeightDropdown';
import { useParams, useNavigate } from 'react-router-dom';
import './Components/CRMTable.css';
import { useTemplateTableData } from './Hooks/useTemplateTableData';
import { useTableContext } from '../../contexts/TableContext';
import {
  Button,
  Typography,
  Spin,
  Alert
} from 'antd';
const { Text } = Typography;

const TableDetail = () => {
  const { templateId, tableIndex } = useParams();
  const tableId = `${templateId}_${tableIndex}`; // Create unique tableId for template
  
  // CRITICAL DEBUG LOG - This should always show
  console.log('🚨🚨🚨 TABLEDETAIL COMPONENT LOADED 🚨🚨🚨');
  console.log('🚨🚨🚨 TEMPLATEID:', templateId, 'TABLEINDEX:', tableIndex, 'TABLEID:', tableId);
  
  // Check if templateId is undefined
  if (!templateId || templateId === 'undefined') {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Template Not Found"
          description="Template ID is missing or invalid. Please check the URL and try again."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/templates')}>
              Back to Templates
            </Button>
          }
        />
      </div>
    );
  }
  
  // Safe console.log helper
  // const safeLog = (...args) => {
  //   if (typeof console !== 'undefined' && console.log) {
  //     console.log(...args);
  //   }
  // };
  
  // Debug logging
  // safeLog('🔍 TableDetail Debug:', {
  //   templateId,
  //   tableIndex,
  //   tableId,
  //   fromUseParams: { templateId, tableIndex }
  // });

  // Reset editingColumn when tableId changes
  useEffect(() => {
    if (editingColumn) {
      // safeLog('🔄 Table changed, resetting editingColumn state');
      setEditingColumn(null);
      setShowEditColumn(false);
    }
  }, [tableId]);

  // Reset sort, filter, and group rules when tableId changes
  useEffect(() => {
    setSortRules([]);
    setShowSortDropdown(false);
    setSortDropdownPosition({ x: 0, y: 0 });
    setSortFieldSearch('');
    setCurrentSortField('');
    setFilterRules([]);
    setGroupRules([]);
    setExpandedGroups(new Set());
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
  const [showColumnPermissionModal, setShowColumnPermissionModal] = useState(false);
  const [selectedColumnForPermission, setSelectedColumnForPermission] = useState(null);
  
  // Cell permission modal
  const [showCellPermissionModal, setShowCellPermissionModal] = useState(false);
  const [selectedCellForPermission, setSelectedCellForPermission] = useState(null);
  
  // const [showDebugPanel, setShowDebugPanel] = useState(false);
  // const [debugLogs, setDebugLogs] = useState([]);
  
  const queryClient = useQueryClient();
  
  // Debug function with ref to prevent infinite loops
  // const debugLogsRef = useRef([]);
  // const addDebugLog = useCallback((message) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const logEntry = `[${timestamp}] ${message}`;
  //   debugLogsRef.current = [...debugLogsRef.current.slice(-19), logEntry]; // Keep last 20 logs
  //   // Only update state if debug panel is visible to prevent unnecessary re-renders
  //   if (showDebugPanel) {
  //     setDebugLogs(debugLogsRef.current);
  //   }
  //   // console.log('🚨 DEBUG:', message);
  // }, [showDebugPanel]);

  // Debug state changes
  useEffect(() => {
    // console.log('🚨 showColumnPermissionModal changed:', showColumnPermissionModal);
  }, [showColumnPermissionModal]);
  
  // Sync debug logs when debug panel is opened
  // useEffect(() => {
  //   if (showDebugPanel) {
  //     setDebugLogs(debugLogsRef.current);
  //   }
  // }, [showDebugPanel]);
  
  // Function to manually add debug log (for testing)
  // const addDebugLogManually = (message) => {
  //   const timestamp = new Date().toLocaleTimeString();
  //   const logEntry = `[${timestamp}] ${message}`;
  //   debugLogsRef.current = [...debugLogsRef.current.slice(-19), logEntry];
  //   if (showDebugPanel) {
  //     setDebugLogs(debugLogsRef.current);
  //   }
  //   // console.log('🚨 DEBUG:', message);
  // };
  
  useEffect(() => {
    // console.log('🚨 selectedColumnForPermission changed:', selectedColumnForPermission);
  }, [selectedColumnForPermission]);
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
    columnPermissionsResponse,
    recordPermissionsResponse,
    cellPermissionsResponse,
    databaseMembersResponse,
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
    // Permission checks
    canViewTable,
    canEditStructure,
    canEditData,
    canAddData,
    canAddView,
    canEditView,
    tablePermissionsLoading,
  } = useTemplateTableData(templateId, tableIndex, tableContext, modalCallbacks);

  // Skip group preferences for templates - always use empty groups
  React.useEffect(() => {
    setGroupRules([]);
    setExpandedGroups(new Set());
  }, []);

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
    if (tableId) {
      const settings = loadRowHeightSettings(tableId);
      setRowHeightSettings(prev => ({
        ...prev,
        [tableId]: settings
      }));
    }
  }, [tableId]);

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

    // Get original columns without applied order
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);
    const columnPermissions = columnPermissionsResponse?.data || [];
    
    const originalColumns = getVisibleColumns(
      columns, 
      fieldVisibility, 
      showSystemFields, 
      columnPermissions, 
      currentUser, 
      userRole
    );
    
    // Reorder original columns
    const reorderedColumns = reorderColumns(originalColumns, dragIndex, hoverIndex);
    const newColumnOrder = generateColumnOrders(reorderedColumns);
    
    setColumnOrder(newColumnOrder);
    saveColumnOrder(tableId, newColumnOrder);

    // Update backend
    try {
      const response = await fetch(`/api/templates/${templateId}/tables/${tableIndex}/columns/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          columnOrders: newColumnOrder
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder columns');
      }

      // Invalidate and refetch table structure to get updated order
      queryClient.invalidateQueries(['template', templateId]);
    } catch (error) {
      console.error('Error reordering columns:', error);
      // Revert local changes on error
      const originalOrder = loadColumnOrder(tableId);
      setColumnOrder(originalOrder);
    }

    setIsDragging(false);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleColumnDragEnd = (e) => {
    setIsDragging(false);
    setDraggedColumn(null);
    setDragOverColumn(null);
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

  // Debug log to check columns data
  console.log('🔍 TableDetail columns loaded:', columns);
  columns.forEach((column, index) => {
    console.log(`🔍 Column ${index + 1}:`, {
      name: column.name,
      dataType: column.dataType,
      lookupConfig: column.lookupConfig,
      lookup_config: column.lookup_config
    });
  });

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

  // Apply filters and permissions to records
  const records = useMemo(() => {
    // First apply filters
    const filteredRecords = applyFilterRules(allRecords, filterRules, isFilterActive);
    
    // Then apply permission filtering
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);
    const recordPermissions = recordPermissionsResponse?.data || [];
    
    return filterRecordsByPermission(filteredRecords, recordPermissions, currentUser, userRole);
  }, [allRecords, filterRules, isFilterActive, recordPermissionsResponse, databaseMembersResponse]);

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
      key: finalName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      data_type: newColumn.dataType
    };
    
    // Add checkbox configuration if data type is checkbox
    if (newColumn.dataType === 'checkbox') {
      columnData.config = { ...columnData.config, checkboxConfig: newColumn.checkboxConfig };
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
      // safeLog('Frontend: Sending percent config:', {
      //   newColumn: newColumn,
      //   percentConfig: newColumn.percentConfig,
      //   columnData: columnData
      // });
    }
    
    // Add URL configuration if data type is url
    if (newColumn.dataType === 'url') {
      columnData.urlConfig = newColumn.urlConfig;
      // safeLog('Frontend: Sending URL config:', {
      //   newColumn: newColumn,
      //   urlConfig: newColumn.urlConfig,
      //   columnData: columnData
      // });
    }
    
    // Phone data type doesn't need special config
    if (newColumn.dataType === 'phone') {
      // safeLog('Frontend: Sending phone column:', {
      //   newColumn: newColumn,
      //   columnData: columnData
      // });
    }
    
    // Time data type doesn't need special config
    if (newColumn.dataType === 'time') {
      columnData.timeConfig = newColumn.timeConfig;
      // safeLog('Frontend: Sending time column:', {
      //   newColumn: newColumn,
      //   columnData: columnData
      // });
    }
    
    // Rating data type doesn't need special config
    if (newColumn.dataType === 'rating') {
      columnData.ratingConfig = newColumn.ratingConfig;
      // safeLog('Frontend: Sending rating column:', {
      //   newColumn: newColumn,
      //   columnData: columnData,
      //   ratingConfig: newColumn.ratingConfig
      // });
    }
    
    // Add linked table configuration if data type is linked_table
    if (newColumn.dataType === 'linked_table') {
      columnData.linkedTableConfig = newColumn.linkedTableConfig;
      // safeLog('Frontend: Sending linked_table column:', {
      //   newColumn: newColumn,
      //   columnData: columnData,
      //   linkedTableConfig: newColumn.linkedTableConfig
      // });
    }
    
    // Add lookup configuration if data type is lookup
    if (newColumn.dataType === 'lookup') {
      columnData.lookupConfig = newColumn.lookupConfig;
      // safeLog('Frontend: Sending lookup column:', {
      //   newColumn: newColumn,
      //   columnData: columnData,
      //   lookupConfig: newColumn.lookupConfig
      // });
    }
    
    
    // safeLog('Frontend: Final columnData:', columnData);
    
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
        // Invalidate and refetch table structure and records
        queryClient.invalidateQueries(['template', templateId]);
        queryClient.invalidateQueries(['records', tableId]);
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
      addColumnMutation.mutate(columnData);
    }
  };

  const handleAddRow = () => {
    // In template management, we allow adding records even without columns
    // The record will be empty and can be filled later
    
    // console.log('🔍 Adding new record with columns:', columns.map(c => ({ id: c._id, name: c.name })));
    
    const emptyData = {};
    columns.forEach(column => {
      if (column.dataType === 'checkbox') {
        // Use default value from checkbox configuration
        const config = column.checkboxConfig || { defaultValue: false };
        emptyData[column.name] = config.defaultValue;
      } else if (column.dataType === 'single_select') {
        // For single select, use null so display logic can show default value
        emptyData[column.name] = null;
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
    // In template management, we allow adding records even without columns
    // The record will be empty and can be filled later
    
    const emptyData = {};
    visibleColumns.forEach(column => {
      if (column.dataType === 'checkbox') {
        // Use default value from checkbox configuration
        const config = column.checkboxConfig || { defaultValue: false };
        emptyData[column.name] = config.defaultValue;
      } else if (column.dataType === 'single_select') {
        // For single select, use null so display logic can show default value
        emptyData[column.name] = null;
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

  // Handle row height change
  const handleRowHeightChange = (tableId, settings) => {
    setRowHeightSettings(prev => ({
      ...prev,
      [tableId]: settings
    }));
    saveRowHeightSettings(tableId, settings);
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
    console.log('🔍 handleEditColumn called with column:', column);
    console.log('🔍 Column lookupConfig:', column.lookupConfig);
    console.log('🔍 Column lookup_config:', column.lookup_config);

    setEditingColumn({ 
      _id: column.id,
      name: column.name,
      dataType: column.data_type || column.dataType,
      defaultValue: column.default_value !== undefined ? column.default_value : (column.data_type === 'currency' ? 0 : null),
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
      percentConfig: column.percentConfig || {
        displayFormat: 'percentage',
        displayAsProgress: false,
        defaultValue: 0
      },
      urlConfig: column.urlConfig || {
        protocol: 'https'
      },
      phoneConfig: column.phoneConfig || {
        // Phone doesn't need special config, but we include it for consistency
      },
      timeConfig: column.timeConfig || {
        format: '24'
      },
      ratingConfig: column.ratingConfig || {
        maxStars: 5,
        icon: 'star',
        color: '#faad14',
        defaultValue: 0
      },
      linkedTableConfig: column.linkedTableConfig || {
        linkedTableId: null,
        allowMultiple: false,
        defaultValue: null,
        filterRules: []
      },
      lookupConfig: column.lookupConfig || column.lookup_config || {
        linkedTableId: null,
        lookupColumnId: null,
        linkedTableName: null,
        lookupColumnName: null
      }
    });
    setShowEditColumn(true);
  };

  const handleColumnPermission = (column) => {
    // console.log('🚨 OPENING COLUMN PERMISSION MODAL for:', column.name);
    // console.log('🚨 Column object:', column);
    setSelectedColumnForPermission(column);
    setShowColumnPermissionModal(true);
    // console.log('🚨 Modal should be visible now');
  };

  const handleCellPermission = (recordId, columnId, columnName) => {
    // console.log('🚨 OPENING CELL PERMISSION MODAL for:', { recordId, columnId, columnName });
    setSelectedCellForPermission({ recordId, columnId, columnName });
    setShowCellPermissionModal(true);
    // console.log('🚨 Cell Permission Modal should be visible now');
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
        key: editingColumn.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        data_type: editingColumn.dataType,
        // Include default_value if specified
        ...(editingColumn.defaultValue !== null && editingColumn.defaultValue !== undefined ? { default_value: editingColumn.defaultValue } : {})
    };
    
    // Add checkbox configuration if data type is checkbox
    if (editingColumn.dataType === 'checkbox') {
      columnData.config = { ...columnData.config, checkboxConfig: editingColumn.checkboxConfig };
    }
    
    // Add single select configuration if data type is single_select
    if (editingColumn.dataType === 'single_select') {
      columnData.config = { ...columnData.config, singleSelectConfig: editingColumn.singleSelectConfig };
    }
    
    // Add multi select configuration if data type is multi_select
    if (editingColumn.dataType === 'multi_select') {
      columnData.config = { ...columnData.config, multiSelectConfig: editingColumn.multiSelectConfig };
    }
    
    // Add date configuration if data type is date
    if (editingColumn.dataType === 'date') {
      columnData.config = { ...columnData.config, dateConfig: editingColumn.dateConfig };
    }

    // Add formula configuration if data type is formula
    if (editingColumn.dataType === 'formula') {
      columnData.config = { ...columnData.config, formulaConfig: editingColumn.formulaConfig };
    }
    
    // Add currency configuration if data type is currency
    if (editingColumn.dataType === 'currency') {
      columnData.config = { ...columnData.config, currencyConfig: editingColumn.currencyConfig };
      // Add default value for currency
      columnData.default_value = editingColumn.defaultValue !== null && editingColumn.defaultValue !== undefined ? editingColumn.defaultValue : 0;
    }
    
    // Add percent configuration if data type is percent
    if (editingColumn.dataType === 'percent') {
      columnData.config = { ...columnData.config, percentConfig: editingColumn.percentConfig };
      // safeLog('Frontend: Sending percent config for edit:', {
      //   editingColumn: editingColumn,
      //   percentConfig: editingColumn.percentConfig,
      //   columnData: columnData
      // });
    }
    
    // Add URL configuration if data type is url
    if (editingColumn.dataType === 'url') {
      columnData.config = { ...columnData.config, urlConfig: editingColumn.urlConfig };
    }
    
    // Phone data type doesn't need special config
    if (editingColumn.dataType === 'phone') {
      // safeLog('Frontend: Editing phone column:', {
      //   editingColumn: editingColumn,
      //   columnData: columnData
      // });
    }
    
    // Time data type doesn't need special config
    if (editingColumn.dataType === 'time') {
      columnData.timeConfig = editingColumn.timeConfig;
      // safeLog('Frontend: Editing time column:', {
      //   editingColumn: editingColumn,
      //   columnData: columnData
      // });
    }
    
    // Rating data type doesn't need special config
    if (editingColumn.dataType === 'rating') {
      columnData.ratingConfig = editingColumn.ratingConfig;
      // safeLog('Frontend: Editing rating column:', {
      //   editingColumn: editingColumn,
      //   columnData: columnData,
      //   ratingConfig: editingColumn.ratingConfig
      // });
    }
    
    // Add linked table configuration if data type is linked_table
    if (editingColumn.dataType === 'linked_table') {
      columnData.linkedTableConfig = editingColumn.linkedTableConfig;
      // safeLog('Frontend: Editing linked_table column:', {
      //   editingColumn: editingColumn,
      //   columnData: columnData,
      //   linkedTableConfig: editingColumn.linkedTableConfig
      // });
    }
    
    // Add lookup configuration if data type is lookup
    if (editingColumn.dataType === 'lookup') {
      columnData.lookupConfig = editingColumn.lookupConfig;
      console.log('🔍 Frontend: Editing lookup column:', {
        editingColumn: editingColumn,
        columnData: columnData,
        lookupConfig: editingColumn.lookupConfig
      });
    }
    
    console.log('🔍 Final columnData being sent to API:', columnData);
    
    updateColumnMutation.mutate({
      columnId: editingColumn._id,
      columnData
    });
  };

  const handleDeleteColumn = (columnId, columnName) => {
    deleteColumnMutation.mutate(columnId);
  };

  const handleAddColumnLeft = (referenceColumn) => {
    setShowAddColumn(true);
    setAddColumnPosition({ position: 'left', referenceColumnId: referenceColumn._id });
  };

  const handleAddColumnRight = (referenceColumn) => {
    setShowAddColumn(true);
    setAddColumnPosition({ position: 'right', referenceColumnId: referenceColumn._id });
  };

  const handleCellClick = (recordId, columnName, currentValue) => {
    console.log('🔍 CELL CLICKED!', { recordId, columnName, currentValue });
    
    // If clicking on the same cell that's already being edited, ignore
    if (editingCell && editingCell.recordId === recordId && editingCell.columnName === columnName) {
      // console.log('🔍 Clicking on the same cell that is already being edited, ignoring');
      return;
    }

    // If clicking on a different cell, clear the current editing state first
    if (editingCell) {
      // console.log('🔍 Switching to different cell, clearing current editing state');
      setEditingCell(null);
      setCellValue('');
    }
    
    const column = columns.find(col => col.name === columnName);
    
    // Check cell edit permission
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);
    
    
    // console.log('🔍 Cell click debug:', {
    //   recordId,
    //   columnId: column?._id,
    //   columnName,
    //   currentValue,
    //   userRole,
    //   cellPermissionsCount: cellPermissionsResponse?.data?.length || 0,
    //   columnFound: !!column
    // });
    
    // Set selected cell
    setSelectedCell({ recordId, columnName });
    const cellPermissions = cellPermissionsResponse?.data || [];
    
    // Use canEditCell function (imported at top of file)
    const canEdit = canEditCell(cellPermissions, recordId, column._id, currentUser, userRole);
    
    
    // console.log('🔍 Permission check result:', {
    //   canEdit,
    //   cellPermissions: cellPermissions?.filter(p => 
    //     p.recordId === recordId && p.columnId === column._id
    //   ),
    //   userRole,
    //   currentUser: currentUser?._id
    // });
    
    // Always allow editing for template management
    if (canEdit) {
      console.log('🔍 Starting cell editing...');
      const { editingCell: newEditingCell, cellValue: newCellValue } = initializeCellEditing(recordId, columnName, currentValue, column);
      setEditingCell(newEditingCell);
      setCellValue(newCellValue);
    } else {
      console.log('🔍 Cell editing blocked:', {
        canEdit,
        isSystem: column.isSystem,
        dataType: column.dataType,
        reason: !canEdit ? 'No permission' : column.isSystem ? 'System field' : 'Checkbox field'
      });
    }
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    
    const record = records.find(r => r._id === editingCell.recordId);
    if (!record) return;

    const column = columns.find(col => col.name === editingCell.columnName);
    const updatedData = prepareCellDataForSave(cellValue, column, record);

    console.log('🔍 SAVING CELL DATA:', {
      recordId: editingCell.recordId,
      columnName: editingCell.columnName,
      cellValue,
      updatedData,
      originalRecord: record
    });

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
    // Skip group functionality for templates
      return;
  };

  const handleGroupFieldSelect = (fieldName) => {
    // Skip group functionality for templates
    return;
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
    console.log('🔄 Frontend: handleUpdateSortRule called:', { index, field, order });
    const newRules = updateSortRule(sortRules, index, field, order);
    console.log('🔄 Frontend: New sort rules:', newRules);
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
    // Skip group functionality for templates
    return;
  };

  const handleExpandAllGroups = () => {
    // Skip group functionality for templates
    return;
  };

  const handleCollapseAllGroups = () => {
    // Skip group functionality for templates
    return;
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

  // Get visible columns based on visibility settings and permissions
  const visibleColumns = useMemo(() => {
    // Get current user from context or localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);
    const columnPermissions = columnPermissionsResponse?.data || [];
    
    const result = getVisibleColumns(
      columns, 
      fieldVisibility, 
      showSystemFields, 
      columnPermissions, 
      currentUser, 
      userRole
    );
    
    // Apply column order
    return applyColumnOrder(result, columnOrder);
  }, [columns, fieldVisibility, showSystemFields, columnPermissionsResponse, databaseMembersResponse, columnOrder]);

  // Debug effect for visible columns
  useEffect(() => {
    if (false) {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);
      const columnPermissions = columnPermissionsResponse?.data || [];
      
      // addDebugLog(`=== VISIBLE COLUMNS CALCULATION ===`);
      // addDebugLog(`Template ID: ${templateId}`);
      // addDebugLog(`Current User: ${currentUser._id} (${currentUser.name || 'No name'})`);
      // addDebugLog(`Current User Email: ${currentUser.email || 'No email'}`);
      // addDebugLog(`Current User Role: ${currentUser.role || 'No role'}`);
      // addDebugLog(`Is Super Admin: ${currentUser.role === 'super_admin'}`);
      // addDebugLog(`User Role: ${userRole} (type: ${typeof userRole}) ${userRole === 'manager' || userRole === 'owner' ? '(CAN MANAGE PERMISSIONS)' : '(CANNOT MANAGE PERMISSIONS)'}`);
      // addDebugLog(`User Role Check: userRole === 'manager': ${userRole === 'manager'}, userRole === 'owner': ${userRole === 'owner'}`);
      
      // Check if current user matches any database member
      const currentUserInMembers = databaseMembersResponse?.data?.find(member => 
        member.user?._id === currentUser._id || member.userId?._id === currentUser._id
      );
      // addDebugLog(`Current User in Database Members: ${JSON.stringify(currentUserInMembers)}`);
      // addDebugLog(`Database Members Response: ${JSON.stringify(databaseMembersResponse)}`);
      // addDebugLog(`Database Members Count: ${databaseMembersResponse?.data?.length || 0}`);
      // addDebugLog(`Database Members: ${JSON.stringify(databaseMembersResponse?.data?.map(m => ({ userId: m.userId?._id, role: m.role })) || [])}`);
      // addDebugLog(`Column Permissions Response: ${JSON.stringify(columnPermissionsResponse)}`);
      // addDebugLog(`Column Permissions Count: ${columnPermissions.length}`);
      // addDebugLog(`Total Columns: ${columns.length}`);
      
      if (columnPermissions.length > 0) {
        // addDebugLog(`Column Permissions:`);
        // columnPermissions.forEach((perm, index) => {
        //   addDebugLog(`  ${index + 1}. Column: ${perm.columnId}, Type: ${perm.targetType}, CanView: ${perm.canView}, CanEdit: ${perm.canEdit}, User: ${perm.userId?._id}, Role: ${perm.role}`);
        // });
      } else {
        // addDebugLog(`No column permissions found. Try creating a permission first.`);
        // addDebugLog(`Column Permissions Response Data: ${JSON.stringify(columnPermissionsResponse?.data)}`);
      }
      
      // addDebugLog(`Visible Columns Count: ${visibleColumns.length}`);
      // addDebugLog(`Visible Columns: ${visibleColumns.map(c => c.name).join(', ')}`);
      // addDebugLog(`=== END VISIBLE COLUMNS ===`);
    }
  }, [visibleColumns, databaseMembersResponse, columnPermissionsResponse, columns, templateId]);

  // Test API call directly (disabled for templates)
  useEffect(() => {
    // Templates don't need member API calls
    // if (templateId) {
    //   // Template-specific API calls can be added here if needed
    // }
  }, [templateId]);

  // Get all columns including system fields
  const allColumnsWithSystem = useMemo(() => {
    return getAllColumnsWithSystem(columns, showSystemFields);
  }, [columns, showSystemFields]);



  // Skip group data processing for templates - always return flat data
  const groupedData = useMemo(() => {
    return { groups: [], ungroupedRecords: records };
  }, [records]);

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
            <Button size="small" danger onClick={() => navigate(`/templates/${templateId}`)}>
            Back to Template
            </Button>
          }
        />
      </div>
    );
  }

  

  return (
        <div style={{ margin: '0', padding: '0' }}>
      {/* Header */}
          <div className="">
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
            // Permission checks
            canEditStructure={canEditStructure}
            canAddData={canAddData}
            canEditData={canEditData}
            canAddView={canAddView}
            canEditView={canEditView}
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
            // Row height props
            tableId={tableId}
            databaseId={templateId}
            rowHeightSettings={rowHeightSettings}
            onRowHeightChange={handleRowHeightChange}
            // Column actions
            handleEditColumn={handleEditColumn}
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
            handleEditColumn={handleEditColumn}
            handleColumnPermission={handleColumnPermission}
            handleCellPermission={handleCellPermission}
            handleDeleteColumn={handleDeleteColumn}
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
            tableId={tableId}
            databaseId={templateId}
            rowHeightSettings={rowHeightSettings}
            // Permission props
            cellPermissions={cellPermissionsResponse?.data || []}
            currentUser={JSON.parse(localStorage.getItem('user') || '{}')}
            canEditStructure={canEditStructure}
            canAddData={canAddData}
            canEditData={canEditData}
            userRole={getUserDatabaseRole(databaseMembersResponse?.data || [], JSON.parse(localStorage.getItem('user') || '{}'))}
            // Debug props
            cellPermissionsResponse={cellPermissionsResponse}
            // addDebugLog={addDebugLog}
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
            addColumnPosition={addColumnPosition}
            columns={columns}
            loading={addColumnMutation.isPending}
            currentTableId={tableId}
            currentDatabaseId={templateId}
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
            currentTableId={tableId}
            currentDatabaseId={templateId || null}
          />

          {/* Column Permission Modal */}
          <RowColumnCellPermissionModal
            visible={showColumnPermissionModal}
            onCancel={() => {
              // console.log('🚨 CLOSING COLUMN PERMISSION MODAL');
              setShowColumnPermissionModal(false);
              setSelectedColumnForPermission(null);
              // Clear any editing cell state
              setEditingCell(null);
              setCellValue('');
            }}
            type="column"
            columnId={selectedColumnForPermission?._id}
            tableId={tableId}
            databaseId={templateId}
          />

          {/* Cell Permission Modal */}
          <RowColumnCellPermissionModal
            visible={showCellPermissionModal}
            onCancel={() => {
              // console.log('🚨 CLOSING CELL PERMISSION MODAL');
              setShowCellPermissionModal(false);
              setSelectedCellForPermission(null);
              // Clear any editing cell state
              setEditingCell(null);
              setCellValue('');
            }}
            type="cell"
            recordId={selectedCellForPermission?.recordId}
            columnId={selectedCellForPermission?.columnId}
            tableId={tableId}
            databaseId={templateId}
          />

          {/* Debug logs for column permission modal - Commented out */}
          {/* {showColumnPermissionModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '10px', zIndex: 9999 }}>
              <div>🚨 COLUMN PERMISSION MODAL DEBUG:</div>
              <div>showColumnPermissionModal: {showColumnPermissionModal.toString()}</div>
              <div>selectedColumnForPermission: {JSON.stringify(selectedColumnForPermission)}</div>
              <div>columnId: {selectedColumnForPermission?._id}</div>
              <div>tableId: {tableId}</div>
              <div>templateId: {templateId}</div>
          </div>
          )} */}

          {/* Debug Panel - Commented out */}
          {/* {showDebugPanel && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '400px',
              maxHeight: '300px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              zIndex: 9999,
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>🔍 Debug Panel</h4>
              <button
                  onClick={() => setShowDebugPanel(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                  ✕
              </button>
            </div>
              <div style={{ marginBottom: '10px' }}>
                          <button
                  onClick={() => setDebugLogs([])}
                  style={{ 
                    marginRight: '8px', 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Logs
                          </button>
                          <button
                  // onClick={() => addDebugLogManually('Test debug log from button')}
                  style={{ 
                    marginRight: '8px', 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Test Debug
                          </button>
                <button 
                  onClick={async () => {
                    try {
                      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                      // addDebugLog(`Attempting to update role for user: ${currentUser._id} in template: ${templateId}`);
                      
                      const requestBody = {
                        templateId: templateId,
                        userId: currentUser._id,
                        newRole: 'manager'
                      };
                      
                      // addDebugLog(`Request body: ${JSON.stringify(requestBody)}`);
                      
                      const response = await fetch(`/api/templates/${templateId}/update-role-test`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                          userId: currentUser._id,
                          newRole: 'manager'
                        })
                      });
                      
                      // addDebugLog(`Response status: ${response.status}`);
                      // addDebugLog(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
                      
                      const data = await response.json();
                      // addDebugLog(`Update role result: ${JSON.stringify(data)}`);
                      
                      if (data.success) {
                        // addDebugLog(`User role updated to manager. Please refresh to see changes.`);
                      } else {
                        // addDebugLog(`Failed to update role: ${data.message || 'Unknown error'}`);
                      }
                    } catch (error) {
                      // addDebugLog(`Update role error: ${error.message}`);
                      // addDebugLog(`Error stack: ${error.stack}`);
                    }
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Make Me Manager
                </button>
                <button
                  onClick={() => {
                    // Invalidate and refetch column permissions
                    queryClient.invalidateQueries(['columnPermissions', tableId]);
                    // addDebugLog(`Refreshing column permissions...`);
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#fa8c16',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Permissions
                </button>
                <button
                  onClick={async () => {
                    try {
                      // addDebugLog(`Testing column permissions for tableId: ${tableId}`);
                      const response = await fetch(`/api/templates/${templateId}/tables/${tableIndex}/columns-permissions-test`);
                      const result = await response.json();
                      // console.log('Test column permissions result:', result);
                      // addDebugLog(`Test column permissions result: ${JSON.stringify(result)}`);
                    } catch (error) {
                      console.error('Test column permissions error:', error);
                      // addDebugLog(`Test column permissions error: ${error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#722ed1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Test Column Perms
                </button>
                <button 
                  onClick={async () => {
                    try {
                      // addDebugLog(`Testing record permissions for tableId: ${tableId}`);
                      const response = await fetch(`/api/templates/${templateId}/tables/${tableIndex}/records-permissions-test`);
                      const result = await response.json();
                      // console.log('Test record permissions result:', result);
                      // addDebugLog(`Test record permissions result: ${JSON.stringify(result)}`);
                    } catch (error) {
                      console.error('Test record permissions error:', error);
                      // addDebugLog(`Test record permissions error: ${error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#eb2f96',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Test Record Perms
                </button>
                <button
                  onClick={async () => {
                    try {
                      // addDebugLog(`Testing cell permissions for tableId: ${tableId}`);
                      const response = await fetch(`/api/templates/${templateId}/tables/${tableIndex}/cells-permissions-test`);
                      const result = await response.json();
                      // console.log('Test cell permissions result:', result);
                      // addDebugLog(`Test cell permissions result: ${JSON.stringify(result)}`);
                    } catch (error) {
                      console.error('Test cell permissions error:', error);
                      // addDebugLog(`Test cell permissions error: ${error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#13c2c2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Test Cell Perms
                </button>
                <button
                  onClick={async () => {
                    try {
                      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                      // addDebugLog(`Creating default cell permissions for tableId: ${tableId}`);
                      const response = await fetch(`/api/templates/${templateId}/tables/${tableIndex}/create-default-cell-permissions`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          createdBy: currentUser?._id || '683c681e94a974c92873ffb8' // Fallback user ID
                        })
                      });
                      const result = await response.json();
                      // console.log('Create cell permissions result:', result);
                      // addDebugLog(`Create cell permissions result: ${JSON.stringify(result)}`);
                      
                      // Refresh permissions after creating
                      if (result.success) {
                        // addDebugLog(`✅ Created ${result.data.createdPermissions} cell permissions! Now try editing cells.`);
                      }
                    } catch (error) {
                      console.error('Create cell permissions error:', error);
                      // addDebugLog(`Create cell permissions error: ${error.message}`);
                    }
                  }}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: '12px',
                    background: '#52c41a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create Cell Perms
                </button>
              </div>
              <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                {debugLogs.map((log, index) => (
                  <div key={index} style={{ 
                    marginBottom: '2px', 
                    padding: '2px',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f8f8f8',
                    borderRadius: '2px'
                  }}>
                    {log}
          </div>
                ))}
        </div>
            </div>
          )} */}

          {/* Debug Toggle Button - Commented out */}
          {/* <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: showDebugPanel ? '#ff4d4f' : '#1890ff',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              zIndex: 9998,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            title="Toggle Debug Panel"
          >
            🔍
          </button> */}
    </div>
  );
};

export default TableDetail;
