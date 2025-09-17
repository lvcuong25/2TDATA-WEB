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
  Modal, 
  Form,
  message,
  Spin,
  Tag,
  Tooltip,
  Input,
  DatePicker,
  Badge,
  Dropdown,
  Calendar
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined, 
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
  CalendarOutlined,
  LeftOutlined,
  RightOutlined as RightArrowOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDataTypeIcon, getDataTypeColor } from './Utils/dataTypeUtils';
import dayjs from 'dayjs';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { CreateRecordModal, EditRecordModal } from './Modals';
import RecordDetailModal from './Calendar/RecordDetailModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CalendarView = () => {
  const { databaseId, tableId, viewId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for Calendar
  const [dateField, setDateField] = useState('');
  const [viewType, setViewType] = useState('month');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [selectedDateForNewRecord, setSelectedDateForNewRecord] = useState(null);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);

  // Fetch table columns
  const { data: tableColumns } = useQuery({
    queryKey: ['tableColumns', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/columns`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch Calendar configuration
  const { data: calendarConfig, isLoading: configLoading, isError: configError, error: configErrorData } = useQuery({
    queryKey: ['calendarConfig', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/calendar/config`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch Calendar data
  const { data: calendarData, isLoading: dataLoading, isError: dataError, error: dataErrorData, refetch: refetchCalendarData } = useQuery({
    queryKey: ['calendarData', tableId, dateField, viewType, currentDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateField: dateField || '',
        viewType: viewType,
        currentDate: currentDate.toISOString()
      });

      const response = await axiosInstance.get(`/database/tables/${tableId}/calendar?${params.toString()}`);
      return response.data;
    },
    enabled: !!tableId && !!dateField,
  });

  // Initialize dateField when config is loaded
  useEffect(() => {
    if (calendarConfig?.success && calendarConfig?.eligible && !dateField) {
      setDateField(calendarConfig.defaultDateField.name);
    }
  }, [calendarConfig, dateField]);

  // Update record date mutation
  const updateRecordDateMutation = useMutation({
    mutationFn: async ({ recordId, newDate, dateField }) => {
      const response = await axiosInstance.put(`/database/records/${recordId}/calendar`, {
        newDate,
        dateField
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Record date updated successfully');
      refetchCalendarData();
    },
    onError: (error) => {
      console.error('Error updating record date:', error);
      message.error(error.response?.data?.message || 'Failed to update record date');
    },
  });

  // Handle create record success
  const handleCreateRecordSuccess = () => {
    refetchCalendarData();
    setShowCreateRecordModal(false);
    setSelectedDateForNewRecord(null);
  };

  // Handle edit record
  const handleEditRecord = (record) => {
    setRecordToEdit(record);
    setShowEditRecordModal(true);
  };

  // Handle edit record success
  const handleEditRecordSuccess = () => {
    refetchCalendarData();
    setShowEditRecordModal(false);
    setRecordToEdit(null);
  };

  // Handle drag start
  const handleDragStart = (e, record) => {
    setDraggedEvent(record);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    
    if (!draggedEvent || !targetDate) {
      return;
    }

    // Update record date
    updateRecordDateMutation.mutate({
      recordId: draggedEvent._id,
      newDate: targetDate.toISOString(),
      dateField: dateField
    });

    setDraggedEvent(null);
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
            return value.label || value.name || value.title || value._id || 'Linked Record';
          }
        }
        return String(value);

      case 'single_select':
      case 'multi_select':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
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

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!calendarData?.data?.events) return [];
    const dateKey = date.format('YYYY-MM-DD');
    return calendarData.data.events[dateKey] || [];
  };

  // Handle date cell render
  const dateCellRender = (date) => {
    const events = getEventsForDate(date);
    
    return (
      <div 
        className="calendar-date-cell"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, date)}
        onClick={(e) => {
          // Only trigger if clicking on empty space (not on events)
          if (e.target === e.currentTarget || e.target.classList.contains('calendar-date-cell')) {
            setSelectedDateForNewRecord(date);
            setShowCreateRecordModal(true);
          }
        }}
        style={{ 
          minHeight: '80px', 
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        {events.length > 0 && (
          <div className="calendar-events">
            {events.slice(0, 3).map((event, index) => (
              <div
                key={event._id}
                className="calendar-event"
                draggable
                onDragStart={(e) => handleDragStart(e, event)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRecord(event);
                  setShowRecordModal(true);
                }}
                style={{
                  backgroundColor: '#1890ff',
                  color: 'white',
                  padding: '2px 6px',
                  margin: '1px 0',
                  borderRadius: '3px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {event.data?.['T CD'] || event.data?.['CD'] || event._id?.slice(-4) || 'Event'}
              </div>
            ))}
            {events.length > 3 && (
              <div className="calendar-event-more" style={{ fontSize: '11px', color: '#666' }}>
                +{events.length - 3} more
              </div>
            )}
          </div>
        )}
        
        {/* Show + button for empty dates */}
        {events.length === 0 && (
          <div 
            className="calendar-add-event"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDateForNewRecord(current);
              setShowCreateRecordModal(true);
            }}
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#999',
              opacity: 0.7,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e6f7ff';
              e.target.style.color = '#1890ff';
              e.target.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f0f0f0';
              e.target.style.color = '#999';
              e.target.style.opacity = '0.7';
            }}
          >
            +
          </div>
        )}
      </div>
    );
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
              Please log in to view this Calendar
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
            Error Loading Calendar
          </Title>
          <Text className="text-gray-500 text-center block mb-4">
            {errorMessage || "Failed to load calendar data"}
          </Text>
          <Button type="primary" onClick={() => { refetchCalendarData(); window.location.reload(); }}>
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

  if (!calendarConfig?.success || !calendarConfig?.eligible) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">📅</div>
          <Title level={4} className="text-gray-600 mb-2">
            Calendar View Not Available
          </Title>
          <Text className="text-gray-500">
            {calendarConfig?.message || 'This table needs at least one Date/Datetime column to use Calendar view'}
          </Text>
        </div>
      </div>
    );
  }

  const events = calendarData?.data?.events || {};
  const allColumns = calendarConfig?.allColumns || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Calendar Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div className="flex items-center">
                <Text strong className="text-gray-700">Date Field</Text>
                <Select
                  value={dateField}
                  onChange={setDateField}
                  className="ml-3 w-64"
                  placeholder="Select date field"
                >
                  {calendarConfig.eligibleColumns.map(column => (
                    <Option key={column.name} value={column.name}>
                      {column.name}
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div className="flex items-center">
                <Text strong className="text-gray-700">View</Text>
                <Select
                  value={viewType}
                  onChange={setViewType}
                  className="ml-3 w-32"
                >
                  <Option value="day">Day</Option>
                  <Option value="week">Week</Option>
                  <Option value="month">Month</Option>
                  <Option value="year">Year</Option>
                </Select>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space>
              {calendarData?.data?.totalRecords && (
                <Text type="secondary" className="text-sm">
                  {calendarData.data.totalRecords} records
                </Text>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        <Card className="shadow-sm">
          <Calendar
            value={currentDate}
            onChange={setCurrentDate}
            dateCellRender={dateCellRender}
            mode={viewType}
            onPanelChange={(date, mode) => {
              setCurrentDate(date);
              setViewType(mode);
            }}
            headerRender={({ value, type, onChange, onTypeChange }) => (
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <Button 
                    icon={<LeftOutlined />} 
                    onClick={() => onChange(value.subtract(1, type))}
                  />
                  <Title level={4} className="mb-0">
                    {value.format('MMMM YYYY')}
                  </Title>
                  <Button 
                    icon={<RightArrowOutlined />} 
                    onClick={() => onChange(value.add(1, type))}
                  />
                  <Button onClick={() => onChange(dayjs())}>
                    Today
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={type}
                    onChange={onTypeChange}
                    style={{ width: 100 }}
                  >
                    <Option value="month">Month</Option>
                    <Option value="year">Year</Option>
                  </Select>
                </div>
              </div>
            )}
          />
        </Card>
      </div>

      {/* Record Detail Modal */}
      <RecordDetailModal
        open={showRecordModal}
        onCancel={() => {
          setShowRecordModal(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        tableColumns={tableColumns}
        onEdit={handleEditRecord}
      />

      {/* Create Record Modal */}
      <CreateRecordModal
        open={showCreateRecordModal}
        onCancel={() => {
          setShowCreateRecordModal(false);
          setSelectedDateForNewRecord(null);
        }}
        tableId={tableId}
        tableColumns={tableColumns}
        dateField={dateField}
        selectedDate={selectedDateForNewRecord}
        onSuccess={handleCreateRecordSuccess}
      />

      {/* Edit Record Modal */}
      <EditRecordModal
        open={showEditRecordModal}
        onCancel={() => {
          setShowEditRecordModal(false);
          setRecordToEdit(null);
        }}
        record={recordToEdit}
        tableId={tableId}
        tableColumns={tableColumns}
        onSuccess={handleEditRecordSuccess}
      />
    </div>
  );
};

export default CalendarView;
