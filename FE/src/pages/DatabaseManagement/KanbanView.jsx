import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Select, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Dropdown, 
  Modal, 
  Form,
  message,
  Spin,
  Tag,
  Avatar,
  Tooltip,
  Input,
  Divider,
  Switch,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  FilterOutlined, 
  SortAscendingOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  UserOutlined,
  SearchOutlined,
  SettingOutlined,
  EyeOutlined,
  RightOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  ClearOutlined,
  SortDescendingOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataTypeIcon, getDataTypeColor, getDataTypeLabel } from './Utils/dataTypeUtils';

// Import our new components
import SortModal from '../../components/Kanban/SortModal';
import FilterModal from '../../components/Kanban/FilterModal';
import { CreateRecordModal, EditRecordModal } from './Modals';

// Custom scrollbar styles for all scrollbars
const customScrollbarStyles = `
  /* Global scrollbar styling */
  *::-webkit-scrollbar {
    width: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb {
    background: #e9ecef;
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: #dee2e6;
  }

  /* Firefox scrollbar styling */
  * {
    scrollbar-width: thin;
    scrollbar-color: #e9ecef #f8f9fa;
  }
`;

import axiosInstance from '../../utils/axiosInstance-cookie-only';

const { Title, Text } = Typography;
const { Option } = Select;

