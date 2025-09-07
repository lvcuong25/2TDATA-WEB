import React, { useState, useMemo, useCallback, useRef } from 'react';
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
  loadColumnWidths,
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
  createFilterRule,
  addFilterRule,
  removeFilterRule,
  updateFilterRule,
  clearAllFilterRules,
  toggleFilterActive,
  isFilterActive,
  getFilterRulesCount,
  applyFilterRules,
  evaluateFilterRule,
  getFilterButtonStyle,
  getFilterDropdownPosition,
  toggleFilterDropdown,
  validateFilterRule,
  getDefaultFilterRule,
  isFieldFilterable,
  getFilterSummary
} from './Utils/filterUtils.jsx';
import {
  createGroupRule,
  addGroupRule,
  removeGroupRule,
  updateGroupRule,
  clearAllGroupRules,
  getGroupRulesCount,
  isFieldUsedInGroup,
  getAvailableGroupFields,
  generateGroupKey,
  generateGroupValues,
  groupRecords,
  toggleGroupExpansion,
  expandAllGroups,
  collapseAllGroups,
  isGroupExpanded,
  getGroupButtonStyle,
  getGroupDropdownPosition,
  toggleGroupDropdown,
  validateGroupRule,
  getDefaultGroupRule,
  isFieldGroupable,
  getGroupSummary,
  getGroupDisplayName,
  calculateGroupStats,
  sortGroups
} from './Utils/groupUtils.jsx';
import {
  initializeCellEditing,
  cancelCellEditing,
  isCellEditing,
  validateCellValue,
  formatCellValueForDisplay,
  formatCellValueForInput,
  getCellInputType,
  getCellInputPlaceholder,
  isCellEditable,
  getCellEditingStyle,
  handleCellValueChange,
  prepareCellDataForSave,
  getCellValidationError,
  shouldAutoSave,
  getCellDisplayComponentType,
  formatCellValueForExport
} from './Utils/cellUtils.jsx';
import {
  SYSTEM_FIELDS,
  SYSTEM_FIELD_IDS,
  getAllColumnsWithSystem,
  getVisibleColumns,
  toggleFieldVisibility,
  setFieldVisibility,
  toggleSystemFields,
  isFieldVisible,
  getFieldVisibilityCount,
  getHiddenFieldsCount,
  getVisibleFieldsCount,
  getFieldVisibilityButtonStyle,
  getSystemFieldsButtonStyle,
  getFieldItemStyle,
  getFieldCheckboxStyle,
  getFieldHoverStyle,
  getFieldLeaveStyle,
  filterFieldsBySearch,
  sortFieldsByVisibility,
  getFieldVisibilitySummary,
  resetFieldVisibilityToDefault,
  exportFieldVisibilitySettings,
  importFieldVisibilitySettings
} from './Utils/fieldVisibilityUtils.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { useTableData } from './Hooks/useTableData';
import { useTableContext } from '../../contexts/TableContext';
import {
  Button,
  Modal,
  Input,
  Select,
  Dropdown,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Tag,
  Divider,
  Spin,
  Alert,
  Checkbox,
  Layout,
  Menu,
  Radio
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  DatabaseOutlined,
  TableOutlined,
  FieldBinaryOutlined,
  NumberOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SettingOutlined,
  DownOutlined,
  UserOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  RightOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  MailOutlined,
  LinkOutlined,
  CodeOutlined,
  MenuOutlined,
  FunctionOutlined,
  DollarOutlined
} from '@ant-design/icons';
import axiosInstance from '../../utils/axiosInstance-cookie-only';

