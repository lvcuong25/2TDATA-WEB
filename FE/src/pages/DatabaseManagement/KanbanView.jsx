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
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
  FilterOutlined, 
  SortAscendingOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  
  // State for Kanban
  const [stackByField, setStackByField] = useState('');
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);

  // Fetch Kanban configuration
  const { data: kanbanConfig, isLoading: configLoading, isError: configError, error: configErrorData } = useQuery({
    queryKey: ['kanbanConfig', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/kanban/config`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch Kanban data
  const { data: kanbanData, isLoading: dataLoading, isError: dataError, error: dataErrorData, refetch: refetchKanbanData } = useQuery({
    queryKey: ['kanbanData', tableId, stackByField],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/kanban?stackByField=${stackByField}`);
      return response.data;
    },
    enabled: !!tableId && !!stackByField,
  });

  // Initialize stackBy field when config is loaded
  useEffect(() => {
    if (kanbanConfig?.success && kanbanConfig?.eligible && !stackByField) {
      setStackByField(kanbanConfig.defaultStackBy.name);
    }
  }, [kanbanConfig, stackByField]);

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

    // Update record column
    updateRecordColumnMutation.mutate({
      recordId: draggedCard._id,
      newColumnValue: targetColumnId === 'Uncategorized' ? null : targetColumn.title,
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

  // Get column color based on title
  const getColumnColor = (title) => {
    const colorMap = {
      'Uncategorized': '#d9d9d9',
      'Nhận diện thương hiệu': '#eb2f96',
      'Tăng traffic tự nhiên': '#52c41a',
      'Khuyến mãi mùa cao đi...': '#1890ff',
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
                  {kanbanConfig.eligibleColumns.map(column => (
                    <Option key={column.name} value={column.name}>
                      {column.name}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <Button icon={<EditOutlined />} className="text-gray-600">
                Edit Cards {kanbanData?.data?.columns?.reduce((total, col) => total + col.count, 0) || 0}
              </Button>
              
              <Button icon={<FilterOutlined />} className="text-gray-600">
                Filter
              </Button>
              
              <Button icon={<SortAscendingOutlined />} className="text-gray-600">
                Sort
              </Button>
            </Space>
          </Col>
          
          <Col>
            <Space>
              {/* Removed buttons as requested */}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
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
              <div className="p-4 min-h-96">
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
                      <Card
                        key={record._id}
                        size="small"
                        className="cursor-move hover:shadow-md transition-shadow border border-gray-200 rounded-lg"
                        bodyStyle={{ padding: '12px' }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, record, column.id)}
                      >
                        <div>
                          {/* Record ID/Title */}
                          <Text strong className="text-sm text-gray-800 block mb-2">
                            {record.data?.['T CD'] || record.data?.['CD'] || record._id?.slice(-4) || 'Record'}
                          </Text>
                          
                          {/* Record fields */}
                          {Object.entries(record.data || {}).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <Text className="text-xs text-gray-500">{key}:</Text>
                              <Text className="text-xs text-gray-700 ml-1">
                                {typeof value === 'string' && value.length > 30 
                                  ? `${value.substring(0, 30)}...` 
                                  : String(value || '')
                                }
                              </Text>
                            </div>
                          ))}
                          
                          {/* Tags for specific values */}
                          {record.data?.['T Giai đoạn'] && (
                            <div className="mt-2">
                              <Tag 
                                color={getTagColor(record.data['T Giai đoạn'])}
                                className="text-xs"
                              >
                                {record.data['T Giai đoạn']}
                              </Tag>
                            </div>
                          )}
                          
                          {/* Record metadata */}
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                            <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
                            <Text className="text-xs text-gray-400">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Add Record Button */}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  className="w-full mt-3 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500"
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
    </div>
  );
};

export default KanbanView;