const KanbanView = () => {
  const { databaseId, tableId, viewId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    if (viewId && tableId) {
      queryClient.invalidateQueries(['kanbanConfig', tableId]);
      queryClient.invalidateQueries({ queryKey: ['kanbanData', tableId], exact: false });
      queryClient.refetchQueries(['kanbanConfig', tableId]);
      queryClient.refetchQueries({ queryKey: ['kanbanData', tableId], exact: false });
    }
  }, [viewId, tableId, queryClient]);
  
  // State for Kanban
  const [stackByField, setStackByField] = useState('');
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);
  
  // State for Edit Cards modal
  const [showEditCardsModal, setShowEditCardsModal] = useState(false);
  const [visibleFields, setVisibleFields] = useState({});
  const [searchField, setSearchField] = useState('');

  // State for Sort and Filter
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentSort, setCurrentSort] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // State for Record Modals
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedColumnForNewRecord, setSelectedColumnForNewRecord] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Fetch table columns for edit cards modal
  const { data: tableColumns } = useQuery({
    queryKey: ['tableColumns', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/columns`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch Kanban configuration
  const { data: kanbanConfig, isLoading: configLoading, isError: configError, error: configErrorData } = useQuery({
    queryKey: ['kanbanConfig', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/kanban/config`);
      return response.data;
    },
    enabled: !!tableId,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Fetch Kanban data with sort and filter parameters
  const { data: kanbanData, isLoading: dataLoading, isError: dataError, error: dataErrorData, refetch: refetchKanbanData } = useQuery({
    queryKey: ['kanbanData', tableId, stackByField, currentSort, currentFilters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        stackByField: stackByField || ''
      });

      // Add sort parameters
      if (currentSort) {
        params.append('sortBy', currentSort.field);
        params.append('sortDirection', currentSort.direction);
        params.append('sortType', currentSort.type);
      }

      // Add filter parameters
      if (Object.keys(currentFilters).length > 0) {
        params.append('filters', JSON.stringify(currentFilters));
      }

      // Add search parameter
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await axiosInstance.get(`/database/tables/${tableId}/kanban?${params.toString()}`);
      return response.data;
    },
    enabled: !!tableId && !!stackByField,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Initialize stackBy field when config is loaded
  useEffect(() => {
    if (kanbanConfig?.success && kanbanConfig?.eligible && !stackByField) {
      setStackByField(kanbanConfig.defaultStackBy.name);
    }
  }, [kanbanConfig, stackByField]);

  // Initialize visible fields when table columns are loaded
  useEffect(() => {
    if (tableColumns?.data && Object.keys(visibleFields).length === 0) {
      const initialVisibleFields = {};
      tableColumns.data.slice(0, 6).forEach(column => {
        initialVisibleFields[column.name] = true;
      });
      setVisibleFields(initialVisibleFields);
    }
  }, [tableColumns, visibleFields]);

  // Update record column mutation
  const updateRecordColumnMutation = useMutation({
    mutationFn: async ({ recordId, newColumnValue, stackByField }) => {
      const response = await axiosInstance.put(`/database/records/${recordId}/kanban`, {
        newColumnValue,
        stackByField
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Record moved successfully');
      refetchKanbanData();
    },
    onError: (error) => {
      console.error('Error moving record:', error);
      message.error(error.response?.data?.message || 'Failed to move record');
    },
  });

  // Add new column mutation
  const addColumnMutation = useMutation({
    mutationFn: async ({ columnName, newValue }) => {
      const response = await axiosInstance.post(`/database/tables/${tableId}/kanban/column`, {
        columnName: stackByField,
        newValue
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Column added successfully');
      setNewColumnName('');
      setShowAddColumnModal(false);
      refetchKanbanData();
    },
    onError: (error) => {
      console.error('Error adding column:', error);
      message.error(error.response?.data?.message || 'Failed to add column');
    },
  });

  // Handle drag start
  const handleDragStart = (e, card, columnId) => {
    setDraggedCard(card);
    setDraggedFromColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedCard || !draggedFromColumn || draggedFromColumn === targetColumnId) {
      return;
    }

    const targetColumn = kanbanData.data.columns.find(col => col.id === targetColumnId);
    if (!targetColumn) return;

    const currentValue = draggedCard.data?.[stackByField];
    
    let newValue;
    if (targetColumnId === 'Uncategorized') {
      // Xóa khỏi tất cả cột
      newValue = null;
    } else {
      // Chỉ xử lý Single Select - thay thế giá trị
      newValue = targetColumn.title;
    }

    // Update record column
    updateRecordColumnMutation.mutate({
      recordId: draggedCard.id || draggedCard._id,
      newColumnValue: newValue,
      stackByField: stackByField
    });

    setDraggedCard(null);
    setDraggedFromColumn(null);
  };

  // Handle add new column
  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      message.error('Column name is required');
      return;
    }

    addColumnMutation.mutate({
      columnName: stackByField,
      newValue: newColumnName.trim()
    });
  };

  // Handle sort functionality
  const handleApplySort = (sortConfig) => {
    setCurrentSort(sortConfig);
    setShowSortModal(false);
    message.success(`Sorted by ${sortConfig.field} (${sortConfig.direction})`);
  };

  const handleClearSort = () => {
    setCurrentSort(null);
    setShowSortModal(false);
    message.success('Sort cleared');
  };

  // Handle filter functionality
  const handleApplyFilters = (filters, search) => {
    setCurrentFilters(filters);
    setSearchQuery(search);
    setShowFilterModal(false);
    
    const filterCount = Object.keys(filters).length;
    const hasSearch = search && search.trim();
    
    if (filterCount > 0 || hasSearch) {
      message.success(`Applied ${filterCount} filter${filterCount !== 1 ? 's' : ''}${hasSearch ? ' + search' : ''}`);
    } else {
      message.success('Filters cleared');
    }
  };

  const handleClearFilters = () => {
    setCurrentFilters({});
    setSearchQuery('');
    setShowFilterModal(false);
    message.success('All filters cleared');
  };

  // Get column color based on title
  const getColumnColor = (title) => {
    const colorMap = {
      'Uncategorized': '#d9d9d9',
      'Nhận diện thương hiệu': '#eb2f96',
      'Tăng traffic tự nhiên': '#52c41a',
      'Khuyến mãi mùa cao điểm': '#1890ff',
      'Tăng đơn hàng cuối năm': '#722ed1',
      'Duy trì khách': '#f5222d'
    };
    return colorMap[title] || '#1890ff';
  };

  // Get tag color for card values
  const getTagColor = (value) => {
    const colorMap = {
      'Attention': 'blue',
      'Interest': 'green',
      'Desire': 'orange',
      'Action': 'red',
      'Loyalty': 'purple'
    };
    return colorMap[value] || 'default';
  };

  // Use the consistent icon function from utils
  const getFieldIcon = (dataType) => {
    return getDataTypeIcon(dataType);
  };

  // Format field value based on data type
  const formatFieldValue = (value, dataType) => {
    if (value === null || value === undefined) {
      return '';
    }

    // Handle different data types
    switch (dataType) {
      case 'lookup':
      case 'linked_table':
        // For lookup and linked_table, value is usually an object
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            // Multiple linked records
            return value.map(item => {
              if (typeof item === 'object' && item !== null) {
                return item.label || item.name || item.title || item._id || 'Linked Record';
              }
              return String(item);
            }).join(', ');
          } else {
            // Single linked record
            return String(value?.label || value?.name || value?.title || value?._id || 'Linked Record');
          }
        }
        return String(value);

      case 'single_select':
        return String(value);

      case 'date':
      case 'datetime':
        if (value instanceof Date) {
          return value.toLocaleDateString('vi-VN');
        }
        if (typeof value === 'string' && value) {
          try {
            return new Date(value).toLocaleDateString('vi-VN');
          } catch {
            return value;
          }
        }
        return String(value);

      case 'number':
      case 'currency':
      case 'percent':
      case 'rating':
        if (typeof value === 'number') {
          return value.toLocaleString('vi-VN');
        }
        return String(value);

      case 'checkbox':
        return value ? 'Có' : 'Không';

      case 'json':
        if (typeof value === 'object') {
          return JSON.stringify(value, null, 2);
        }
        return String(value);

      default:
        return String(value);
    }
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldName) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Toggle all fields visibility (Select All / Deselect All)
  const toggleAllFields = () => {
    const allFields = tableColumns?.data || [];
    const allVisible = allFields.every(field => visibleFields[field.name]);
    
    if (allVisible) {
      // Deselect all
      const newVisibleFields = {};
      allFields.forEach(field => {
        newVisibleFields[field.name] = false;
      });
      setVisibleFields(newVisibleFields);
    } else {
      // Select all
      const newVisibleFields = {};
      allFields.forEach(field => {
        newVisibleFields[field.name] = true;
      });
      setVisibleFields(newVisibleFields);
    }
  };

  // Check if all fields are selected
  const isAllFieldsSelected = () => {
    const allFields = tableColumns?.data || [];
    return allFields.length > 0 && allFields.every(field => visibleFields[field.name]);
  };

  // Get visible fields count
  const getVisibleFieldsCount = () => {
    return Object.values(visibleFields).filter(Boolean).length;
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    return Object.keys(currentFilters).length + (searchQuery ? 1 : 0);
  };

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await axiosInstance.delete(`/database/records/${recordId}`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Record deleted successfully');
      refetchKanbanData();
    },
    onError: (error) => {
      console.error('Error deleting record:', error);
      message.error(error.response?.data?.message || 'Failed to delete record');
    },
  });

  // Handle record operations
  const handleCreateRecord = (columnId = null) => {
    setSelectedColumnForNewRecord(columnId);
    setShowCreateRecordModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowEditRecordModal(true);
  };

  const handleDeleteRecord = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      deleteRecordMutation.mutate(recordToDelete.id || recordToDelete._id);
      setShowDeleteConfirmModal(false);
      setRecordToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setRecordToDelete(null);
  };

  const handleRecordSuccess = () => {
    refetchKanbanData();
    setShowCreateRecordModal(false);
    setShowEditRecordModal(false);
    setSelectedRecord(null);
    setSelectedColumnForNewRecord(null);
  };

  // Handle authentication errors
  if (configError || dataError) {
    const errorMessage = configErrorData?.response?.data?.message || dataErrorData?.response?.data?.message;
    if (errorMessage === "Authentication required" || configErrorData?.response?.status === 401 || dataErrorData?.response?.status === 401) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-6xl text-red-400 mb-4">🔒</div>
            <Title level={4} className="text-gray-600 mb-2">
              Authentication Required
            </Title>
            <Text className="text-gray-500 text-center block mb-4">
              Please log in to view this Kanban board
            </Text>
            <Button type="primary" onClick={() => window.location.href = "/login"}>
              Go to Login
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-6xl text-red-400 mb-4">❌</div>
          <Title level={4} className="text-gray-600 mb-2">
            Error Loading Kanban
          </Title>
          <Text className="text-gray-500 text-center block mb-4">
            {errorMessage || "Failed to load kanban data"}
          </Text>
          <Button type="primary" onClick={() => { refetchKanbanData(); window.location.reload(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (configLoading || dataLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!kanbanConfig?.success || !kanbanConfig?.eligible) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📋</div>
          <Title level={4} className="text-gray-600 mb-2">
            Kanban View Not Available
          </Title>
          <Text className="text-gray-500">
            {kanbanConfig?.message || 'This table needs at least one Single Select column to use Kanban view'}
          </Text>
        </div>
      </div>
    );
  }

  const columns = kanbanData?.data?.columns || [];
  const allColumns = kanbanConfig?.allColumns || [];

  // Debug logs để test multi-select
  console.log('🔍 Multi-select Debug:');
  console.log('Stack by field:', stackByField);
  console.log('Columns from backend:', columns);
  
  // Debug chi tiết hơn
  if (columns) {
    columns.forEach((column, colIndex) => {
      console.log(`Column ${colIndex}: ${column.title} (${column.count} records)`);
      column.records.forEach((record, recordIndex) => {
        const stackByValue = record.data?.[stackByField];
        console.log(`  Record ${recordIndex}: ${record._id}`, {
          stackByValue,
          isArray: Array.isArray(stackByValue)
        });
      });
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
      {/* Kanban Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div className="flex items-center">
                <Text strong className="text-gray-700">Stacked by</Text>
                <Select
                  value={stackByField}
                  onChange={setStackByField}
                  className="ml-3 w-64"
                  placeholder="Select field to stack by"
                >
                  {kanbanConfig.eligibleColumns
                    .filter(column => column.data_type === 'single_select' || column.data_type === 'select')
                    .map(column => (
                      <Option key={column.name} value={column.name}>
                        {column.name}
                      </Option>
                    ))}
                </Select>
              </div>
              
              <Button 
                icon={<EditOutlined />} 
                className="text-gray-600"
                onClick={() => setShowEditCardsModal(true)}
              >
                Edit Cards {getVisibleFieldsCount()}
              </Button>
              
              
              <Badge count={getActiveFiltersCount()} size="small">
                <Button 
                  icon={<FilterOutlined />} 
                  className="text-gray-600"
                  type={getActiveFiltersCount() > 0 ? "primary" : "default"}
                  onClick={() => setShowFilterModal(true)}
                >
                  Filter
                </Button>
              </Badge>
              
              <Button 
                icon={currentSort ? <SortDescendingOutlined /> : <SortAscendingOutlined />} 
                className="text-gray-600"
                type={currentSort ? "primary" : "default"}
                onClick={() => setShowSortModal(true)}
              >
                Sort
                {currentSort && (
                  <Text className="ml-1 text-xs">
                    ({currentSort.field})
                  </Text>
                )}
              </Button>

              {(currentSort || getActiveFiltersCount() > 0) && (
                <Button 
                  icon={<ClearOutlined />}
                  size="small"
                  type="text"
                  className="text-red-500"
                  onClick={() => {
                    setCurrentSort(null);
                    setCurrentFilters({});
                    setSearchQuery('');
                    message.success('All sort and filters cleared');
                  }}
                >
                  Clear All
                </Button>
              )}
            </Space>
          </Col>
          
          <Col>
            <Space>
              {kanbanData?.data?.totalRecords && (
                <Text type="secondary" className="text-sm">
                  {kanbanData.data.totalRecords} records
                </Text>
              )}
            </Space>
          </Col>
        </Row>

        {/* Applied filters and sort display */}
        {(currentSort || getActiveFiltersCount() > 0 || searchQuery) && (
          <Row className="mt-3">
            <Col span={24}>
              <Space size="small" wrap>
                {currentSort && (
                  <Tag 
                    color="blue" 
                    closable
                    onClose={() => setCurrentSort(null)}
                    className="flex items-center"
                  >
                    <SortAscendingOutlined className="mr-1" />
                    Sort: {currentSort.field} ({currentSort.direction})
                  </Tag>
                )}
                
                {Object.entries(currentFilters).map(([field, filter]) => (
                  <Tag 
                    key={field}
                    color="green"
                    closable
                    onClose={() => {
                      const newFilters = { ...currentFilters };
                      delete newFilters[field];
                      setCurrentFilters(newFilters);
                    }}
                  >
                    {field}: {filter.operator} {typeof filter.value === 'object' ? JSON.stringify(filter.value) : String(filter.value || '')}
                  </Tag>
                ))}

                {searchQuery && (
                  <Tag 
                    color="orange"
                    closable
                    onClose={() => setSearchQuery('')}
                  >
                    <SearchOutlined className="mr-1" />
                    Search: "{searchQuery}"
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns
            .sort((a, b) => {
              // Move "Uncategorized" to the front
              if (a.title === 'Uncategorized') return -1;
              if (b.title === 'Uncategorized') return 1;
              return 0;
            })
            .map((column) => (
            <div
              key={column.id}
              className="min-w-80 bg-white rounded-lg shadow-sm border border-gray-200"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getColumnColor(column.title) }}
                    />
                    <Text strong className="text-gray-800">{column.title}</Text>
                    <Tag color="default" className="text-xs">
                      {column.count}
                    </Tag>
                  </div>
                  
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'add-column',
                          label: 'Add Column',
                          icon: <PlusOutlined />,
                          onClick: () => setShowAddColumnModal(true)
                        }
                      ]
                    }}
                    trigger={['click']}
                  >
                    <Button type="text" icon={<MoreOutlined />} className="text-gray-400" />
                  </Dropdown>
                </div>
              </div>

              {/* Column Cards */}
              <div className="p-4 min-h-96 max-h-[600px] overflow-y-auto">
                {column.records.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-sm font-medium">Empty stack</div>
                    <div className="text-xs mt-1">
                      Looks like this stack does not have any records.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {column.records.map((record) => (
                      <div className="relative">
                        <Card
                          key={record.id || record._id}
                          size="small"
                          className="cursor-move hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 rounded-lg bg-white group"
                          bodyStyle={{ padding: '16px' }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, record, column.id)}
                          onDoubleClick={() => handleEditRecord(record)}
                        >
                        {/* Delete button */}
                        <Button
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            minWidth: 'unset', 
                            padding: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteRecord(record);
                          }}
                          title="Delete record"
                        />
                        
                        <div>
                          {/* Date at the top - if available */}
                          {(record.data?.['Ngày'] || record.data?.['Date'] || record.data?.['Ngày tạo']) && (
                            <div className="mb-3">
                              <Text strong className="text-base text-gray-900 font-bold truncate block" title={record.data?.['Ngày'] || record.data?.['Date'] || record.data?.['Ngày tạo']}>
                                {record.data?.['Ngày'] || record.data?.['Date'] || record.data?.['Ngày tạo']}
                              </Text>
                            </div>
                          )}
                          
                          {/* Record ID/Title - if no date field */}
                          {!(record.data?.['Ngày'] || record.data?.['Date'] || record.data?.['Ngày tạo']) && (
                            <div className="mb-3 pb-2 border-b border-gray-100">
                              <Text strong className="text-base text-gray-900 font-semibold truncate block" title={(() => {
                                const firstField = Object.entries(record.data || {})
                                  .filter(([key]) => visibleFields[key])
                                  .slice(0, 1)[0];
                                return firstField ? formatFieldValue(firstField[1], tableColumns?.data?.find(col => col.name === firstField[0])?.data_type || tableColumns?.data?.find(col => col.name === firstField[0])?.dataType || 'text') : 'Record';
                              })()}>
                                {(() => {
                                  const firstField = Object.entries(record.data || {})
                                    .filter(([key]) => visibleFields[key])
                                    .slice(0, 1)[0];
                                  return firstField ? formatFieldValue(firstField[1], tableColumns?.data?.find(col => col.name === firstField[0])?.data_type || tableColumns?.data?.find(col => col.name === firstField[0])?.dataType || 'text') : 'Record';
                                })()}
                              </Text>
                            </div>
                          )}
                          
                          {/* Record fields - only show visible fields */}
                          <div className="space-y-2">
                            {Object.entries(record.data || {})
                              .filter(([key]) => visibleFields[key] && key !== 'Ngày' && key !== 'Date' && key !== 'Ngày tạo')
                              .slice(1, 7) // Skip first field (used as title), show next 6 fields
                              .map(([key, value]) => {
                                const column = tableColumns?.data?.find(col => col.name === key);
                                const dataType = column?.data_type || column?.dataType || 'text';
                                return (
                                  <div key={key} className="flex items-center py-1">
                                    <div className="w-5 h-5 flex items-center justify-center mr-3 flex-shrink-0">
                                      {getDataTypeIcon(dataType)}
                                    </div>
                                    <div className="flex-1 flex justify-between items-center">
                                      <div className="text-xs text-gray-600 font-medium">
                                        {key}:
                                      </div>
                                      <div className="text-sm text-gray-800 font-semibold truncate max-w-32" title={formatFieldValue(value, dataType)}>
                                        {dataType === 'checkbox' ? (
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {value ? 'Yes' : 'No'}
                                          </span>
                                        ) : (
                                          formatFieldValue(value, dataType)
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          
                          
                          {/* Tags for specific values */}
                          {record.data?.['T Giai đoạn'] && (
                            <div className="mt-3 pt-2 border-t border-gray-100">
                              <Tag 
                                color={getTagColor(record.data['T Giai đoạn'])}
                                className="text-xs font-medium"
                              >
                                {record.data['T Giai đoạn']}
                              </Tag>
                            </div>
                          )}
                        </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Record Button */}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  className="w-full mt-3 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"
                  onClick={() => handleCreateRecord(column.id)}
                >
                  + New record
                </Button>
                
                {/* Record count */}
                <div className="text-center mt-2">
                  <Text className="text-xs text-gray-400">
                    {column.count}/{column.count} records
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sort Modal */}
      <SortModal
        open={showSortModal}
        onCancel={() => setShowSortModal(false)}
        onApply={handleApplySort}
        onClear={handleClearSort}
        columns={allColumns}
        currentSort={currentSort}
      />

      {/* Filter Modal */}
      <FilterModal
        open={showFilterModal}
        onCancel={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        columns={allColumns}
        currentFilters={currentFilters}
        searchQuery={searchQuery}
      />

      {/* Add Column Modal */}
      <Modal
        title="Add New Column"
        open={showAddColumnModal}
        onCancel={() => {
          setShowAddColumnModal(false);
          setNewColumnName('');
        }}
        onOk={handleAddColumn}
        confirmLoading={addColumnMutation.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="Column Name" required>
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Enter column name"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Cards Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              <span className="text-blue-600 text-sm">📋</span>
            </div>
            <span>Edit Cards</span>
            <Tag color="blue">{getVisibleFieldsCount()}</Tag>
          </div>
        }
        open={showEditCardsModal}
        onCancel={() => setShowEditCardsModal(false)}
        footer={null}
        width={600}
        className="edit-cards-modal"
      >
        <div className="space-y-4">
            {/* Search Fields */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search fields"
                prefix={<SearchOutlined />}
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Select All</span>
                <Switch 
                  size="small" 
                  checked={isAllFieldsSelected()}
                  onChange={toggleAllFields}
                />
              </div>
            </div>

          {/* Fields List */}
          <div className="max-h-96 overflow-y-auto">
            {tableColumns?.data
              ?.filter(column => 
                column.name.toLowerCase().includes(searchField.toLowerCase())
              )
              ?.map((column) => (
                <div
                  key={column._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'info',
                            label: (
                              <div className="p-2">
                                <div className="font-medium text-gray-800">{column.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Type: {column.data_type || column.dataType}
                                </div>
                                {column.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {column.description}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  Required: {column.isRequired ? 'Yes' : 'No'}
                                </div>
                                {column.isUnique && (
                                  <div className="text-xs text-blue-500 mt-1">
                                    Unique field
                                  </div>
                                )}
                              </div>
                            ),
                            disabled: true
                          }
                        ]
                      }}
                      trigger={['click']}
                      placement="bottomLeft"
                    >
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                        {getFieldIcon(column.data_type || column.dataType)}
                      </div>
                    </Dropdown>
                    <span className="text-sm text-gray-700">{column.name}</span>
                    {(column.data_type || column.dataType) === 'linked_table' && (
                      <RightOutlined className="text-gray-400 text-xs" />
                    )}
                  </div>
                  <Switch
                    checked={visibleFields[column.name] || false}
                    onChange={() => toggleFieldVisibility(column.name)}
                    size="small"
                  />
                </div>
              ))}
          </div>

          {/* System Fields */}
          <Divider />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EyeOutlined className="text-gray-400" />
              <span className="text-sm text-gray-600">System fields</span>
            </div>
            <Button type="text" size="small" className="text-blue-600">
              + New Field
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Record Modal */}
      <CreateRecordModal
        open={showCreateRecordModal}
        onCancel={() => {
          setShowCreateRecordModal(false);
          setSelectedColumnForNewRecord(null);
        }}
        tableId={tableId}
        tableColumns={tableColumns}
        onSuccess={handleRecordSuccess}
        initialData={selectedColumnForNewRecord ? {
          [stackByField]: selectedColumnForNewRecord === 'Uncategorized' ? null : columns.find(col => col.id === selectedColumnForNewRecord)?.title
        } : {}}
        stackByField={stackByField}
        availableOptions={kanbanConfig?.eligibleColumns?.find(col => col.name === stackByField)?.options || []}
      />

      {/* Edit Record Modal */}
      <EditRecordModal
        open={showEditRecordModal}
        onCancel={() => {
          setShowEditRecordModal(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        tableId={tableId}
        tableColumns={tableColumns}
        onSuccess={handleRecordSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xóa Record"
        open={showDeleteConfirmModal}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Hủy
          </Button>,
          <Button key="delete" type="primary" danger onClick={confirmDelete}>
            Xóa
          </Button>,
        ]}
      >
        <p>Bạn có chắc chắn muốn xóa record này không? Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default KanbanView;
