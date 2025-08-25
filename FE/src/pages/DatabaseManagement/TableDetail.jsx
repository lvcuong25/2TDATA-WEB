import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Table,
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

  // Add column resizing functionality
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ant-table-thead > tr > th {
        position: relative !important;
        min-width: 15px !important;
        max-width: none !important;
        user-select: none;
        overflow: visible !important;
      }
      .ant-table-tbody > tr > td {
        min-width: 15px !important;
        max-width: none !important;
        user-select: none;
        overflow: visible !important;
      }
      .column-resize-handle {
        position: absolute !important;
        right: -2px !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 4px !important;
        height: 100% !important;
        background: transparent;
        cursor: col-resize !important;
        z-index: 1000 !important;
        transition: background-color 0.2s;
        border: none !important;
        outline: none !important;
      }
      .column-resize-handle:hover {
        background: #1890ff !important;
      }
      .column-resize-handle.resizing {
        background: #1890ff !important;
      }
      .ant-table-thead > tr > th:hover .column-resize-handle {
        background: #d9d9d9 !important;
      }
      .resize-indicator {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 2px !important;
        height: 100vh !important;
        background: #1890ff !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        display: none !important;
      }
      .resize-indicator.active {
        display: block !important;
      }
      .ant-table {
        table-layout: auto !important;
      }
      .ant-table table {
        table-layout: auto !important;
      }
    `;
    document.head.appendChild(style);

    // Create resize indicator
    const resizeIndicator = document.createElement('div');
    resizeIndicator.className = 'resize-indicator';
    document.body.appendChild(resizeIndicator);

    // Add resize functionality
    const addResizeHandlers = () => {
      console.log('Adding resize handlers...');
      const headers = document.querySelectorAll('.ant-table-thead > tr > th');
      console.log('Found headers:', headers.length);
      
      headers.forEach((header, index) => {
        console.log(`Processing header ${index}:`, header);
        
                  // Skip the combined checkbox/index column, but allow resizing for data columns
          if (index >= 1) { // Skip combined checkbox/index column (0)
          console.log(`Adding resize handle to header ${index}`);
          
          // Remove existing resize handle if any
          const existingHandle = header.querySelector('.column-resize-handle');
          if (existingHandle) {
            existingHandle.remove();
          }
          
          const resizeHandle = document.createElement('div');
          resizeHandle.className = 'column-resize-handle';
          resizeHandle.style.cssText = `
            position: absolute !important;
            right: -2px !important;
            top: 0 !important;
            bottom: 0 !important;
            width: 4px !important;
            height: 100% !important;
            background: transparent;
            cursor: col-resize !important;
            z-index: 1000 !important;
          `;
          header.appendChild(resizeHandle);

          let isResizing = false;
          let startX = 0;
          let startWidth = 0;
          let originalWidth = header.offsetWidth;

          const handleMouseDown = (e) => {
            console.log('Mouse down on resize handle');
            isResizing = true;
            startX = e.clientX;
            startWidth = header.offsetWidth;
            originalWidth = startWidth;
            resizeHandle.classList.add('resizing');
            resizeIndicator.classList.add('active');
            resizeIndicator.style.left = e.clientX + 'px';
            e.preventDefault();
            e.stopPropagation();
          };

          const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const diff = e.clientX - startX;
            const newWidth = Math.max(15, originalWidth + diff); // Minimum 15px
            
            console.log('Resizing to:', newWidth, 'px');
            
            // Update resize indicator
            resizeIndicator.style.left = e.clientX + 'px';
            
            // Force update header width
            header.style.width = newWidth + 'px';
            header.style.minWidth = newWidth + 'px';
            header.style.maxWidth = newWidth + 'px';
            
            // Update all cells in this column
            const table = header.closest('.ant-table');
            const rows = table.querySelectorAll('.ant-table-tbody > tr');
            rows.forEach(row => {
              const cell = row.children[index];
              if (cell) {
                cell.style.width = newWidth + 'px';
                cell.style.minWidth = newWidth + 'px';
                cell.style.maxWidth = newWidth + 'px';
              }
            });
            
            // Force table layout update
            const tableElement = table.querySelector('table');
            if (tableElement) {
              tableElement.style.tableLayout = 'auto';
            }
          };

          const handleMouseUp = () => {
            if (isResizing) {
              console.log('Mouse up - stopping resize');
              isResizing = false;
              resizeHandle.classList.remove('resizing');
              resizeIndicator.classList.remove('active');
            }
          };

          resizeHandle.addEventListener('mousedown', handleMouseDown);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }
      });
    };

    // Wait for table to render then add handlers
    const timer = setTimeout(() => {
      console.log('Timeout triggered, calling addResizeHandlers');
      addResizeHandlers();
    }, 1000); // Increased timeout further

    return () => {
      clearTimeout(timer);
      document.head.removeChild(style);
      if (resizeIndicator && resizeIndicator.parentNode) {
        document.body.removeChild(resizeIndicator);
      }
    };
  }, [columns, records]); // Added dependencies to re-run when data changes

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

  const getDataTypeIcon = (dataType) => {
    switch (dataType) {
      case 'text': return <FieldBinaryOutlined style={{ color: '#1890ff' }} />;
      case 'number': return <NumberOutlined style={{ color: '#52c41a' }} />;
      case 'date': return <CalendarOutlined style={{ color: '#fa8c16' }} />;
      case 'boolean': return <CheckCircleOutlined style={{ color: '#722ed1' }} />;
      default: return <FieldBinaryOutlined style={{ color: '#1890ff' }} />;
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

  // Prepare table columns for Ant Design Table
  const tableColumns = useMemo(() => {
    const cols = [
      // Combined checkbox and row number column
      {
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
            <Checkbox
              checked={selectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < records.length}
            />
            <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>#</span>
          </div>
        ),
        dataIndex: 'selection',
        key: 'selection',
        width: 18,
        minWidth: 15,
        fixed: 'left',
        align: 'center',
        render: (_, record, index) => {
          const isSelected = selectedRowKeys.includes(record._id);
          
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1px' }}>
              <Checkbox
                checked={isSelected}
                onChange={(e) => handleSelectRow(record._id, e.target.checked)}
              />
              <span 
                style={{ 
                  fontSize: '10px', 
                  color: '#666', 
                  fontWeight: 'bold',
                  opacity: isSelected ? 0.3 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              >
                {index + 1}
              </span>
            </div>
          );
        },
      }
    ];

    // Add data columns
    columns.forEach(column => {
      cols.push({
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              {getDataTypeIcon(column.dataType)}
              <Text strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {column.name}
              </Text>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getDataTypeTag(column.dataType)}
              </span>
            </Space>
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
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        ),
        dataIndex: ['data', column.name],
        key: column._id,
        width: 150,
        minWidth: 15,
        render: (value, record) => {
          const isEditing = editingCell?.recordId === record._id && editingCell?.columnName === column.name;
          
          if (isEditing) {
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
                  padding: '4px 8px',
                  margin: '0',
                  borderRadius: '0',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'none',
                  overflow: 'hidden'
                }}
              />
            );
          }
          
          return (
            <Tooltip title={value || ''} placement="topLeft">
              <div
                onClick={() => handleCellClick(record._id, column.name, value)}
                style={{ 
                  cursor: 'pointer', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {value || ''}
              </div>
            </Tooltip>
          );
        }
      });
    });


    // Add column for the "+" button to add new columns
    cols.push({
      title: (
        <Tooltip title="Add Column">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => setShowAddColumn(true)}
            style={{ minWidth: 'auto', padding: '4px 8px' }}
          />
        </Tooltip>
      ),
      key: 'addColumn',
      width: 50,
      minWidth: 15,
      align: 'center',
      render: () => null
    });

    return cols;
  }, [columns, editingCell, cellValue, records, selectedRowKeys, selectAll, deleteMultipleRecordsMutation.isPending, deleteAllRecordsMutation.isPending]);

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

  // Additional useEffect to ensure resize handlers are added after table renders
  React.useEffect(() => {
    if (tableData.length > 0 && tableColumns.length > 0) {
      console.log('Table data changed, re-adding resize handlers');
      const timer = setTimeout(() => {
        const headers = document.querySelectorAll('.ant-table-thead > tr > th');
        console.log('Re-adding handlers to', headers.length, 'headers');
        
        headers.forEach((header, index) => {
          if (index >= 1) {
            const existingHandle = header.querySelector('.column-resize-handle');
            if (!existingHandle) {
              console.log(`Adding missing resize handle to header ${index}`);
              const resizeHandle = document.createElement('div');
              resizeHandle.className = 'column-resize-handle';
              resizeHandle.style.cssText = `
                position: absolute !important;
                right: -2px !important;
                top: 0 !important;
                bottom: 0 !important;
                width: 4px !important;
                height: 100% !important;
                background: transparent;
                cursor: col-resize !important;
                z-index: 1000 !important;
              `;
              header.appendChild(resizeHandle);
            }
          }
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [tableData, tableColumns]);

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
          overflow: 'hidden'
        }}>
          <Table
            columns={tableColumns}
            dataSource={tableData}
            pagination={false}
            scroll={{ y: 'calc(100vh - 64px)' }}
            size="middle"
            bordered
            rowKey="_id"
            loading={isLoading}
            style={{ 
              height: '100%',
              tableLayout: 'auto'
            }}
            onRow={(record) => ({
              style: { cursor: 'default' }
            })}
          />
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
    </Layout>
  );
};

export default TableDetail;