const { Title, Text } = Typography;
const { Option } = Select;
const { Header, Sider, Content } = Layout;

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
    defaultValue: null
  });
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [visibleCheckboxes, setVisibleCheckboxes] = useState(new Set());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, recordId: null });
  const [sortRules, setSortRules] = useState([]);
  const [currentSortField, setCurrentSortField] = useState('');
  const [currentSortOrder, setCurrentSortOrder] = useState('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortDropdownPosition, setSortDropdownPosition] = useState({ x: 0, y: 0 });
  const [sortFieldSearch, setSortFieldSearch] = useState('');

  // Grouping state
  const [groupRules, setGroupRules] = useState([]);
  const [currentGroupField, setCurrentGroupField] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [groupDropdownPosition, setGroupDropdownPosition] = useState({ x: 0, y: 0 });
  const [groupFieldSearch, setGroupFieldSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Filtering state
  const [filterRules, setFilterRules] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterDropdownPosition, setFilterDropdownPosition] = useState({ x: 0, y: 0 });
  const [isFilterActive, setIsFilterActive] = useState(false);

  // Fields management state
  const [showFieldsDropdown, setShowFieldsDropdown] = useState(false);
  const [fieldsDropdownPosition, setFieldsDropdownPosition] = useState({ x: 0, y: 0 });
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldVisibility, setFieldVisibility] = useState({});
  const [showSystemFields, setShowSystemFields] = useState(false);

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
    deleteMultipleRecordsMutation,
    deleteAllRecordsMutation,
    updateColumnMutation,
    deleteColumnMutation,
    queryClient
  } = useTableData(tableId, databaseId, sortRules, filterRules, isFilterActive, tableContext, modalCallbacks);

  // Load group preferences from backend when data is available
  React.useEffect(() => {
    if (groupPreferenceResponse?.data) {
      const preference = groupPreferenceResponse.data;
      setGroupRules(preference.groupRules || []);
      setExpandedGroups(new Set(preference.expandedGroups || []));
      console.log('Group preferences loaded from backend:', preference);
    }
  }, [groupPreferenceResponse]);

  // Load field preferences from backend when data is available
  React.useEffect(() => {
    if (fieldPreferenceResponse?.data) {
      const preference = fieldPreferenceResponse.data;
      setFieldVisibility(preference.fieldVisibility || {});
      setShowSystemFields(preference.showSystemFields || false);
      console.log('Field preferences loaded from backend:', preference);
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

  // Debug: Log when editingCell changes
  React.useEffect(() => {
    console.log('editingCell changed:', editingCell);
  }, [editingCell]);

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
          setSortFieldSearch('');
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
          setGroupFieldSearch('');
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
          setFieldSearch('');
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

  // Get type letter for compact display



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
    
    console.log('Column state before sending:', {
      name: newColumn.name,
      dataType: newColumn.dataType,
      defaultValue: newColumn.defaultValue,
      currencyConfig: newColumn.currencyConfig
    });
    console.log('Frontend sending column data:', columnData);
    addColumnMutation.mutate(columnData);
  };

  const handleAddRow = () => {
    console.log('handleAddRow - columns:', visibleColumns);
    console.log('handleAddRow - currency columns:', visibleColumns.filter(c => c.dataType === 'currency').map(c => ({
      name: c.name,
      defaultValue: c.defaultValue,
      currencyConfig: c.currencyConfig
    })));
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
        console.log('✅ Single-select default applied:', { 
          columnName: column.name, 
          defaultValue: config.defaultValue,
          hasConfig: !!column.singleSelectConfig,
          options: config.options 
        });
      } else if (column.dataType === 'date') {
        // For date type, leave empty for now (user will select date)
        emptyData[column.name] = '';
      } else if (column.dataType === 'currency') {
        // Use default value for currency type
        console.log('Setting currency default for column:', column.name, 'defaultValue:', column.defaultValue);
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
    
    console.log('🚀 About to create record with data:', recordData);
    console.log('🚀 About to create grouped record with data:', recordData);
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
        
        console.log('🔍 Multi-select column found:', { 
          columnName: column.name,
          fullColumn: column,
          config: config,
          defaultValue: config.defaultValue,
          willSet: config.defaultValue
        });
        
        emptyData[column.name] = config.defaultValue;
        
        console.log('✅ Multi-select default applied to emptyData:', { 
          columnName: column.name, 
          setValue: emptyData[column.name],
          emptyData: emptyData
        });
      } else if (column.dataType === 'date') {
        // For date type, leave empty for now (user will select date)
        emptyData[column.name] = '';
      } else if (column.dataType === 'currency') {
        // Use default value for currency type
        console.log('Setting currency default for column:', column.name, 'defaultValue:', column.defaultValue);
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


  const handleDeleteAllRecords = () => {
    if (records.length === 0) {
      // toast.warning('No records to delete');
      return;
    }
    deleteAllRecordsMutation.mutate();
  };

  const handleDeleteRecord = (recordId) => {
    deleteRecordMutation.mutate(recordId);
  };

  const handleEditColumn = (column) => {
    console.log('Editing column:', column);
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
    
    updateColumnMutation.mutate({
      columnId: editingColumn._id,
      columnData
    });
  };

  const handleDeleteColumn = (columnId, columnName) => {
    deleteColumnMutation.mutate(columnId);
  };

  const handleCellClick = (recordId, columnName, currentValue) => {
    console.log('Cell clicked:', { recordId, columnName, currentValue });
    console.log('Current editingCell before:', editingCell);
    
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

  const handleSort = (fieldName) => {
    console.log('Sorting by:', fieldName);
    setCurrentSortField(fieldName);
    setCurrentSortOrder('asc');
  };

  const handleAddSortRule = () => {
    if (currentSortField) {
      const newRules = addSortRule(sortRules, currentSortField, currentSortOrder);
      setSortRules(newRules);
      setCurrentSortField('');
      setCurrentSortOrder('asc');
      setSortFieldSearch('');
    }
  };

  const handleRemoveSortRule = (index) => {
    const newRules = removeSortRule(sortRules, index);
    setSortRules(newRules);
  };

  const handleClearAllSorts = () => {
    setSortRules(clearAllSorts());
    setCurrentSortField('');
    setCurrentSortOrder('asc');
  };

  const handleSortButtonClick = (e) => {
    const position = getSortDropdownPosition(e);
    setSortDropdownPosition(position);
    setShowSortDropdown(toggleSortDropdown(showSortDropdown));
    if (!showSortDropdown) {
      setSortFieldSearch('');
    }
  };

  const onSortFieldSelect = (fieldName) => {
    // Auto-add the sort rule when field is selected
    const newRules = handleSortFieldSelect(sortRules, fieldName, currentSortOrder);
    setSortRules(newRules);
    setCurrentSortField('');
    setCurrentSortOrder('asc');
    setSortFieldSearch('');
  };

  const handleUpdateSortRule = (index, field, order) => {
    const newRules = updateSortRule(sortRules, index, field, order);
    setSortRules(newRules);
  };

  // Grouping handlers
  const handleGroupButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGroupDropdownPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setShowGroupDropdown(!showGroupDropdown);
    if (!showGroupDropdown) {
      setGroupFieldSearch('');
    }
  };

  const handleGroupFieldSelect = (fieldName) => {
    // Auto-add the group rule when field is selected
    const newGroupRules = addGroupRule(groupRules, fieldName);
    setGroupRules(newGroupRules);
    setCurrentGroupField('');
    setGroupFieldSearch('');
    
    // Save to backend
    saveGroupPreferenceMutation.mutate({
      groupRules: newGroupRules,
      expandedGroups
    });
  };

  const handleRemoveGroupRule = (index) => {
    console.log(`🗑️ Removing group rule at index ${index}`);
    const newRules = removeGroupRule(groupRules, index);
    setGroupRules(newRules);
    // Clear expanded groups when removing group rules
    setExpandedGroups(new Set());
    
    // Save to backend immediately
    console.log("💾 Saving updated group rules to backend:", newRules);
    saveGroupPreferenceMutation.mutate({
      groupRules: newRules,
      expandedGroups: []
    });
  };
  const handleClearAllGroups = () => {
    console.log("🧹 Clearing all group rules");
    setGroupRules(clearAllGroupRules());
    setCurrentGroupField("");
    setExpandedGroups(new Set());
    
    // Save to backend immediately
    console.log("💾 Saving cleared group rules to backend");
    saveGroupPreferenceMutation.mutate({
      groupRules: [],
      expandedGroups: []
    });
  };

  const handleUpdateGroupRule = (index, field) => {
    const newRules = updateGroupRule(groupRules, index, field);
    setGroupRules(newRules);
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
    console.log('🔍 Filter button clicked!');
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
    if (!showFieldsDropdown) {
      setFieldSearch('');
    }
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

  const handleToggleFilterActive = () => {
    const newIsActive = toggleFilterActive(isFilterActive);
    setIsFilterActive(newIsActive);
    console.log('Filter active toggled:', newIsActive);
    console.log('Current filter rules:', filterRules);
    console.log('Records before filter:', allRecords.length);
    console.log('Records after filter:', records.length);
  };

  const handleAddFilterRule = () => {
    if (columns.length > 0) {
      const newRules = addFilterRule(filterRules, columns[0].name);
      setFilterRules(newRules);
      setIsFilterActive(true); // Auto activate when adding rule
    }
  };

  const handleRemoveFilterRule = (index) => {
    const newRules = removeFilterRule(filterRules, index);
    setFilterRules(newRules);
  };

  const handleUpdateFilterRule = (index, field, operator, value) => {
    const newRules = updateFilterRule(filterRules, index, field, operator, value);
    setFilterRules(newRules);
    
    // Auto save to backend if we had the mutation
    console.log('Filter rule updated:', { index, field, operator, value });
    console.log('Available columns:', columns.map(col => ({ name: col.name, type: col.dataType })));
    
    // Auto-activate filter when rule is updated
    if (!isFilterActive) {
      setIsFilterActive(true);
    }
  };


  // Group data by rules
  const groupedData = useMemo(() => {
    return groupRecords(records, groupRules);
  }, [records, groupRules]);






  // Prepare table data
  const tableData = useMemo(() => {
    return records.map((record, index) => ({
      key: record._id,
      ...record,
      index
    }));
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
            addFilterRule={addFilterRule}
            removeFilterRule={removeFilterRule}
            updateFilterRule={updateFilterRule}
            toggleFilterActive={toggleFilterActive}
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
