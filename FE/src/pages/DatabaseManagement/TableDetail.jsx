import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
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
  Menu
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
  HomeOutlined
} from '@ant-design/icons';
import axiosInstance from '../../utils/axiosInstance-cookie-only';

const { Title, Text } = Typography;
const { Option } = Select;
const { Header, Sider, Content } = Layout;

const TableDetail = () => {
  const { databaseId, tableId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newColumn, setNewColumn] = useState({ name: '', dataType: 'text' });
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [visibleCheckboxes, setVisibleCheckboxes] = useState(new Set());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, recordId: null });

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState(() => {
    // Load saved column widths from localStorage
    const saved = localStorage.getItem(`table_${tableId}_column_widths`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Debug: Log when editingCell changes
  React.useEffect(() => {
    console.log('editingCell changed:', editingCell);
  }, [editingCell]);

  // Column resizing handlers
  const handleResizeStart = (e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentWidth = columnWidths[columnId] || 150;
    const startClientX = e.clientX;
    
    setIsResizing(true);
    setResizingColumn(columnId);
    setStartX(startClientX);
    setStartWidth(currentWidth);

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startClientX;
      const newWidth = Math.max(50, currentWidth + deltaX);
      
      const newWidths = {
        ...columnWidths,
        [columnId]: newWidth
      };
      
      setColumnWidths(newWidths);
      saveColumnWidths(newWidths);
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

  // Get column width
  const getColumnWidth = (columnId) => {
    return columnWidths[columnId] || 150;
  };

  // Check if column is compact (only show type letter)
  const isColumnCompact = (columnId) => {
    return getColumnWidth(columnId) < 80;
  };

  // Get type letter for compact display
  const getTypeLetter = (dataType) => {
    switch (dataType) {
      case 'text': return 'T';
      case 'number': return 'N';
      case 'date': return 'D';
      case 'boolean': return 'B';
      default: return 'T';
    }
  };

  // Save column widths to localStorage
  const saveColumnWidths = (newWidths) => {
    localStorage.setItem(`table_${tableId}_column_widths`, JSON.stringify(newWidths));
  };

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
    queryKey: ['tableRecords', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/records`);
      return response.data;
    },
    enabled: !!tableId,
  });

  const tableStructure = tableStructureResponse?.data;
  const table = tableStructure?.table;
  const columns = tableStructure?.columns || [];
  const records = recordsResponse?.data || [];

  console.log('TableDetail Debug:', {
    tableStructure,
    table,
    columns,
    records,
    tableId,
    databaseId
  });



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
        // toast.success('Column added successfully');
        setShowAddColumn(false);
        setNewColumn({ name: '', dataType: 'text' });
        queryClient.invalidateQueries(['tableStructure', tableId]);
      },
      onError: (error) => {
        console.error('Error adding column:', error);
        // toast.error(error.response?.data?.message || 'Failed to add column');
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
          onSuccess: () => {
        // toast.success('Record updated successfully');
        setEditingCell(null);
        setCellValue('');
        queryClient.invalidateQueries(['tableRecords', tableId]);
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
    if (!newColumn.name.trim()) {
      // toast.error('Column name is required');
      return;
    }
    addColumnMutation.mutate(newColumn);
  };

  const handleAddRow = () => {
    if (!columns || columns.length === 0) {
      // toast.error('No columns available. Please add a column first.');
      return;
    }
    
    const emptyData = {};
    columns.forEach(column => {
      emptyData[column.name] = '';
    });
    
    // Add timestamp to ensure new records appear at the bottom
    const recordData = {
      data: emptyData,
      createdAt: new Date().toISOString(),
      order: records.length + 1
    };
    
    addRecordMutation.mutate(recordData);
  };

  // Checkbox handlers
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allKeys = records.map(record => record._id);
      setSelectedRowKeys(allKeys);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleSelectRow = (recordId, checked) => {
    if (checked) {
      setSelectedRowKeys(prev => [...prev, recordId]);
    } else {
      setSelectedRowKeys(prev => prev.filter(key => key !== recordId));
      setSelectAll(false);
      // Hide checkbox when unchecked
      setVisibleCheckboxes(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) {
      // toast.warning('Please select records to delete');
      return;
    }
    deleteMultipleRecordsMutation.mutate(selectedRowKeys);
  };

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
    setEditingColumn({
      _id: column._id,
      name: column.name,
      dataType: column.dataType
    });
    setShowEditColumn(true);
  };

  const handleEditColumnSubmit = (e) => {
    e.preventDefault();
    if (!editingColumn || !editingColumn.name.trim()) {
      // toast.error('Column name is required');
      return;
    }
    updateColumnMutation.mutate({
      columnId: editingColumn._id,
      columnData: {
        name: editingColumn.name,
        dataType: editingColumn.dataType
      }
    });
  };

  const handleDeleteColumn = (columnId, columnName) => {
    deleteColumnMutation.mutate(columnId);
  };

  const handleCellClick = (recordId, columnName, currentValue) => {
    console.log('Cell clicked:', { recordId, columnName, currentValue });
    console.log('Current editingCell before:', editingCell);
    setEditingCell({ recordId, columnName });
    setCellValue(currentValue || '');
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    
    const record = records.find(r => r._id === editingCell.recordId);
    if (!record) return;

    const updatedData = { ...record.data };
    updatedData[editingCell.columnName] = cellValue;

    updateRecordMutation.mutate({
      recordId: editingCell.recordId,
      data: updatedData
    });
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setCellValue('');
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

  const getDataTypeIcon = (dataType) => {
    switch (dataType) {
      case 'text': return <FieldBinaryOutlined style={{ color: '#1890ff' }} />;
      case 'number': return <NumberOutlined style={{ color: '#52c41a' }} />;
      case 'date': return <CalendarOutlined style={{ color: '#fa8c16' }} />;
      case 'boolean': return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
      default: return <FieldBinaryOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getDataTypeColor = (dataType) => {
    switch (dataType) {
      case 'text': return '#1890ff';
      case 'number': return '#52c41a';
      case 'date': return '#fa8c16';
      case 'boolean': return '#722ed1';
      default: return '#1890ff';
    }
  };

  const getDataTypeTag = (dataType) => {
    const colorMap = {
      text: 'blue',
      number: 'green',
      date: 'orange',
      boolean: 'purple'
    };
    return <Tag color={colorMap[dataType] || 'blue'}>{dataType.toUpperCase()}</Tag>;
  };



  // Prepare table data
  const tableData = useMemo(() => {
    // Sort records to ensure new records appear at the bottom
    const sortedRecords = [...records].sort((a, b) => {
      // If records have createdAt, sort by that
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      // If records have order field, sort by that
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Default: keep original order (new records will be added at the end)
      return 0;
    });
    
    return sortedRecords.map((record, index) => ({
      key: record._id,
      ...record,
      index
    }));
  }, [records]);



  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
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
        </Content>
      </Layout>
    );
  }

      return (
      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/database/${databaseId}/tables`)}
              style={{ marginRight: 16 }}
            >
              Back to Tables
            </Button>
            <div>
              <Title level={3} style={{ margin: 0 }}>
                <TableOutlined /> {table?.name}
              </Title>
              <Text type="secondary">{table?.description}</Text>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddRow}
              loading={addRecordMutation.isPending}
            >
              Add Row
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deleteMultipleRecordsMutation.isPending}
                onClick={handleDeleteSelected}
              >
                Delete Selected ({selectedRowKeys.length})
              </Button>
            )}
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ 
          flex: 1, 
          padding: '0', 
          background: '#fff',
          overflow: 'auto',
          cursor: isResizing ? 'col-resize' : 'default'
        }}>
          <div style={{
            display: 'inline-block',
            border: '1px solid #d9d9d9',
            overflow: 'hidden',
            backgroundColor: '#fff',
            userSelect: isResizing ? 'none' : 'auto'
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
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < records.length}
                />
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>#</span>
              </div>

              {/* Data Columns */}
              {columns.map(column => (
                <div key={column._id} style={{
                  width: `${getColumnWidth(column._id)}px`,
                  minWidth: '50px',
                  padding: isColumnCompact(column._id) ? '4px' : '8px',
                  borderRight: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isColumnCompact(column._id) ? 'center' : 'space-between',
                  backgroundColor: '#f5f5f5',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                    {isColumnCompact(column._id) ? (
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>
                        {getTypeLetter(column.dataType)}
                      </span>
                    ) : (
                      <>
                        {getDataTypeIcon(column.dataType)}
                        <span style={{ fontSize: '12px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {column.name}
                        </span>
                      </>
                    )}
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'edit',
                          label: 'Edit Column',
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
                        padding: isColumnCompact(column._id) ? '2px' : '2px',
                        fontSize: isColumnCompact(column._id) ? '10px' : '12px'
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
                backgroundColor: '#f5f5f5'
              }}>
                <Tooltip title="Add Column">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => setShowAddColumn(true)}
                    style={{ minWidth: 'auto', padding: '4px 8px' }}
                  />
                </Tooltip>
              </div>
            </div>

            {/* Table Body */}
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
              {tableData.map((record, index) => (
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
                  {columns.map(column => {
                    const value = record.data?.[column.name] || '';
                    const isEditing = editingCell?.recordId === record._id && editingCell?.columnName === column.name;
                    
                    return (
                      <div key={column._id} style={{
                        width: `${getColumnWidth(column._id)}px`,
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
                              const formatDateForInput = (dateString) => {
                                if (!dateString) return '';
                                try {
                                  const date = new Date(dateString);
                                  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
                                } catch {
                                  return dateString;
                                }
                              };

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
                            } else if (dataType === 'boolean') {
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
                              cursor: 'pointer', 
                              padding: '8px', 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '12px',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              boxSizing: 'border-box'
                            }}
                            onClick={() => handleCellClick(record._id, column.name, value)}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {column.dataType === 'date' && value ? 
                              (() => {
                                try {
                                  const date = new Date(value);
                                  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
                                } catch {
                                  return value;
                                }
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
            </div>
            
            {/* Add Row Button */}
            <div style={{
              display: 'flex',
              borderTop: '1px solid #d9d9d9',
              backgroundColor: '#fafafa'
            }}>
              <div style={{
                width: '60px',
                minWidth: '60px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid #d9d9d9'
              }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={handleAddRow}
                  loading={addRecordMutation.isPending}
                  style={{ 
                    minWidth: 'auto', 
                    padding: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
              <div style={{
                flex: 1,
                padding: '8px'
              }} />
            </div>
          </div>
        </Content>

      {/* Add Column Modal */}
      <Modal
        title="Add New Column"
        open={showAddColumn}
        onCancel={() => setShowAddColumn(false)}
        footer={null}
      >
        <form onSubmit={handleAddColumn}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Column Name</Text>
              <Input
                value={newColumn.name}
                onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                placeholder="Enter column name"
                required
              />
            </div>
            <div>
              <Text strong>Data Type</Text>
              <Select
                value={newColumn.dataType}
                onChange={(value) => setNewColumn({ ...newColumn, dataType: value })}
                style={{ width: '100%' }}
              >
                <Option value="text">Text</Option>
                <Option value="number">Number</Option>
                <Option value="date">Date</Option>
                <Option value="boolean">Boolean</Option>
              </Select>
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowAddColumn(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={addColumnMutation.isPending}
                >
                  Add Column
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Edit Column Modal */}
      <Modal
        title="Edit Column"
        open={showEditColumn}
        onCancel={() => {
          setShowEditColumn(false);
          setEditingColumn(null);
        }}
        footer={null}
      >
        {editingColumn && (
          <form onSubmit={handleEditColumnSubmit}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>Column Name</Text>
                <Input
                  value={editingColumn.name}
                  onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
                  placeholder="Enter column name"
                  required
                />
              </div>
              <div>
                <Text strong>Data Type</Text>
                <Select
                  value={editingColumn.dataType}
                  onChange={(value) => setEditingColumn({ ...editingColumn, dataType: value })}
                  style={{ width: '100%' }}
                >
                  <Option value="text">Text</Option>
                  <Option value="number">Number</Option>
                  <Option value="date">Date</Option>
                  <Option value="boolean">Boolean</Option>
                </Select>
              </div>
              <Row justify="end">
                <Space>
                  <Button 
                    onClick={() => {
                      setShowEditColumn(false);
                      setEditingColumn(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={updateColumnMutation.isPending}
                  >
                    Update Column
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
              Delete Row
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
    </Layout>
  );
};

export default TableDetail;
