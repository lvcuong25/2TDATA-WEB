import React, { useState, useMemo, useCallback, useRef } from 'react';
import { formatDateForDisplay, formatDateForInput } from '../../utils/dateFormatter.js';
import SingleSelectConfig from './Config/SingleSelectConfig';
import MultiSelectConfig from './Config/MultiSelectConfig';
import DateConfig from './Config/DateConfig';
import FormulaConfig from './Config/FormulaConfig';
import CurrencyConfig from './Config/CurrencyConfig';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
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
  const queryClient = useQueryClient();
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

  // Fetch group preferences from backend
  const { data: groupPreferenceResponse } = useQuery({
    queryKey: ['groupPreference', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/group-preference`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Save group preference mutation
  const saveGroupPreferenceMutation = useMutation({
    mutationFn: async ({ groupRules, expandedGroups }) => {
      const response = await axiosInstance.post(`/database/tables/${tableId}/group-preference`, {
        groupRules,
        expandedGroups: Array.from(expandedGroups)
      });
      return response.data;
    },
    onSuccess: () => {
      console.log('Group preference saved successfully');
    },
    onError: (error) => {
      console.error('Error saving group preference:', error);
    },
  });

  // Fetch field preferences from backend
  const { data: fieldPreferenceResponse } = useQuery({
    queryKey: ['fieldPreference', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/field-preference`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Save field preference mutation
  const saveFieldPreferenceMutation = useMutation({
    mutationFn: async ({ fieldVisibility, showSystemFields }) => {
      const response = await axiosInstance.post(`/database/tables/${tableId}/field-preference`, {
        fieldVisibility,
        showSystemFields
      });
      return response.data;
    },
    onSuccess: () => {
      console.log('Field preference saved successfully');
    },
    onError: (error) => {
      console.error('Error saving field preference:', error);
    },
  });

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


  // Fetch table structure
  const { data: tableStructureResponse, isLoading, error } = useQuery({
    queryKey: ['tableStructure', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/structure`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch table records
  const { data: recordsResponse } = useQuery({
    queryKey: ['tableRecords', tableId, sortRules, filterRules, isFilterActive],
    queryFn: async () => {
      const sortRulesParam = sortRules.length > 0 ? JSON.stringify(sortRules) : undefined;
      const filterRulesParam = isFilterActive && filterRules.length > 0 ? JSON.stringify(filterRules) : undefined;
      const response = await axiosInstance.get(`/database/tables/${tableId}/records`, {
        params: {
          sortRules: sortRulesParam,
          filterRules: filterRulesParam,
          // Force ascending order when no sort rules are applied
          forceAscending: sortRules.length === 0 ? 'true' : undefined
        }
      });
      return response.data;
    },
    enabled: !!tableId,
  });

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

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: async (columnData) => {
      const response = await axiosInstance.post('/database/columns', {
        ...columnData,
        tableId,
        databaseId
      });
      return response.data;
    },
          onSuccess: () => {
        toast.success('Thêm cột thành công');
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
        queryClient.invalidateQueries(['tableStructure', tableId]);
      },
      onError: (error) => {
        console.error('Error adding column:', error);
        toast.error(error.response?.data?.message || 'Không thể thêm cột');
      },
  });

  // Add record mutation
  const addRecordMutation = useMutation({
    mutationFn: async (recordData) => {
      const response = await axiosInstance.post('/database/records', {
        ...recordData,
        tableId,
        databaseId
      });
      return response.data;
    },
          onSuccess: () => {
        // toast.success('Record added successfully');
        queryClient.invalidateQueries(['tableRecords', tableId]);
      },
      onError: (error) => {
        console.error('Error adding record:', error);
        // toast.error(error.response?.data?.message || 'Failed to add record');
      },
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ recordId, data }) => {
      const response = await axiosInstance.put(`/database/records/${recordId}`, {
        data,
        tableId,
        databaseId
      });
      return response.data;
    },
          onSuccess: (data, variables) => {
        // toast.success('Record updated successfully');
        
        // For multi-select, keep the dropdown open to allow multiple selections  
        const column = columns.find(col => col.name === editingCell?.columnName);
        if (column && column.dataType === 'multi_select') {
          // Keep editingCell active for multi-select, just refresh the data
          queryClient.invalidateQueries(['tableRecords', tableId]);
        } else {
          // For other types, close the editing cell as usual
          setEditingCell(null);
          setCellValue('');
          queryClient.invalidateQueries(['tableRecords', tableId]);
        }
      },
      onError: (error) => {
        console.error('Error updating record:', error);
        // toast.error(error.response?.data?.message || 'Failed to update record');
      },
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await axiosInstance.delete(`/database/records/${recordId}`);
      return response.data;
    },
          onSuccess: () => {
        // toast.success('Record deleted successfully');
        queryClient.invalidateQueries(['tableRecords', tableId]);
      },
      onError: (error) => {
        console.error('Error deleting record:', error);
        // toast.error(error.response?.data?.message || 'Failed to delete record');
      },
  });

  // Bulk delete records mutation
  const deleteMultipleRecordsMutation = useMutation({
    mutationFn: async (recordIds) => {
      const response = await axiosInstance.delete('/database/records/bulk', {
        data: { recordIds }
      });
      return response.data;
    },
          onSuccess: (data) => {
        // toast.success(`${data.deletedCount} records deleted successfully`);
        setSelectedRowKeys([]);
        setSelectAll(false);
        queryClient.invalidateQueries(['tableRecords', tableId]);
      },
      onError: (error) => {
        console.error('Error deleting records:', error);
        // toast.error(error.response?.data?.message || 'Failed to delete records');
      },
  });

  // Delete all records mutation
  const deleteAllRecordsMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.delete(`/database/tables/${tableId}/records/all`);
      return response.data;
    },
          onSuccess: (data) => {
        // toast.success(`All ${data.deletedCount} records deleted successfully`);
        setSelectedRowKeys([]);
        setSelectAll(false);
        queryClient.invalidateQueries(['tableRecords', tableId]);
      },
      onError: (error) => {
        console.error('Error deleting all records:', error);
        // toast.error(error.response?.data?.message || 'Failed to delete all records');
      },
  });

  // Update column mutation
  const updateColumnMutation = useMutation({
    mutationFn: async ({ columnId, columnData }) => {
      const response = await axiosInstance.put(`/database/columns/${columnId}`, columnData);
      return response.data;
    },
          onSuccess: () => {
        // toast.success('Column updated successfully');
        setShowEditColumn(false);
        setEditingColumn(null);
        queryClient.invalidateQueries(['tableStructure', tableId]);
      },
      onError: (error) => {
        console.error('Error updating column:', error);
        // toast.error(error.response?.data?.message || 'Failed to update column');
      },
  });

  // Delete column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: async (columnId) => {
      const response = await axiosInstance.delete(`/database/columns/${columnId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tableStructure', tableId]);
    },
    onError: (error) => {
      console.error('Error deleting column:', error);
    },
  });

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

          {/* Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            backgroundColor: '#fafafa',
            border: '1px solid #d9d9d9',
            borderBottom: 'none',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            marginBottom: '0',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Button 
                  type="text" 
                  icon={<UnorderedListOutlined />}
                  size="small"
                  onClick={handleFieldsButtonClick}
                  data-fields-button
                  style={getFieldVisibilityButtonStyle(fieldVisibility)}
                >
                  Fields
                </Button>
                
                {/* Fields Dropdown */}
                {showFieldsDropdown && (
                  <div 
                    data-fields-dropdown
                    style={{
                      position: 'fixed',
                      top: fieldsDropdownPosition.y,
                      left: fieldsDropdownPosition.x,
                      zIndex: 9999,
                      backgroundColor: 'white',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      minWidth: '300px',
                      maxWidth: '400px'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UnorderedListOutlined style={{ color: '#666' }} />
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>Fields</span>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <Input
                        placeholder="Search fields"
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        size="small"
                        style={{ 
                          border: '1px solid #d9d9d9',
                          borderRadius: '4px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Field List */}
                    <div style={{ 
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      {filterFieldsBySearch(allColumnsWithSystem, fieldSearch)
                        .map(column => (
                          <div
                            key={column._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 16px',
                              borderBottom: '1px solid #f0f0f0',
                              ...getFieldItemStyle(fieldVisibility, column._id, column.isSystem)
                            }}
                            onMouseEnter={(e) => {
                              const hoverStyle = getFieldHoverStyle(fieldVisibility, column._id);
                              Object.assign(e.target.style, hoverStyle);
                            }}
                            onMouseLeave={(e) => {
                              const leaveStyle = getFieldLeaveStyle(fieldVisibility, column._id, column.isSystem);
                              Object.assign(e.target.style, leaveStyle);
                            }}
                            onClick={() => handleToggleFieldVisibility(column._id)}
                          >
                            {/* Drag Handle */}
                            <div style={{ 
                              cursor: 'grab',
                              color: '#bfbfbf',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <MenuOutlined style={{ fontSize: '14px' }} />
                            </div>
                            
                            {/* Field Icon */}
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: 'bold', 
                              color: '#666',
                              backgroundColor: column.isSystem ? '#f0f0f0' : '#e6f7ff',
                              borderRadius: '3px',
                              padding: '2px 6px',
                              minWidth: '16px',
                              textAlign: 'center',
                              border: '1px solid #d9d9d9'
                            }}>
                              {getTypeLetter(column.dataType)}
                            </div>
                            
                            {/* Field Name */}
                            <span style={{ 
                              fontSize: '13px', 
                              flex: 1,
                              fontWeight: fieldVisibility[column._id] === false ? '400' : (column.isSystem ? '400' : '500'),
                              color: fieldVisibility[column._id] === false ? '#999' : (column.isSystem ? '#52c41a' : '#333'),
                              fontStyle: column.isSystem ? 'italic' : 'normal',
                              textDecoration: fieldVisibility[column._id] === false ? 'line-through' : 'none'
                            }}>
                              {column.name}
                            </span>
                            
                            {/* Visibility Toggle */}
                            <Checkbox
                              checked={column.isSystem ? 
                                (showSystemFields && fieldVisibility[column._id] !== false) : 
                                (fieldVisibility[column._id] !== false)
                              }
                              onChange={() => handleToggleFieldVisibility(column._id)}
                              style={getFieldCheckboxStyle(fieldVisibility, column._id, column.isSystem)}
                            />
                          </div>
                        ))}
                    </div>
                    
                    {/* Bottom Action Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderTop: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa'
                    }}>
                      <Button
                        type="text"
                        icon={<UserOutlined />}
                        size="small"
                        onClick={handleToggleSystemFields}
                        style={getSystemFieldsButtonStyle(showSystemFields)}
                      >
                        System fields
                      </Button>
                      <Button
                        type="text"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => setShowAddColumn(true)}
                        style={{ 
                          color: '#1890ff',
                          fontSize: '12px'
                        }}
                      >
                        + New Field
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Button 
                  type="text" 
                  icon={<FilterOutlined />}
                  size="small"
                  onClick={handleFilterButtonClick}
                  data-filter-button
                  style={{ 
                    color: filterRules.length > 0 ? '#52c41a' : '#666',
                    backgroundColor: filterRules.length > 0 ? '#f6ffed' : 'transparent',
                    border: filterRules.length > 0 ? '1px solid #52c41a' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: filterRules.length > 0 ? '500' : 'normal'
                  }}
                >
                  Filter {filterRules.length > 0 && filterRules.length}
                </Button>
                
                {/* Filter Dropdown */}
                {showFilterDropdown && (
                  <div 
                    data-filter-dropdown
                    style={{
                      position: 'fixed',
                      top: filterDropdownPosition.y,
                      left: filterDropdownPosition.x,
                      zIndex: 9999,
                      backgroundColor: 'white',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      minWidth: '400px',
                      padding: '20px'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FilterOutlined style={{ color: '#666' }} />
                        <span style={{ fontWeight: '500', fontSize: '16px' }}>Filter</span>
                      </div>
                      <Checkbox
                        checked={isFilterActive}
                        onChange={handleToggleFilterActive}
                        size="small"
                      >
                        Active
                      </Checkbox>
                    </div>
                    
                    {/* Filter Rules */}
                    {filterRules.length > 0 ? (
                      <div>
                        {filterRules.map((rule, index) => {
                          const column = columns.find(col => col.name === rule.field);
                          const operatorOptions = getOperatorOptions(column?.dataType || 'text');
                          
                          return (
                            <div key={index} style={{
                              marginBottom: '16px'
                            }}>
                              {/* Filter Rule Row */}
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px',
                                padding: '12px',
                                backgroundColor: '#fafafa',
                                borderRadius: '6px',
                                border: '1px solid #e8e8e8'
                              }}>
                                {/* Where Label */}
                                <span style={{ 
                                  fontSize: '14px', 
                                  fontWeight: '500', 
                                  color: '#666',
                                  minWidth: '50px'
                                }}>
                                  Where
                                </span>
                                
                                {/* Field Select */}
                                <Select
                                  value={rule.field}
                                  onChange={(value) => handleUpdateFilterRule(index, value, rule.operator, rule.value)}
                                  size="small"
                                  style={{ 
                                    width: '140px',
                                    backgroundColor: 'white'
                                  }}
                                  suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                                  dropdownStyle={{ zIndex: 9999 }}
                                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                  placeholder="Select field"
                                  showSearch={false}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {columns.map(col => (
                                    <Option key={col._id} value={col.name}>
                                      {getTypeLetter(col.dataType)} {col.name}
                                    </Option>
                                  ))}
                                </Select>
                                
                                {/* Operator Select */}
                                <Select
                                  value={rule.operator}
                                  onChange={(value) => handleUpdateFilterRule(index, rule.field, value, rule.value)}
                                  size="small"
                                  style={{ 
                                    width: '120px',
                                    backgroundColor: 'white'
                                  }}
                                  suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                                  dropdownStyle={{ zIndex: 9999 }}
                                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                  placeholder="Select operator"
                                  showSearch={false}
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  {operatorOptions.map(option => (
                                    <Option key={option.value} value={option.value}>
                                      {option.label}
                                    </Option>
                                  ))}
                                </Select>
                                
                                {/* Value Input */}
                                {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                                  <Input
                                    value={rule.value}
                                    onChange={(e) => handleUpdateFilterRule(index, rule.field, rule.operator, e.target.value)}
                                    size="small"
                                    style={{ 
                                      flex: 1,
                                      backgroundColor: 'white'
                                    }}
                                    placeholder="Enter a value"
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                )}
                                
                                {/* Delete Button */}
                                <Button
                                  type="text"
                                  icon={<DeleteOutlined />}
                                  size="small"
                                  onClick={() => handleRemoveFilterRule(index)}
                                  style={{ 
                                    color: '#666',
                                    padding: '4px 8px'
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#999', 
                        fontSize: '14px', 
                        marginBottom: '16px',
                        padding: '20px',
                        backgroundColor: '#fafafa',
                        borderRadius: '6px'
                      }}>
                        No filter rules added yet
                      </div>
                    )}
                    
                    {/* Add Filter Button */}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={addFilterRule}
                      style={{ 
                        width: '100%',
                        height: '36px',
                        borderStyle: 'dashed',
                        borderColor: '#d9d9d9'
                      }}
                      size="small"
                    >
                      + Add filter
                    </Button>
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Button 
                  type="text" 
                  icon={<AppstoreOutlined />}
                  size="small"
                  onClick={handleGroupButtonClick}
                  data-group-button
                  style={getGroupButtonStyle(groupRules)}
                >
                  Group
                  {getGroupRulesCount(groupRules) > 0 && (
                    <span style={{
                      backgroundColor: '#52c41a',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getGroupRulesCount(groupRules)}
                    </span>
                  )}
                </Button>
                
                {/* Group Dropdown */}
                {showGroupDropdown && (
                  <div 
                    data-group-dropdown
                    style={{
                      position: 'fixed',
                      top: groupDropdownPosition.y,
                      left: groupDropdownPosition.x,
                      zIndex: 1000,
                      backgroundColor: 'white',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      minWidth: '300px',
                      maxWidth: '400px'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AppstoreOutlined style={{ color: '#666' }} />
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>Group</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tooltip title="Expand All Groups">
                          <Button
                            type="text"
                            size="small"
                            icon={<DownOutlined />}
                            style={{ color: '#666' }}
                            onClick={handleExpandAllGroups}
                          />
                        </Tooltip>
                        <Tooltip title="Collapse All Groups">
                          <Button
                            type="text"
                            size="small"
                            icon={<RightOutlined />}
                            style={{ color: '#666' }}
                            onClick={handleCollapseAllGroups}
                          />
                        </Tooltip>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          style={{ color: '#666' }}
                        />
                      </div>
                    </div>

                    {/* Show group rules and add option when rules exist */}
                    {groupRules.length > 0 ? (
                      <>
                        {/* Existing Group Rules */}
                        {groupRules.map((rule, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: '#f6ffed'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: '#666',
                                backgroundColor: '#e6f7ff',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                minWidth: '16px',
                                textAlign: 'center'
                              }}>
                                {getTypeLetter(columns.find(col => col.name === rule.field)?.dataType || 'text')}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{rule.field}</span>
                            </div>

                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              size="small"
                              onClick={() => handleRemoveGroupRule(index)}
                              style={{ color: '#ff4d4f' }}
                            />
                          </div>
                        ))}

                        {/* Add Group Option */}
                        <div style={{ padding: '12px 16px' }}>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setCurrentGroupField('show_field_selection');
                              setGroupFieldSearch('');
                            }}
                            style={{ width: '100%' }}
                            size="small"
                          >
                            + Add Group Option
                          </Button>
                        </div>

                        {/* Field Selection when adding new group option */}
                        {currentGroupField === 'show_field_selection' && (
                          <>
                            {/* Search Input */}
                            <div style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f0f0f0'
                            }}>
                              <Input
                                placeholder="Select Field to Group"
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={groupFieldSearch}
                                onChange={(e) => setGroupFieldSearch(e.target.value)}
                                size="small"
                                style={{ 
                                  border: '1px solid #52c41a',
                                  borderRadius: '4px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Field List */}
                            <div style={{ 
                              maxHeight: '200px',
                              overflow: 'auto'
                            }}>
                              {columns
                                .filter(column => 
                                  column.name.toLowerCase().includes(groupFieldSearch.toLowerCase()) &&
                                  !isFieldUsedInGroup(groupRules, column.name)
                                )
                                .map(column => (
                                  <div
                                    key={column._id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f0f0f0',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => handleGroupFieldSelect(column.name)}
                                    onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                                  >
                                    <span style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 'bold', 
                                      color: '#666',
                                      backgroundColor: '#e6f7ff',
                                      borderRadius: '3px',
                                      padding: '2px 6px',
                                      minWidth: '16px',
                                      textAlign: 'center'
                                    }}>
                                      {getTypeLetter(column.dataType)}
                                    </span>
                                    <span style={{ fontSize: '13px' }}>{column.name}</span>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Initial State - Show search and field list when no group rules exist */}
                        {/* Search Input */}
                        <div style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f0f0f0'
                        }}>
                          <Input
                            placeholder="Select Field to Group"
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={groupFieldSearch}
                            onChange={(e) => setGroupFieldSearch(e.target.value)}
                            size="small"
                            style={{ 
                              border: '1px solid #52c41a',
                              borderRadius: '4px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        {/* Field List */}
                        <div style={{ 
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {columns
                            .filter(column => 
                              column.name.toLowerCase().includes(groupFieldSearch.toLowerCase()) &&
                              !isFieldUsedInGroup(groupRules, column.name)
                            )
                            .map(column => (
                              <div
                                key={column._id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0',
                                  transition: 'background-color 0.2s'
                                }}
                                onClick={() => handleGroupFieldSelect(column.name)}
                                onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                              >
                                <span style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold', 
                                  color: '#666',
                                  backgroundColor: '#e6f7ff',
                                  borderRadius: '3px',
                                  padding: '2px 6px',
                                  minWidth: '16px',
                                  textAlign: 'center'
                                }}>
                                  {getTypeLetter(column.dataType)}
                                </span>
                                <span style={{ fontSize: '13px' }}>{column.name}</span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Button 
                  type="text" 
                  icon={<BarChartOutlined />}
                  size="small"
                  onClick={handleSortButtonClick}
                  data-sort-button
                  style={getSortButtonStyle(sortRules)}
                >
                  Sort
                  {isSortActive(sortRules) && (
                    <span style={getSortBadgeStyle()}>
                      {getSortRulesCount(sortRules)}
                    </span>
                  )}
                </Button>
                
                {/* Sort Dropdown */}
                {showSortDropdown && (
                  <div 
                    data-sort-dropdown
                    style={{
                      position: 'fixed',
                      top: sortDropdownPosition.y,
                      left: sortDropdownPosition.x,
                      zIndex: 1000,
                      backgroundColor: 'white',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      minWidth: '300px',
                      maxWidth: '400px'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChartOutlined style={{ color: '#666' }} />
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>Sort</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<SortAscendingOutlined />}
                          style={{ color: '#666' }}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          style={{ color: '#666' }}
                        />
                      </div>
                    </div>

                                                            {/* Show sort rules and add option when rules exist */}
                    {isSortActive(sortRules) ? (
                      <>
                        {/* Existing Sort Rules */}
                        {sortRules.map((rule, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderBottom: '1px solid #f0f0f0',
                            backgroundColor: '#fafafa'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: '#666',
                                backgroundColor: '#e6f7ff',
                                borderRadius: '3px',
                                padding: '2px 6px',
                                minWidth: '16px',
                                textAlign: 'center'
                              }}>
                                {getTypeLetter(columns.find(col => col.name === rule.field)?.dataType || 'text')}
                              </span>
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{rule.field}</span>
                            </div>
                            <Select
                              value={rule.order}
                              onChange={(value) => handleUpdateSortRule(index, rule.field, value)}
                              size="small"
                              style={{ width: '100px' }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Option value="asc">A → Z</Option>
                              <Option value="desc">Z → A</Option>
                            </Select>
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              size="small"
                              onClick={() => handleRemoveSortRule(index)}
                              style={{ color: '#ff4d4f' }}
                            />
                          </div>
                        ))}

                        {/* Add Sort Option */}
                        <div style={{ padding: '12px 16px' }}>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={() => {
                              setCurrentSortField('show_field_selection');
                              setCurrentSortOrder('asc');
                              setSortFieldSearch('');
                            }}
                            style={{ width: '100%' }}
                            size="small"
                          >
                            + Add Sort Option
                          </Button>
                        </div>

                        {/* Field Selection when adding new sort option */}
                        {currentSortField === 'show_field_selection' && (
                          <>
                            {/* Search Input */}
                            <div style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #f0f0f0'
                            }}>
                              <Input
                                placeholder="Select Field to Sort"
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={sortFieldSearch}
                                onChange={(e) => setSortFieldSearch(e.target.value)}
                                size="small"
                                style={{ 
                                  border: '1px solid #1890ff',
                                  borderRadius: '4px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Field List */}
                            <div style={{ 
                              maxHeight: '200px',
                              overflow: 'auto'
                            }}>
                              {columns
                                .filter(column => 
                                  column.name.toLowerCase().includes(sortFieldSearch.toLowerCase()) &&
                                  !sortRules.some(rule => rule.field === column.name)
                                )
                                .map(column => (
                                  <div
                                    key={column._id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f0f0f0',
                                      transition: 'background-color 0.2s'
                                    }}
                                    onClick={() => onSortFieldSelect(column.name)}
                                    onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                                  >
                                    <span style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 'bold', 
                                      color: '#666',
                                      backgroundColor: '#e6f7ff',
                                      borderRadius: '3px',
                                      padding: '2px 6px',
                                      minWidth: '16px',
                                      textAlign: 'center'
                                    }}>
                                      {getTypeLetter(column.dataType)}
                                    </span>
                                    <span style={{ fontSize: '13px' }}>{column.name}</span>
                                  </div>
                                ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Initial State - Show search and field list when no sort rules exist */}
                        {/* Search Input */}
                        <div style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f0f0f0'
                        }}>
                          <Input
                            placeholder="Select Field to Sort"
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={sortFieldSearch}
                            onChange={(e) => setSortFieldSearch(e.target.value)}
                            size="small"
                            style={{ 
                              border: '1px solid #1890ff',
                              borderRadius: '4px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        {/* Field List */}
                        <div style={{ 
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}>
                          {columns
                            .filter(column => 
                              column.name.toLowerCase().includes(sortFieldSearch.toLowerCase()) &&
                              !sortRules.some(rule => rule.field === column.name)
                            )
                            .map(column => (
                              <div
                                key={column._id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0',
                                  transition: 'background-color 0.2s'
                                }}
                                onClick={() => onSortFieldSelect(column.name)}
                                onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                              >
                                <span style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold', 
                                  color: '#666',
                                  backgroundColor: '#e6f7ff',
                                  borderRadius: '3px',
                                  padding: '2px 6px',
                                  minWidth: '16px',
                                  textAlign: 'center'
                                }}>
                                  {getTypeLetter(column.dataType)}
                                </span>
                                <span style={{ fontSize: '13px' }}>{column.name}</span>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <Button 
                type="text" 
                icon={<MoreOutlined />}
                size="small"
                style={{ color: '#666' }}
              />
            </div>
            <Button 
              type="text" 
              icon={<SearchOutlined />}
              size="small"
              style={{ color: '#666' }}
            />
          </div>

          {/* Content */}
          <div style={{ 
            background: 'transparent',
            overflow: 'auto',
            cursor: isResizing ? 'col-resize' : 'default',
            width: '100%'
          }}>
          <div style={{
            display: 'block',
            border: '1px solid #d9d9d9',
            borderTop: '1px solid #d9d9d9',
            overflow: 'auto',
            backgroundColor: 'transparent',
            userSelect: isResizing ? 'none' : 'auto',
            width: 'fit-content',
            minWidth: 'max-content',
            maxWidth: '100%',
            borderTopLeftRadius: '0',
            borderTopRightRadius: '0'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #d9d9d9',
              backgroundColor: '#fafafa'
            }}>
              {/* Checkbox and Index Column */}
              <div style={{
                width: '60px',
                minWidth: '60px',
                padding: '8px',
                borderRight: '1px solid #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                backgroundColor: '#f5f5f5'
              }}>
                <Checkbox
                  checked={selectAll}
                  onClick={() => handleSelectAll(null, records)}
                  indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < records.length}
                />
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>#</span>
              </div>

              {/* Data Columns */}
              {visibleColumns.map(column => (
                <div key={column._id} style={{
                  width: getColumnWidthString(columnWidths, column._id),
                  minWidth: '50px',
                  padding: isColumnCompact(columnWidths, column._id) ? '4px' : '8px',
                  borderRight: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isColumnCompact(columnWidths, column._id) ? 'center' : 'space-between',
                  backgroundColor: column.isSystem ? '#f6ffed' : 
                                 sortRules.some(rule => rule.field === column.name) ? '#fff2e8' : 
                                 groupRules.some(rule => rule.field === column.name) ? '#f6ffed' : '#f5f5f5',
                  position: 'relative',
                  borderTop: column.isSystem ? '2px solid #52c41a' :
                             sortRules.some(rule => rule.field === column.name) ? '2px solid #fa8c16' : 
                             groupRules.some(rule => rule.field === column.name) ? '2px solid #52c41a' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                    {isColumnCompact(columnWidths, column._id) ? (
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        color: column.isSystem ? '#52c41a' : '#666',
                        fontStyle: column.isSystem ? 'italic' : 'normal'
                      }}>
                        {getTypeLetter(column.dataType)}
                      </span>
                    ) : (
                      <>
                        {getDataTypeIcon(column.dataType)}
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: column.isSystem ? '400' : 'bold', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          color: column.isSystem ? '#52c41a' : '#333',
                          fontStyle: column.isSystem ? 'italic' : 'normal'
                        }}>
                          {column.name}
                        </span>
                        {sortRules.some(rule => rule.field === column.name) && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#fa8c16',
                            fontWeight: 'bold',
                            marginLeft: '4px'
                          }}>
                            {sortRules.find(rule => rule.field === column.name)?.order === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                        {groupRules.some(rule => rule.field === column.name) && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#52c41a',
                            fontWeight: 'bold',
                            marginLeft: '4px'
                          }}>
                            G
                          </span>
                        )}
                        {column.isSystem && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#52c41a',
                            fontWeight: 'bold',
                            marginLeft: '4px'
                          }}>
                            S
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: 'Chỉnh sửa cột',
                          icon: <EditOutlined />,
                          onClick: () => handleEditColumn(column),
                        },
                        {
                          type: 'divider',
                        },
                        {
                          key: 'delete',
                          label: 'Delete Column',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => handleDeleteColumn(column._id, column.name),
                        }
                      ]
                    }}
                    trigger={['click']}
                  >
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<MoreOutlined />} 
                      style={{ 
                        padding: isColumnCompact(columnWidths, column._id) ? '2px' : '2px',
                        fontSize: isColumnCompact(columnWidths, column._id) ? '10px' : '12px'
                      }} 
                    />
                  </Dropdown>
                  
                  {/* Resize handle */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '-3px',
                      top: 0,
                      bottom: 0,
                      width: '6px',
                      cursor: 'col-resize',
                      backgroundColor: isResizing && resizingColumn === column._id ? '#1890ff' : 'transparent',
                      zIndex: 1
                    }}
                    onMouseDown={(e) => handleResizeStart(e, column._id)}
                    onMouseEnter={(e) => {
                      if (!isResizing) {
                        e.target.style.backgroundColor = '#d9d9d9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isResizing || resizingColumn !== column._id) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  />
                </div>
              ))}

              {/* Add Column Button */}
              <div style={{
                width: '50px',
                minWidth: '50px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={() => setShowAddColumn(true)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              >
                <Tooltip title="Thêm cột">
                  <PlusOutlined 
                    style={{ 
                      color: '#1890ff', 
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }} 
                  />
                </Tooltip>
              </div>
            </div>

            {/* Table Body */}
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'visible' }}>
              {/* Grouped Records */}
              {groupedData.groups.map((group, groupIndex) => {
                const isExpanded = expandedGroups.has(group.key);
                const groupTitle = group.rules.map((rule, ruleIndex) => {
                  const column = columns.find(col => col.name === rule.field);
                  const value = group.values[ruleIndex] || '';
                  return `${rule.field}: ${value}`;
                }).join(' | ');

                return (
                  <div key={group.key} style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: '#fafafa'
                  }}>
                    {/* Group Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: isExpanded ? '1px solid #d9d9d9' : 'none',
                      backgroundColor: '#f6ffed',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleToggleGroupExpansion(group.key)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f6ffed'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        {isExpanded ? <DownOutlined /> : <RightOutlined />}
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          color: '#52c41a',
                          textTransform: 'uppercase'
                        }}>
                          {group.rules[0].field}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {group.values[0] || '(empty)'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tooltip title={`Add record to ${group.rules[0].field}: ${group.values[0] || '(empty)'}`}>
                          <Button
                            type="text"
                            size="small"
                            icon={<PlusOutlined />}
                            style={{ 
                              color: '#52c41a',
                              fontSize: '12px',
                              padding: '2px 4px',
                              minWidth: 'auto'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddRowToGroup(group.values, group.rules);
                            }}
                          />
                        </Tooltip>
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#666',
                          backgroundColor: '#e6f7ff',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          Count {group.count}
                        </span>
                      </div>
                    </div>

                    {/* Group Records */}
                    {isExpanded && group.records.map((record, index) => (
                      <div key={record._id} style={{
                        display: 'flex',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: 'white'
                      }}
                      onContextMenu={(e) => handleContextMenu(e, record._id)}
                      >
                        {/* Checkbox and Index */}
                        <div style={{
                          width: '60px',
                          minWidth: '60px',
                          padding: '8px',
                          borderRight: '1px solid #d9d9d9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          backgroundColor: '#fafafa'
                        }}>
                          <Checkbox
                            checked={selectedRowKeys.includes(record._id)}
                            onChange={(e) => handleSelectRow(record._id, e.target.checked)}
                          />
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#666', 
                            fontWeight: 'bold',
                            opacity: selectedRowKeys.includes(record._id) ? 0.3 : 1
                          }}>
                            {index + 1}
                          </span>
                        </div>

                        {/* Data Cells */}
                        {visibleColumns.map(column => {
                          let value = '';
                          if (column.isSystem) {
                            // Handle system fields
                            switch (column.name) {
                              case 'Id':
                                value = record._id || '';
                                break;
                              case 'CreatedAt':
                                value = record.createdAt ? formatDateTime(record.createdAt) : '';
                                break;
                              case 'UpdatedAt':
                                value = record.updatedAt ? formatDateTime(record.updatedAt) : '';
                                break;
                              default:
                                value = '';
                            }
                          } else {
                            value = record.data?.[column.name] || '';
                          }
                          const isEditing = isCellEditing(editingCell, record._id, column.name);
                          
                          return (
                            <div key={column._id} style={{
                              width: getColumnWidthString(columnWidths, column._id),
                              minWidth: '50px',
                              padding: '0',
                              borderRight: '1px solid #d9d9d9',
                              position: 'relative',
                              minHeight: '40px'
                            }}>
                              {isEditing ? (
                                (() => {
                                  const dataType = column.dataType;
                                  
                                  if (dataType === 'date') {
                                    // Format date for display and input
                                    // Use utility function for date input formatting

                                    return (
                                      <Input
                                        type="date"
                                        value={formatDateForInput(cellValue)}
                                        onChange={(e) => setCellValue(e.target.value)}
                                        onPressEnter={handleCellSave}
                                        onBlur={handleCellSave}
                                        autoFocus
                                        size="small"
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          border: 'none',
                                          padding: '0',
                                          margin: '0',
                                          borderRadius: '0',
                                          backgroundColor: 'transparent',
                                          boxShadow: 'none',
                                          fontSize: 'inherit',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box',
                                          outline: 'none'
                                        }}
                                      />
                                    );
                                  } else if (dataType === 'number') {
                                    return (
                                      <Input
                                        type="number"
                                        value={cellValue}
                                        onChange={(e) => setCellValue(e.target.value)}
                                        onPressEnter={handleCellSave}
                                        onBlur={handleCellSave}
                                        autoFocus
                                        size="small"
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          border: 'none',
                                          padding: '0',
                                          margin: '0',
                                          borderRadius: '0',
                                          backgroundColor: 'transparent',
                                          boxShadow: 'none',
                                          fontSize: 'inherit',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box',
                                          outline: 'none'
                                        }}
                                      />
                                    );
                                  } else if (dataType === 'currency') {
                                    return (
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={cellValue}
                                        onChange={(e) => setCellValue(e.target.value)}
                                        onPressEnter={handleCellSave}
                                        onBlur={handleCellSave}
                                        autoFocus
                                        size="small"
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          border: 'none',
                                          padding: '0',
                                          margin: '0',
                                          borderRadius: '0',
                                          backgroundColor: 'transparent',
                                          boxShadow: 'none',
                                          fontSize: 'inherit',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box',
                                          outline: 'none'
                                        }}
                                      />
                                    );
                                  } else if (dataType === 'checkbox') {
                                    return (
                                      <Select
                                        value={cellValue}
                                        onChange={(value) => {
                                          setCellValue(value);
                                          handleCellSave();
                                        }}
                                        autoFocus
                                        size="small"
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          border: 'none',
                                          padding: '0',
                                          margin: '0',
                                          borderRadius: '0',
                                          backgroundColor: 'transparent',
                                          boxShadow: 'none',
                                          fontSize: 'inherit',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box',
                                          outline: 'none'
                                        }}
                                      >
                                        <Option value="true">True</Option>
                                        <Option value="false">False</Option>
                                      </Select>
                                    );
                                  } else if (dataType === 'single_select') {
                                    const config = column.singleSelectConfig || { options: [] };
                                    return (
                                      <div 
                                        data-multiselect-container
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box'
                                        }}>
                                        {/* Input Field with Tag Display */}
                                        <div
                                          style={{
                                            border: '1px solid #1890ff',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            backgroundColor: 'white',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '4px',
                                            boxSizing: 'border-box'
                                          }}
                                        >
                                          {cellValue ? (
                                            <Tag
                                              closable
                                              onClose={(e) => {
                                                e.stopPropagation();
                                                console.log('Clearing single select value');
                                                setCellValue('');
                                                
                                                // Save the record with empty value
                                                if (editingCell) {
                                                  const record = records.find(r => r._id === editingCell.recordId);
                                                  if (record) {
                                                    const updatedData = { ...record.data };
                                                    updatedData[editingCell.columnName] = '';
                                                    
                                                    console.log('Saving record with cleared data:', updatedData);
                                                    updateRecordMutation.mutate({
                                                      recordId: editingCell.recordId,
                                                      data: updatedData
                                                    });
                                                  }
                                                }
                                              }}
                                              style={{
                                                backgroundColor: '#e6f7ff',
                                                border: '1px solid #91d5ff',
                                                color: '#1890ff',
                                                borderRadius: '4px',
                                                margin: 0,
                                                fontSize: '12px'
                                              }}
                                            >
                                              {cellValue}
                                            </Tag>
                                          ) : (
                                            <span style={{ color: '#bfbfbf', fontSize: '12px' }}>Select option</span>
                                          )}
                                        </div>

                                        {/* Dropdown Options */}
                                        <div
                                          data-multiselect-dropdown
                                          style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflow: 'auto',
                                            marginTop: '4px'
                                          }}
                                        >
                                          {config.options.map((option, index) => (
                                            <div
                                              key={index}
                                              style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderBottom: index < config.options.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                transition: 'background-color 0.2s'
                                              }}
                                              onClick={() => {
                                                console.log('Single select option clicked:', option);
                                                console.log('Current cellValue:', cellValue);
                                                console.log('Current editingCell:', editingCell);
                                                
                                                // Update cellValue and save immediately
                                                setCellValue(option);
                                                
                                                // Save the record with the new value
                                                if (editingCell) {
                                                  const record = records.find(r => r._id === editingCell.recordId);
                                                  if (record) {
                                                    const updatedData = { ...record.data };
                                                    updatedData[editingCell.columnName] = option;
                                                    
                                                    console.log('Saving record with data:', updatedData);
                                                    updateRecordMutation.mutate({
                                                      recordId: editingCell.recordId,
                                                      data: updatedData
                                                    });
                                                  }
                                                }
                                              }}
                                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                              <Tag
                                                style={{
                                                  backgroundColor: '#e6f7ff',
                                                  border: '1px solid #91d5ff',
                                                  color: '#1890ff',
                                                  borderRadius: '4px',
                                                  margin: 0,
                                                  fontSize: '12px'
                                                }}
                                              >
                                                {option}
                                              </Tag>
                                            </div>
                                          ))}
                                          {config.options.length > 0 && (
                                            <div style={{
                                              padding: '4px 8px',
                                              backgroundColor: '#f6ffed',
                                              borderBottom: '1px solid #b7eb8f',
                                              fontSize: '11px',
                                              color: '#52c41a',
                                              textAlign: 'center'
                                            }}>
                                              ✓ Select multiple options • Click outside to close
                                            </div>
                                          )}
                                          {config.options.length === 0 && (
                                            <div style={{
                                              padding: '8px 12px',
                                              color: '#bfbfbf',
                                              textAlign: 'center',
                                              fontSize: '12px'
                                            }}>
                                              No options available
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  } else if (dataType === 'multi_select') {
                                    const config = column.multiSelectConfig || { options: [] };
                                    const currentValues = Array.isArray(cellValue) ? cellValue : [];
                                    
                                    return (
                                      <div 
                                        data-multiselect-container
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box'
                                        }}>
                                        {/* Input Field with Tags Display */}
                                        <div
                                          style={{
                                            border: '1px solid #722ed1',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            backgroundColor: 'white',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '4px',
                                            boxSizing: 'border-box',
                                            overflow: 'auto'
                                          }}
                                        >
                                          {currentValues.length > 0 ? (
                                            currentValues.map((val, index) => (
                                              <Tag
                                                key={index}
                                                closable
                                                onClose={(e) => {
                                                  e.stopPropagation();
                                                  console.log('Removing multi-select value:', val);
                                                  const updatedValues = currentValues.filter(v => v !== val);
                                                  setCellValue(updatedValues);
                                                  
                                                  // Save the record with updated values
                                                  if (editingCell) {
                                                    const record = records.find(r => r._id === editingCell.recordId);
                                                    if (record) {
                                                      const updatedData = { ...record.data };
                                                      updatedData[editingCell.columnName] = updatedValues;
                                                      
                                                      console.log('Saving record with updated multi-select data:', updatedData);
                                                      updateRecordMutation.mutate({
                                                        recordId: editingCell.recordId,
                                                        data: updatedData
                                                      });
                                                    }
                                                  }
                                                }}
                                                style={{
                                                  backgroundColor: '#f9f0ff',
                                                  border: '1px solid #d3adf7',
                                                  color: '#722ed1',
                                                  borderRadius: '4px',
                                                  margin: 0,
                                                  fontSize: '11px'
                                                }}
                                              >
                                                {val}
                                              </Tag>
                                            ))
                                          ) : (
                                            <span style={{ color: '#bfbfbf', fontSize: '12px' }}>Select options</span>
                                          )}
                                        </div>

                                        {/* Dropdown Options */}
                                        <div
                                          data-multiselect-dropdown
                                          style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            border: '1px solid #d9d9d9',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                            zIndex: 1000,
                                            maxHeight: '200px',
                                            overflow: 'auto',
                                            marginTop: '4px'
                                          }}
                                        >
                                          {config.options.map((option, index) => (
                                            <div
                                              key={index}
                                              style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderBottom: index < config.options.length - 1 ? '1px solid #f0f0f0' : 'none',
                                                transition: 'background-color 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                              }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Multi-select option clicked:', option);
                                                const isSelected = currentValues.includes(option);
                                                let updatedValues;
                                                
                                                if (isSelected) {
                                                  // Remove option if already selected
                                                  updatedValues = currentValues.filter(v => v !== option);
                                                                                          } else {
                                            // Add option if not selected
                                            updatedValues = [...currentValues, option];
                                          }
                                                
                                                setCellValue(updatedValues);
                                                
                                                // Save the record with the new values
                                                if (editingCell) {
                                                  const record = records.find(r => r._id === editingCell.recordId);
                                                  if (record) {
                                                    const updatedData = { ...record.data };
                                                    updatedData[editingCell.columnName] = updatedValues;
                                                    
                                                    console.log('Saving record with multi-select data:', updatedData);
                                                    updateRecordMutation.mutate({
                                                      recordId: editingCell.recordId,
                                                      data: updatedData
                                                    });
                                                  }
                                                }
                                              }}
                                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                              <Checkbox
                                                checked={currentValues.includes(option)}
                                                style={{ marginRight: '8px' }}
                                              />
                                              <Tag
                                                style={{
                                                  backgroundColor: currentValues.includes(option) ? '#f9f0ff' : '#f5f5f5',
                                                  border: currentValues.includes(option) ? '1px solid #d3adf7' : '1px solid #d9d9d9',
                                                  color: currentValues.includes(option) ? '#722ed1' : '#666',
                                                  borderRadius: '4px',
                                                  margin: 0,
                                                  fontSize: '12px'
                                                }}
                                              >
                                                {option}
                                              </Tag>
                                            </div>
                                          ))}
                                          {config.options.length > 0 && (
                                            <div style={{
                                              padding: '4px 8px',
                                              backgroundColor: '#f6ffed',
                                              borderBottom: '1px solid #b7eb8f',
                                              fontSize: '11px',
                                              color: '#52c41a',
                                              textAlign: 'center'
                                            }}>
                                              ✓ Select multiple options • Click outside to close
                                            </div>
                                          )}
                                          {config.options.length === 0 && (
                                            <div style={{
                                              padding: '8px 12px',
                                              color: '#bfbfbf',
                                              textAlign: 'center',
                                              fontSize: '12px'
                                            }}>
                                              No options available
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <Input
                                        value={cellValue}
                                        onChange={(e) => setCellValue(e.target.value)}
                                        onPressEnter={handleCellSave}
                                        onBlur={handleCellSave}
                                        autoFocus
                                        size="small"
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          border: 'none',
                                          padding: '0',
                                          margin: '0',
                                          borderRadius: '0',
                                          backgroundColor: 'transparent',
                                          boxShadow: 'none',
                                          fontSize: 'inherit',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box',
                                          outline: 'none'
                                        }}
                                      />
                                    );
                                  }
                                })()
                              ) : (
                                <div
                                  style={{ 
                                    cursor: column.isSystem || column.dataType === 'checkbox' ? 'default' : 'pointer', 
                                    padding: '8px', 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: '12px',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    boxSizing: 'border-box',
                                    backgroundColor: column.isSystem ? '#fafafa' : 'transparent',
                                    color: column.isSystem ? '#666' : '#333',
                                    fontStyle: column.isSystem ? 'italic' : 'normal'
                                  }}
                                  onClick={column.isSystem || column.dataType === 'checkbox' ? undefined : () => handleCellClick(record._id, column.name, value)}
                                                                      onMouseEnter={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  {column.dataType === 'datetime' && value ? 
                                    value // Already formatted by formatDateTime
                                    : column.dataType === 'date' && value ? 
                                    (() => {
                                      try {
                                        const date = new Date(value);
                                        return formatDateForDisplay(value, column.dateConfig?.format || 'DD/MM/YYYY');
                                      } catch {
                                        return value;
                                      }
                                    })() 
                                    : column.dataType === 'checkbox' ? 
                                    (() => {
                                      const isChecked = value === 'true' || value === true;
                                      const config = column.checkboxConfig || { icon: 'check-circle', color: '#52c41a', defaultValue: false };
                                      
                                      return (
                                        <div style={{ 
                                          display: 'flex', 
                                          justifyContent: 'center', 
                                          alignItems: 'center',
                                          height: '100%',
                                          width: '100%'
                                        }}>
                                          <div
                                            onClick={() => {
                                              const newValue = !isChecked;
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = newValue;
                                              
                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            style={{
                                              cursor: 'pointer',
                                              fontSize: '16px',
                                              color: isChecked ? config.color : '#666',
                                              transition: 'all 0.2s ease'
                                            }}
                                          >
                                            {isChecked ? (
                                              config.icon === 'check-circle' ? 
                                                <CheckCircleOutlined style={{ color: config.color, fontSize: '16px' }} /> :
                                                <CheckSquareOutlined style={{ color: config.color, fontSize: '16px' }} />
                                            ) : (
                                              config.icon === 'check-circle' ? 
                                                <BorderOutlined style={{ color: '#666', fontSize: '16px' }} /> :
                                                <BorderOutlined style={{ color: '#666', fontSize: '16px' }} />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })() 
                                    : column.dataType === 'single_select' ? 
                                    (() => {
                                      const config = column.singleSelectConfig || { options: [] };
                                      // Use actual value or default if empty  
                                      let displayValue = value;
                                      if (!displayValue && config.defaultValue) {
                                        displayValue = config.defaultValue;
                                      }
                                      const selectedOption = config.options.find(option => option === displayValue) || displayValue;
                                      
                                      console.log('Single-select debug:', {
                                        columnName: column.name,
                                        rawValue: value,
                                        displayValue,
                                        selectedOption,
                                        config,
                                        usingDefault: displayValue === config.defaultValue
                                      });
                                      
                                      return (
                                        <div style={{ 
                                          display: 'flex', 
                                          justifyContent: 'center', 
                                          alignItems: 'center',
                                          height: '100%',
                                          width: '100%'
                                        }}>
                                          {selectedOption ? (
                                            <Tag
                                              closable
                                              onClose={(e) => {
                                                e.stopPropagation();
                                                console.log('Clearing single select value (display)');
                                                
                                                // Save the record with empty value
                                                const updatedData = { ...record.data };
                                                updatedData[column.name] = '';
                                                
                                                console.log('Saving record with cleared data (display):', updatedData);
                                                updateRecordMutation.mutate({
                                                  recordId: record._id,
                                                  data: updatedData
                                                });
                                              }}
                                              style={{
                                                backgroundColor: '#e6f7ff',
                                                border: '1px solid #91d5ff',
                                                color: '#1890ff',
                                                borderRadius: '4px',
                                                margin: 0,
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                              }}
                                              onClick={() => handleCellClick(record._id, column.name, value)}
                                            >
                                              {selectedOption}
                                            </Tag>
                                          ) : (
                                            <div
                                              onClick={() => handleCellClick(record._id, column.name, value)}
                                              style={{
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                color: '#bfbfbf',
                                                backgroundColor: '#fafafa',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #d9d9d9',
                                                transition: 'all 0.2s ease'
                                              }}
                                            >
                                              Select option
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })() 
                                    : column.dataType === 'multi_select' ? 
                                    (() => {
                                      const config = column.multiSelectConfig || { options: [] };
                                      // Use actual value or default if empty
                                      let selectedValues = Array.isArray(value) ? value : [];
                                      
                                      // If no values and we have defaults, use defaults for display
                                      if (selectedValues.length === 0 && config.defaultValue && config.defaultValue.length > 0) {
                                        selectedValues = config.defaultValue;
                                      }
                                      
                                      console.log('Multi-select debug:', { 
                                        columnName: column.name, 
                                        rawValue: value, 
                                        selectedValues, 
                                        config: config,
                                        usingDefaults: selectedValues === config.defaultValue
                                      });
                                      
                                      return (
                                        <div style={{ 
                                          display: 'flex', 
                                          justifyContent: 'center', 
                                          alignItems: 'center',
                                          height: '100%',
                                          width: '100%',
                                          flexWrap: 'wrap',
                                          gap: '4px',
                                          padding: '4px'
                                        }}>
                                          {selectedValues.length > 0 ? (
                                            selectedValues.map((val, index) => {
                                              const option = config.options.find(option => option === val) || val;
                                              return (
                                                <Tag
                                                  key={index}
                                                  closable
                                                  onClose={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Removing multi-select value:', val);
                                                    
                                                    // Remove the value from the array
                                                    const updatedValues = selectedValues.filter(v => v !== val);
                                                    const updatedData = { ...record.data };
                                                    updatedData[column.name] = updatedValues;
                                                    
                                                    console.log('Saving record with updated multi-select data:', updatedData);
                                                    updateRecordMutation.mutate({
                                                      recordId: record._id,
                                                      data: updatedData
                                                    });
                                                  }}
                                                  style={{
                                                    backgroundColor: '#f6ffed',
                                                    border: '1px solid #b7eb8f',
                                                    color: '#52c41a',
                                                    borderRadius: '4px',
                                                    margin: 0,
                                                    cursor: 'pointer',
                                                    fontSize: '11px'
                                                  }}
                                                  onClick={() => handleCellClick(record._id, column.name, value)}
                                                >
                                                  {option}
                                                </Tag>
                                              );
                                            })
                                          ) : (
                                            <div
                                              onClick={() => handleCellClick(record._id, column.name, value)}
                                              style={{
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                color: '#bfbfbf',
                                                backgroundColor: '#fafafa',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #d9d9d9',
                                                transition: 'all 0.2s ease'
                                              }}
                                            >
                                              Select options
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })() 
                                    : column.dataType === 'currency' && value !== null && value !== undefined ? 
                                    (() => {
                                      const config = column.currencyConfig || { 
                                        currency: 'USD', 
                                        symbol: '$', 
                                        position: 'before', 
                                        decimalPlaces: 2, 
                                        thousandsSeparator: ',', 
                                        decimalSeparator: '.' 
                                      };
                                      
                                      const numValue = parseFloat(value);
                                      if (isNaN(numValue)) return value;
                                      
                                      const formatted = numValue.toLocaleString('en-US', {
                                        minimumFractionDigits: config.decimalPlaces,
                                        maximumFractionDigits: config.decimalPlaces
                                      }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);
                                      
                                      return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
                                    })()
                                    : (value || '')
                                  }
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Empty cell for alignment */}
                        <div style={{
                          width: '50px',
                          minWidth: '50px',
                          padding: '8px'
                        }} />
                      </div>
                    ))}

                    {/* Add New Record to Group */}
                    {isExpanded && (
                      <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #d9d9d9',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => handleAddRowToGroup(group.values, group.rules)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                      >
                        {/* Checkbox and Index Column */}
                        <div style={{
                          width: '60px',
                          minWidth: '60px',
                          padding: '8px',
                          borderRight: '1px solid #d9d9d9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PlusOutlined 
                            style={{ 
                              color: '#52c41a', 
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }} 
                          />
                        </div>

                        {/* Data Columns */}
                        {visibleColumns.map(column => (
                          <div key={column._id} style={{
                            width: getColumnWidthString(columnWidths, column._id),
                            minWidth: '50px',
                            padding: '8px',
                            borderRight: '1px solid #d9d9d9'
                          }} />
                        ))}

                        {/* Empty cell for alignment */}
                        <div style={{
                          width: '50px',
                          minWidth: '50px',
                          padding: '8px'
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped Records */}
              {groupedData.ungroupedRecords.map((record, index) => (
                <div key={record._id} style={{
                  display: 'flex',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onContextMenu={(e) => handleContextMenu(e, record._id)}
                >
                  {/* Checkbox and Index */}
                  <div style={{
                    width: '60px',
                    minWidth: '60px',
                    padding: '8px',
                    borderRight: '1px solid #d9d9d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <Checkbox
                      checked={selectedRowKeys.includes(record._id)}
                      onChange={(e) => handleSelectRow(record._id, e.target.checked)}
                    />
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      fontWeight: 'bold',
                      opacity: selectedRowKeys.includes(record._id) ? 0.3 : 1
                    }}>
                      {index + 1}
                    </span>
                  </div>

                  {/* Data Cells */}
                  {visibleColumns.map(column => {
                    let value = '';
                    if (column.isSystem) {
                      // Handle system fields
                      switch (column.name) {
                        case 'Id':
                          value = record._id || '';
                          break;
                        case 'CreatedAt':
                          value = record.createdAt ? formatDateTime(record.createdAt) : '';
                          break;
                        case 'UpdatedAt':
                          value = record.updatedAt ? formatDateTime(record.updatedAt) : '';
                          break;
                        default:
                          value = '';
                      }
                    } else {
                      value = record.data?.[column.name] || '';
                    }
                    const isEditing = editingCell?.recordId === record._id && editingCell?.columnName === column.name;
                    
                    return (
                      <div key={column._id} style={{
                        width: getColumnWidthString(columnWidths, column._id),
                        minWidth: '50px',
                        padding: '0',
                        borderRight: '1px solid #d9d9d9',
                        position: 'relative',
                        minHeight: '40px'
                      }}>
                        {isEditing ? (
                          (() => {
                            const dataType = column.dataType;
                            
                            if (dataType === 'date') {
                              // Format date for display and input
                              // Use utility function for date input formatting

                              return (
                                <Input
                                  type="date"
                                  value={formatDateForInput(cellValue)}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onPressEnter={handleCellSave}
                                  onBlur={handleCellSave}
                                  autoFocus
                                  size="small"
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0',
                                    borderRadius: '0',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    fontSize: 'inherit',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                  }}
                                />
                              );
                            } else if (dataType === 'number') {
                              return (
                                <Input
                                  type="number"
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onPressEnter={handleCellSave}
                                  onBlur={handleCellSave}
                                  autoFocus
                                  size="small"
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0',
                                    borderRadius: '0',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    fontSize: 'inherit',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                  }}
                                />
                              );
                            } else if (dataType === 'currency') {
                              return (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onPressEnter={handleCellSave}
                                  onBlur={handleCellSave}
                                  autoFocus
                                  size="small"
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0',
                                    borderRadius: '0',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    fontSize: 'inherit',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                  }}
                                />
                              );
                            } else if (dataType === 'checkbox') {
                              return (
                                <Select
                                  value={cellValue}
                                  onChange={(value) => {
                                    setCellValue(value);
                                    handleCellSave();
                                  }}
                                  autoFocus
                                  size="small"
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0',
                                    borderRadius: '0',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    fontSize: 'inherit',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                  }}
                                >
                                  <Option value="true">True</Option>
                                  <Option value="false">False</Option>
                                </Select>
                              );
                            } else if (dataType === 'single_select') {
                              const config = column.singleSelectConfig || { options: [] };
                              return (
                                      <div 
                                        data-multiselect-container
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box'
                                        }}>
                                  {/* Input Field with Tag Display */}
                                  <div
                                    style={{
                                      border: '1px solid #1890ff',
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      backgroundColor: 'white',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      gap: '4px',
                                      boxSizing: 'border-box'
                                    }}
                                  >
                                    {cellValue ? (
                                      <Tag
                                        style={{
                                          backgroundColor: '#e6f7ff',
                                          border: '1px solid #91d5ff',
                                          color: '#1890ff',
                                          borderRadius: '4px',
                                          margin: 0,
                                          fontSize: '12px'
                                        }}
                                      >
                                        {cellValue}
                                      </Tag>
                                    ) : (
                                      <span style={{ color: '#bfbfbf', fontSize: '12px' }}>Select option</span>
                                    )}
                                  </div>

                                  {/* Dropdown Options */}
                                        <div
                                          data-multiselect-dropdown
                                          style={{
                                            position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      backgroundColor: 'white',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                      zIndex: 1000,
                                      maxHeight: '200px',
                                      overflow: 'auto',
                                      marginTop: '4px'
                                    }}
                                  >
                                    {config.options.map((option, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          borderBottom: index < config.options.length - 1 ? '1px solid #f0f0f0' : 'none',
                                          transition: 'background-color 0.2s'
                                        }}
                                        onClick={() => {
                                          console.log('Single select option clicked (ungrouped):', option);
                                          console.log('Current cellValue:', cellValue);
                                          console.log('Current editingCell:', editingCell);
                                          
                                          // Update cellValue and save immediately
                                          setCellValue(option);
                                          
                                          // Save the record with the new value
                                          if (editingCell) {
                                            const record = records.find(r => r._id === editingCell.recordId);
                                            if (record) {
                                              const updatedData = { ...record.data };
                                              updatedData[editingCell.columnName] = option;
                                              
                                              console.log('Saving record with data (ungrouped):', updatedData);
                                              updateRecordMutation.mutate({
                                                recordId: editingCell.recordId,
                                                data: updatedData
                                              });
                                            }
                                          }
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                      >
                                        <Tag
                                          style={{
                                            backgroundColor: '#e6f7ff',
                                            border: '1px solid #91d5ff',
                                            color: '#1890ff',
                                            borderRadius: '4px',
                                            margin: 0,
                                            fontSize: '12px'
                                          }}
                                        >
                                          {option}
                                        </Tag>
                                      </div>
                                    ))}
                                    {config.options.length === 0 && (
                                      <div style={{
                                        padding: '8px 12px',
                                        color: '#bfbfbf',
                                        textAlign: 'center',
                                        fontSize: '12px'
                                      }}>
                                        No options available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            } else if (dataType === 'multi_select') {
                              const config = column.multiSelectConfig || { options: [] };
                              const currentValues = Array.isArray(cellValue) ? cellValue : [];
                              
                              return (
                                      <div 
                                        data-multiselect-container
                                        style={{ 
                                          width: '100%',
                                          height: '100%',
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          right: '0',
                                          bottom: '0',
                                          boxSizing: 'border-box'
                                        }}>
                                  {/* Input Field with Tags Display */}
                                  <div
                                    style={{
                                      border: '1px solid #722ed1',
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      backgroundColor: 'white',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      flexWrap: 'wrap',
                                      gap: '4px',
                                      boxSizing: 'border-box',
                                      overflow: 'auto'
                                    }}
                                  >
                                    {currentValues.length > 0 ? (
                                      currentValues.map((val, index) => (
                                        <Tag
                                          key={index}
                                          closable
                                          onClose={(e) => {
                                            e.stopPropagation();
                                            console.log('Removing multi-select value (ungrouped):', val);
                                            const updatedValues = currentValues.filter(v => v !== val);
                                            setCellValue(updatedValues);
                                            
                                            // Save the record with updated values
                                            if (editingCell) {
                                              const record = records.find(r => r._id === editingCell.recordId);
                                              if (record) {
                                                const updatedData = { ...record.data };
                                                updatedData[editingCell.columnName] = updatedValues;
                                                
                                                console.log('Saving record with updated multi-select data (ungrouped):', updatedData);
                                                updateRecordMutation.mutate({
                                                  recordId: editingCell.recordId,
                                                  data: updatedData
                                                });
                                              }
                                            }
                                          }}
                                          style={{
                                            backgroundColor: '#f9f0ff',
                                            border: '1px solid #d3adf7',
                                            color: '#722ed1',
                                            borderRadius: '4px',
                                            margin: 0,
                                            fontSize: '11px'
                                          }}
                                        >
                                          {val}
                                        </Tag>
                                      ))
                                    ) : (
                                      <span style={{ color: '#bfbfbf', fontSize: '12px' }}>Select options</span>
                                    )}
                                  </div>

                                  {/* Dropdown Options */}
                                        <div
                                          data-multiselect-dropdown
                                          style={{
                                            position: 'absolute',
                                      top: '100%',
                                      left: 0,
                                      right: 0,
                                      backgroundColor: 'white',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '6px',
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                      zIndex: 1000,
                                      maxHeight: '200px',
                                      overflow: 'auto',
                                      marginTop: '4px'
                                    }}
                                  >
                                    {config.options.map((option, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          borderBottom: index < config.options.length - 1 ? '1px solid #f0f0f0' : 'none',
                                          transition: 'background-color 0.2s',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('Multi-select option clicked (ungrouped):', option);
                                          const isSelected = currentValues.includes(option);
                                          let updatedValues;
                                          
                                          if (isSelected) {
                                            // Remove option if already selected
                                            updatedValues = currentValues.filter(v => v !== option);
                                          } else {
                                            // Add option if not selected
                                            updatedValues = [...currentValues, option];
                                          }
                                          
                                          setCellValue(updatedValues);
                                          
                                          // Save the record with the new values
                                          if (editingCell) {
                                            const record = records.find(r => r._id === editingCell.recordId);
                                            if (record) {
                                              const updatedData = { ...record.data };
                                              updatedData[editingCell.columnName] = updatedValues;
                                              
                                              console.log('Saving record with multi-select data (ungrouped):', updatedData);
                                              updateRecordMutation.mutate({
                                                recordId: editingCell.recordId,
                                                data: updatedData
                                              });
                                            }
                                          }
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                      >
                                        <Checkbox
                                          checked={currentValues.includes(option)}
                                          style={{ marginRight: '8px' }}
                                        />
                                        <Tag
                                          style={{
                                            backgroundColor: currentValues.includes(option) ? '#f9f0ff' : '#f5f5f5',
                                            border: currentValues.includes(option) ? '1px solid #d3adf7' : '1px solid #d9d9d9',
                                            color: currentValues.includes(option) ? '#722ed1' : '#666',
                                            borderRadius: '4px',
                                            margin: 0,
                                            fontSize: '12px'
                                          }}
                                        >
                                          {option}
                                        </Tag>
                                      </div>
                                    ))}
                                    {config.options.length === 0 && (
                                      <div style={{
                                        padding: '8px 12px',
                                        color: '#bfbfbf',
                                        textAlign: 'center',
                                        fontSize: '12px'
                                      }}>
                                        No options available
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <Input
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onPressEnter={handleCellSave}
                                  onBlur={handleCellSave}
                                  autoFocus
                                  size="small"
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    padding: '0',
                                    margin: '0',
                                    borderRadius: '0',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    fontSize: 'inherit',
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    boxSizing: 'border-box',
                                    outline: 'none'
                                  }}
                                />
                              );
                            }
                          })()
                        ) : (
                          <div
                                                              style={{ 
                                    cursor: column.isSystem || column.dataType === 'checkbox' ? 'default' : 'pointer',  
                              padding: '8px', 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '12px',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              boxSizing: 'border-box',
                              backgroundColor: column.isSystem ? '#fafafa' : 'transparent',
                              color: column.isSystem ? '#666' : '#333',
                              fontStyle: column.isSystem ? 'italic' : 'normal'
                            }}
                            onClick={column.isSystem || column.dataType === 'checkbox' ? undefined : () => handleCellClick(record._id, column.name, value)}
                                                          onMouseEnter={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {column.dataType === 'datetime' && value ? 
                              value // Already formatted by formatDateTime
                              : column.dataType === 'date' && value ? 
                              (() => {
                                try {
                                  const date = new Date(value);
                                  return formatDateForDisplay(value, column.dateConfig?.format || 'DD/MM/YYYY');
                                } catch {
                                  return value;
                                }
                              })() 
                              : column.dataType === 'checkbox' ? 
                              (() => {
                                const isChecked = value === 'true' || value === true;
                                const config = column.checkboxConfig || { icon: 'check-circle', color: '#52c41a', defaultValue: false };
                                
                                return (
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    height: '100%',
                                    width: '100%'
                                  }}>
                                    <div
                                      onClick={() => {
                                        const newValue = !isChecked;
                                        const updatedData = { ...record.data };
                                        updatedData[column.name] = newValue;
                                        
                                        updateRecordMutation.mutate({
                                          recordId: record._id,
                                          data: updatedData
                                        });
                                      }}
                                      style={{
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        color: isChecked ? config.color : '#666',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {isChecked ? (
                                        config.icon === 'check-circle' ? 
                                          <CheckCircleOutlined style={{ color: config.color, fontSize: '16px' }} /> :
                                          <CheckSquareOutlined style={{ color: config.color, fontSize: '16px' }} />
                                      ) : (
                                        config.icon === 'check-circle' ? 
                                          <BorderOutlined style={{ color: '#666', fontSize: '16px' }} /> :
                                          <BorderOutlined style={{ color: '#666', fontSize: '16px' }} />
                                      )}
                                    </div>
                                  </div>
                                );
                              })() 
                              : column.dataType === 'single_select' ? 
                              (() => {
                                const config = column.singleSelectConfig || { options: [] };
                                // Use actual value or default if empty  
                                      let displayValue = value;
                                      if (!displayValue && config.defaultValue) {
                                        displayValue = config.defaultValue;
                                      }
                                      const selectedOption = config.options.find(option => option === displayValue) || displayValue;
                                      
                                      console.log('Single-select debug:', {
                                        columnName: column.name,
                                        rawValue: value,
                                        displayValue,
                                        selectedOption,
                                        config,
                                        usingDefault: displayValue === config.defaultValue
                                      });
                                
                                return (
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    height: '100%',
                                    width: '100%'
                                  }}>
                                    {selectedOption ? (
                                      <Tag
                                        closable
                                        onClose={(e) => {
                                          e.stopPropagation();
                                          console.log('Clearing single select value (ungrouped display)');
                                          
                                          // Save the record with empty value
                                          const updatedData = { ...record.data };
                                          updatedData[column.name] = '';
                                          
                                          console.log('Saving record with cleared data (ungrouped display):', updatedData);
                                          updateRecordMutation.mutate({
                                            recordId: record._id,
                                            data: updatedData
                                          });
                                        }}
                                        style={{
                                          backgroundColor: '#e6f7ff',
                                          border: '1px solid #91d5ff',
                                          color: '#1890ff',
                                          borderRadius: '4px',
                                          margin: 0,
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                        onClick={() => handleCellClick(record._id, column.name, value)}
                                      >
                                        {selectedOption}
                                      </Tag>
                                    ) : (
                                      <div
                                        onClick={() => handleCellClick(record._id, column.name, value)}
                                        style={{
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          color: '#bfbfbf',
                                          backgroundColor: '#fafafa',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          border: '1px solid #d9d9d9',
                                          transition: 'all 0.2s ease'
                                        }}
                                      >
                                        Select option
                                      </div>
                                    )}
                                  </div>
                                );
                              })() 
                              : column.dataType === 'multi_select' ? 
                              (() => {
                                const config = column.multiSelectConfig || { options: [] };
                                // Use actual value or default if empty
                                      let selectedValues = Array.isArray(value) ? value : [];
                                      
                                      // If no values and we have defaults, use defaults for display
                                      if (selectedValues.length === 0 && config.defaultValue && config.defaultValue.length > 0) {
                                        selectedValues = config.defaultValue;
                                      }
                                      
                                      console.log('Multi-select debug:', { 
                                        columnName: column.name, 
                                        rawValue: value, 
                                        selectedValues, 
                                        config: config,
                                        usingDefaults: selectedValues === config.defaultValue
                                      });
                                
                                return (
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    height: '100%',
                                    width: '100%',
                                    flexWrap: 'wrap',
                                    gap: '4px',
                                    padding: '4px'
                                  }}>
                                    {selectedValues.length > 0 ? (
                                      selectedValues.map((val, index) => {
                                        const option = config.options.find(option => option === val) || val;
                                        return (
                                          <Tag
                                            key={index}
                                            closable
                                            onClose={(e) => {
                                              e.stopPropagation();
                                              console.log('Removing multi-select value (ungrouped):', val);
                                              
                                              // Remove the value from the array
                                              const updatedValues = selectedValues.filter(v => v !== val);
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = updatedValues;
                                              
                                              console.log('Saving record with updated multi-select data (ungrouped):', updatedData);
                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            style={{
                                              backgroundColor: '#f6ffed',
                                              border: '1px solid #b7eb8f',
                                              color: '#52c41a',
                                              borderRadius: '4px',
                                              margin: 0,
                                              cursor: 'pointer',
                                              fontSize: '11px'
                                            }}
                                            onClick={() => handleCellClick(record._id, column.name, value)}
                                          >
                                            {option}
                                          </Tag>
                                        );
                                      })
                                    ) : (
                                      <div
                                        onClick={() => handleCellClick(record._id, column.name, value)}
                                        style={{
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          color: '#bfbfbf',
                                          backgroundColor: '#fafafa',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          border: '1px solid #d9d9d9',
                                          transition: 'all 0.2s ease'
                                        }}
                                      >
                                        Select options
                                      </div>
                                    )}
                                  </div>
                                );
                              })() 
                              : column.dataType === 'currency' && value !== null && value !== undefined ? 
                              (() => {
                                const config = column.currencyConfig || { 
                                  currency: 'USD', 
                                  symbol: '$', 
                                  position: 'before', 
                                  decimalPlaces: 2, 
                                  thousandsSeparator: ',', 
                                  decimalSeparator: '.' 
                                };
                                
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) return value;
                                
                                const formatted = numValue.toLocaleString('en-US', {
                                  minimumFractionDigits: config.decimalPlaces,
                                  maximumFractionDigits: config.decimalPlaces
                                }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);
                                
                                return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
                              })()
                              : (value || '')
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty cell for alignment */}
                  <div style={{
                    width: '50px',
                    minWidth: '50px',
                    padding: '8px'
                  }} />
                </div>
              ))}

              {/* Add Row Footer */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #d9d9d9',
                backgroundColor: '#fafafa',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onClick={handleAddRow}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              >
                {/* Checkbox and Index Column */}
                <div style={{
                  width: '60px',
                  minWidth: '60px',
                  padding: '8px',
                  borderRight: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PlusOutlined 
                    style={{ 
                      color: '#1890ff', 
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }} 
                  />
                </div>

                {/* Data Columns */}
                {visibleColumns.map(column => (
                  <div key={column._id} style={{
                    width: getColumnWidthString(columnWidths, column._id),
                    minWidth: '50px',
                    padding: '8px',
                    borderRight: '1px solid #d9d9d9'
                  }} />
                ))}

                {/* Empty cell for alignment */}
                <div style={{
                  width: '50px',
                  minWidth: '50px',
                  padding: '8px'
                }} />
              </div>
            </div>
            

          </div>
        </div>

      {/* Add Column Modal */}
      <Modal
        title="Thêm cột mới"
        open={showAddColumn}
        onCancel={() => setShowAddColumn(false)}
        footer={null}
        width={600}
      >
        <form onSubmit={handleAddColumn}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Tên cột</Text>
              <Input
                value={newColumn.name}
                onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                placeholder="Nhập tên cột (tự động tạo theo loại dữ liệu nếu để trống)"
              />
            </div>
            <div>
              <Text strong>Loại dữ liệu</Text>
              <Select
                value={newColumn.dataType}
                onChange={(value) => {
                  // Auto-generate column name based on data type if name is empty
                  let autoName = '';
                  if (!newColumn.name.trim()) {
                    switch (value) {
                      case 'text':
                        autoName = 'Text';
                        break;
                      case 'number':
                        autoName = 'Number';
                        break;
                      case 'date':
                        autoName = 'Date';
                        break;
                      case 'checkbox':
                        autoName = 'Checkbox';
                        break;
                      case 'single_select':
                        autoName = 'Single Select';
                        break;
                      case 'multi_select':
                        autoName = 'Multi Select';
                        break;
                      case 'formula':
                        autoName = 'Formula';
                        break;
                      case 'currency':
                        autoName = 'Currency';
                        break;
                      default:
                        autoName = 'New Column';
                    }
                  }
                  setNewColumn({ 
                    ...newColumn, 
                    dataType: value,
                    name: newColumn.name.trim() || autoName,
                    // Set default value for currency
                    ...(value === 'currency' ? { defaultValue: 0 } : {})
                  });
                }}
                style={{ width: '100%' }}
              >
                <Option value="text">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FieldBinaryOutlined style={{ color: '#1890ff' }} />
                    <span>Text</span>
                  </div>
                </Option>
                <Option value="number">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <NumberOutlined style={{ color: '#52c41a' }} />
                    <span>Number</span>
                  </div>
                </Option>
                <Option value="date">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarOutlined style={{ color: '#fa8c16' }} />
                    <span>Date</span>
                  </div>
                </Option>

                <Option value="checkbox">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquareOutlined style={{ color: '#52c41a' }} />
                    <span>Checkbox</span>
                  </div>
                </Option>
                <Option value="single_select">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DownOutlined style={{ color: '#1890ff' }} />
                    <span>Single select</span>
                  </div>
                </Option>
                <Option value="multi_select">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquareOutlined style={{ color: '#722ed1' }} />
                    <span>Multi select</span>
                  </div>
                </Option>
                
                <Option value="formula">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FunctionOutlined style={{ color: '#722ed1' }} />
                    <span>Formula</span>
                  </div>
                </Option>
                <Option value="currency">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarOutlined style={{ color: '#52c41a' }} />
                    <span>Tiền tệ</span>
                  </div>
                </Option>
                
                <Option value="email">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkOutlined style={{ color: '#1890ff' }} />
                    <span>Email</span>
                  </div>
                </Option>
                
                <Option value="url">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkOutlined style={{ color: '#1890ff' }} />
                    <span>URL</span>
                  </div>
                </Option>
                
                <Option value="json">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CodeOutlined style={{ color: '#722ed1' }} />
                    <span>JSON</span>
                  </div>
                </Option>
              </Select>
            </div>

            {/* Checkbox Configuration */}
            {newColumn.dataType === 'checkbox' && (
              <div style={{ 
                backgroundColor: '#fafafa', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
              }}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>Icon</Text>
                    <Select
                      value={newColumn.checkboxConfig.icon}
                      onChange={(value) => setNewColumn({
                        ...newColumn,
                        checkboxConfig: { ...newColumn.checkboxConfig, icon: value }
                      })}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      <Option value="check-circle">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <span>Check Circle</span>
                        </div>
                      </Option>
                      <Option value="border">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BorderOutlined style={{ color: '#666' }} />
                          <span>Border</span>
                        </div>
                      </Option>
                    </Select>
                  </div>

                  <div>
                    <Text strong>Colour</Text>
                    <Select
                      value={newColumn.checkboxConfig.color}
                      onChange={(value) => setNewColumn({
                        ...newColumn,
                        checkboxConfig: { ...newColumn.checkboxConfig, color: value }
                      })}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      <Option value="#52c41a">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: '#52c41a', 
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 1px #d9d9d9'
                          }} />
                          <span>Green</span>
                        </div>
                      </Option>
                      <Option value="#1890ff">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: '#1890ff', 
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 1px #d9d9d9'
                          }} />
                          <span>Blue</span>
                        </div>
                      </Option>
                      <Option value="#fa8c16">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: '#fa8c16', 
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 1px #d9d9d9'
                          }} />
                          <span>Orange</span>
                        </div>
                      </Option>
                      <Option value="#f5222d">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: '#f5222d', 
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 1px #d9d9d9'
                          }} />
                          <span>Red</span>
                        </div>
                      </Option>
                      <Option value="#722ed1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: '#722ed1', 
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: '0 0 0 1px #d9d9d9'
                          }} />
                          <span>Purple</span>
                        </div>
                      </Option>
                    </Select>
                  </div>

                  <div>
                    <Text strong>Giá trị mặc định</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Radio.Group
                        value={newColumn.checkboxConfig.defaultValue}
                        onChange={(e) => setNewColumn({
                          ...newColumn,
                          checkboxConfig: { ...newColumn.checkboxConfig, defaultValue: e.target.value }
                        })}
                      >
                        <Radio value={false}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BorderOutlined style={{ color: '#666' }} />
                            <span>Unchecked</span>
                          </div>
                        </Radio>
                        <Radio value={true}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircleOutlined style={{ color: newColumn.checkboxConfig.color }} />
                            <span>Checked</span>
                          </div>
                        </Radio>
                      </Radio.Group>
                    </div>
                  </div>
                </Space>
              </div>
            )}

            {/* Single Select Configuration */}
            {newColumn.dataType === 'single_select' && (
              <SingleSelectConfig
                config={newColumn.singleSelectConfig}
                onChange={(config) => setNewColumn({
                  ...newColumn,
                  singleSelectConfig: config
                })}
              />
            )}

            {/* Multi Select Configuration */}
            {newColumn.dataType === 'multi_select' && (
              <MultiSelectConfig
                config={newColumn.multiSelectConfig}
                onChange={(config) => setNewColumn({
                  ...newColumn,
                  multiSelectConfig: config
                })}
              />
            )}

            {/* Date Configuration */}
            {newColumn.dataType === 'date' && (
              <DateConfig
                config={newColumn.dateConfig}
                onChange={(config) => setNewColumn({
                  ...newColumn,
                  dateConfig: config
                })}
              />
            )}

            {/* Currency Configuration */}
{newColumn.dataType === 'currency' && (
              <CurrencyConfig
                config={{
                  ...(newColumn.currencyConfig || {}),
                  defaultValue: newColumn.defaultValue !== undefined ? newColumn.defaultValue : 0
                }}
                onChange={(config) => {
                  console.log('CurrencyConfig onChange:', config);
                  const { defaultValue, ...currencyConfig } = config;
                  console.log('Setting defaultValue:', defaultValue);
                  setNewColumn({
                    ...newColumn,
                    currencyConfig: currencyConfig,
                    defaultValue: defaultValue !== undefined ? defaultValue : 0
                  });
                }}
              />
            )}

            {/* Formula Configuration */}
            {newColumn.dataType === 'formula' && (
              <FormulaConfig
                formulaConfig={newColumn.formulaConfig}
                onFormulaConfigChange={(formulaConfig) => setNewColumn({ ...newColumn, formulaConfig })}
                availableColumns={columns}
                onValidationChange={(isValid, errors) => {
                  // Handle validation state if needed
                }}
              />
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #f0f0f0'
            }}>
              <Button type="link" size="small" style={{ padding: 0 }}>
                + Add description
              </Button>
              <Button type="link" size="small" style={{ padding: 0 }}>
                Show more <PlusOutlined />
              </Button>
            </div>

            <Row justify="end">
              <Space>
                <Button onClick={() => setShowAddColumn(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={addColumnMutation.isPending}
                >
                  Lưu trường
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Edit Column Modal */}
      <Modal
        title="Chỉnh sửa cột"
        open={showEditColumn}
        onCancel={() => {
          setShowEditColumn(false);
          setEditingColumn(null);
        }}
        footer={null}
        width={600}
      >
        {editingColumn && (
          <form onSubmit={handleEditColumnSubmit}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>Tên trường</Text>
                <Input
                  value={editingColumn.name}
                  onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                  placeholder="Tên trường (Tùy chọn)"
                />
              </div>
              <div>
                <Text strong>Loại trường</Text>
                <Select
                  value={editingColumn.dataType}
                  onChange={(value) => setEditingColumn({ ...editingColumn, dataType: value })}
                  style={{ width: '100%' }}
                >
                  <Option value="text">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FieldBinaryOutlined style={{ color: '#1890ff' }} />
                      <span>Text</span>
                    </div>
                  </Option>
                  <Option value="number">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <NumberOutlined style={{ color: '#52c41a' }} />
                      <span>Number</span>
                    </div>
                  </Option>
                  <Option value="date">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarOutlined style={{ color: '#fa8c16' }} />
                      <span>Date</span>
                    </div>
                  </Option>

                  <Option value="checkbox">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquareOutlined style={{ color: '#52c41a' }} />
                      <span>Checkbox</span>
                    </div>
                  </Option>
                  <Option value="single_select">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DownOutlined style={{ color: '#1890ff' }} />
                      <span>Single select</span>
                    </div>
                  </Option>
                  <Option value="multi_select">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquareOutlined style={{ color: '#722ed1' }} />
                      <span>Multi select</span>
                  </div>
                </Option>
                
                <Option value="formula">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FunctionOutlined style={{ color: '#722ed1' }} />
                    <span>Formula</span>
                  </div>
                </Option>
                <Option value="currency">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarOutlined style={{ color: '#52c41a' }} />
                    <span>Tiền tệ</span>
                  </div>
                </Option>
                
                <Option value="email">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MailOutlined style={{ color: '#1890ff' }} />
                    <span>Email</span>
                  </div>
                </Option>
                
                <Option value="url">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LinkOutlined style={{ color: '#1890ff' }} />
                    <span>URL</span>
                  </div>
                </Option>
                
                <Option value="json">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CodeOutlined style={{ color: '#722ed1' }} />
                    <span>JSON</span>
                  </div>
                </Option>
                </Select>
              </div>

              {/* Checkbox Configuration */}
              {editingColumn.dataType === 'checkbox' && (
                <div style={{ 
                  backgroundColor: '#fafafa', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0'
                }}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text strong>Icon</Text>
                      <Select
                        value={editingColumn.checkboxConfig.icon}
                        onChange={(value) => setEditingColumn({
                          ...editingColumn,
                          checkboxConfig: { ...editingColumn.checkboxConfig, icon: value }
                        })}
                        style={{ width: '100%', marginTop: '8px' }}
                      >
                        <Option value="check-circle">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            <span>Check Circle</span>
                          </div>
                        </Option>
                        <Option value="border">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BorderOutlined style={{ color: '#666' }} />
                            <span>Border</span>
                          </div>
                        </Option>
                      </Select>
                    </div>

                    <div>
                      <Text strong>Colour</Text>
                      <Select
                        value={editingColumn.checkboxConfig.color}
                        onChange={(value) => setEditingColumn({
                          ...editingColumn,
                          checkboxConfig: { ...editingColumn.checkboxConfig, color: value }
                        })}
                        style={{ width: '100%', marginTop: '8px' }}
                      >
                        <Option value="#52c41a">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: '#52c41a', 
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              boxShadow: '0 0 0 1px #d9d9d9'
                            }} />
                            <span>Green</span>
                          </div>
                        </Option>
                        <Option value="#1890ff">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: '#1890ff', 
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              boxShadow: '0 0 0 1px #d9d9d9'
                            }} />
                            <span>Blue</span>
                          </div>
                        </Option>
                        <Option value="#fa8c16">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: '#fa8c16', 
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              boxShadow: '0 0 0 1px #d9d9d9'
                            }} />
                            <span>Orange</span>
                          </div>
                        </Option>
                        <Option value="#f5222d">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: '#f5222d', 
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              boxShadow: '0 0 0 1px #d9d9d9'
                            }} />
                            <span>Red</span>
                          </div>
                        </Option>
                        <Option value="#722ed1">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              backgroundColor: '#722ed1', 
                              borderRadius: '50%',
                              border: '2px solid #fff',
                              boxShadow: '0 0 0 1px #d9d9d9'
                            }} />
                            <span>Purple</span>
                          </div>
                        </Option>
                      </Select>
                    </div>

                    <div>
                      <Text strong>Giá trị mặc định</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Radio.Group
                          value={editingColumn.checkboxConfig.defaultValue}
                          onChange={(e) => setEditingColumn({
                            ...editingColumn,
                            checkboxConfig: { ...editingColumn.checkboxConfig, defaultValue: e.target.value }
                          })}
                        >
                          <Radio value={false}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <BorderOutlined style={{ color: '#666' }} />
                              <span>Unchecked</span>
                            </div>
                          </Radio>
                          <Radio value={true}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircleOutlined style={{ color: editingColumn.checkboxConfig.color }} />
                              <span>Checked</span>
                            </div>
                          </Radio>
                        </Radio.Group>
                      </div>
                    </div>
                  </Space>
                </div>
              )}

              {/* Single Select Configuration */}
              {editingColumn.dataType === 'single_select' && (
                <SingleSelectConfig
                  config={editingColumn.singleSelectConfig}
                  onChange={(config) => setEditingColumn({
                    ...editingColumn,
                    singleSelectConfig: config
                  })}
                />
              )}

              {/* Multi Select Configuration */}
              {editingColumn.dataType === 'multi_select' && (
                <MultiSelectConfig
                  config={editingColumn.multiSelectConfig}
                  onChange={(config) => setEditingColumn({
                    ...editingColumn,
                    multiSelectConfig: config
                  })}
                />
              )}

              {/* Date Configuration */}
              {editingColumn.dataType === 'date' && (
                <DateConfig
                  config={editingColumn.dateConfig}
                  onChange={(config) => setEditingColumn({
                    ...editingColumn,
                    dateConfig: config
                  })}
                />
              )}

              {/* Currency Configuration */}
{editingColumn.dataType === 'currency' && (
                <CurrencyConfig
                  config={{
                    ...(editingColumn.currencyConfig || {}),
                    defaultValue: editingColumn.defaultValue !== undefined ? editingColumn.defaultValue : 0
                  }}
                  onChange={(config) => {
                    console.log('Edit CurrencyConfig onChange:', config);
                    const { defaultValue, ...currencyConfig } = config;
                    setEditingColumn({
                      ...editingColumn,
                      currencyConfig: currencyConfig,
                      defaultValue: defaultValue !== undefined ? defaultValue : 0
                    });
                  }}
                />
              )}

              {/* Formula Configuration */}
              {editingColumn.dataType === 'formula' && (
                <FormulaConfig
                  formulaConfig={editingColumn.formulaConfig}
                  onFormulaConfigChange={(formulaConfig) => setEditingColumn({ ...editingColumn, formulaConfig })}
                  availableColumns={columns}
                  onValidationChange={(isValid, errors) => {
                    // Handle validation state if needed
                  }}
                />
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <Button type="link" size="small" style={{ padding: 0 }}>
                  + Thêm mô tả
                </Button>
                <Button type="link" size="small" style={{ padding: 0 }}>
                  Hiển thị thêm <PlusOutlined />
                </Button>
              </div>

              <Row justify="end">
                <Space>
                  <Button 
                    onClick={() => {
                      setShowEditColumn(false);
                      setEditingColumn(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateColumnMutation.isPending}
                  >
                    Lưu trường
                  </Button>
                </Space>
              </Row>
            </Space>
          </form>
        )}
      </Modal>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            backgroundColor: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            padding: '4px 0',
            minWidth: '120px'
          }}
          onClick={handleContextMenuClose}
        >
          <Menu
            mode="vertical"
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={handleContextMenuClose}
          >
            <Menu.Item
              key="delete"
              icon={<DeleteOutlined />}
              danger
              onClick={handleContextMenuDelete}
              style={{ color: '#ff4d4f' }}
            >
              Xóa hàng
            </Menu.Item>
          </Menu>
        </div>
      )}

      {/* Click outside to close context menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={handleContextMenuClose}
        />
      )}


    </div>
  );
};

export default TableDetail;