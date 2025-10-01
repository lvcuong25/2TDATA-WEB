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
    queryKey: ['calendarData', tableId, dateField, viewType, currentDate.format('YYYY-MM')],
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
    staleTime: 0, // Always refetch when query key changes
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
    console.log('🔍 handleEditRecord called with:', record);
    setRecordToEdit(record);
    setShowEditRecordModal(true);
    console.log('🔍 showEditRecordModal set to true, recordToEdit:', record);
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
            return String(value?.label || value?.name || value?.title || value?._id || 'Linked Record');
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

  // Function to get the best display text for an event
  const getEventDisplayText = (event, maxLength = 20) => {
    // Try multiple data sources
    const recordData = event.data || event.dataValues?.data || {};
    
    if (!recordData || Object.keys(recordData).length === 0) {
      return 'Event';
    }
    
    // Get the first column from tableColumns (sorted by order)
    const columns = Array.isArray(tableColumns) ? tableColumns : (tableColumns?.data || Object.values(tableColumns || {}));
    const firstColumn = columns?.find(col => col.order === 0) || columns?.[0];
    
    if (firstColumn && recordData[firstColumn.name]) {
      const text = String(recordData[firstColumn.name]).trim();
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    // Fallback: Use the first non-empty field from record data
    for (const [key, value] of Object.entries(recordData)) {
      if (value && String(value).trim() && key !== '_id') {
        const text = String(value).trim();
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      }
    }
    
    // Final fallback to ID
    return event._id?.slice(-4) || event.id?.slice(-4) || 'Event';
  };

  // Custom day view component
  const DayView = () => {
    const events = getEventsForDate(currentDate);
    const isToday = currentDate.isSame(dayjs(), 'day');
    
    return (
      <div className="day-view">
        <div className="day-header mb-4">
          <div className={`text-2xl font-bold mb-2 ${
            isToday ? 'text-blue-600' : 'text-gray-900'
          }`}>
            {currentDate.format('dddd, MMMM D, YYYY')}
          </div>
          {isToday && (
            <div className="text-sm text-blue-600 font-medium">Today</div>
          )}
        </div>
        
        <div className="day-content">
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event, index) => (
                <div
                  key={event._id}
                  className="day-event bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    handleEditRecord(event);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">
                        {getEventDisplayText(event, 100)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {event.data?.['Email'] && (
                          <div className="flex items-center">
                            <span className="mr-2">📧</span>
                            {event.data.Email}
                          </div>
                        )}
                        {event.data?.['Phone'] && (
                          <div className="flex items-center">
                            <span className="mr-2">📞</span>
                            {event.data.Phone}
                          </div>
                        )}
                        {event.data?.['Position'] && (
                          <div className="flex items-center">
                            <span className="mr-2">💼</span>
                            {event.data.Position}
                          </div>
                        )}
                        {event.data?.['Company'] && (
                          <div className="flex items-center">
                            <span className="mr-2">🏢</span>
                            {event.data.Company}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">📅</div>
              <div className="text-lg text-gray-500 mb-2">No events today</div>
              <div className="text-sm text-gray-400 mb-4">
                Click the + button to add a new event
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedDateForNewRecord(currentDate);
                  setShowCreateRecordModal(true);
                }}
              >
                Add Event
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom week view component
  const WeekView = () => {
    const weekStart = currentDate.startOf('week');
    const weekDays = [];
    
    // Generate 7 days of the week
    for (let i = 0; i < 7; i++) {
      weekDays.push(weekStart.add(i, 'day'));
    }
    
    return (
      <div className="week-view">
        <div className="week-header grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center font-medium text-gray-600 py-2 border-b">
              {day.format('ddd')}
            </div>
          ))}
        </div>
        <div className="week-days grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const events = getEventsForDate(day);
            const isToday = day.isSame(dayjs(), 'day');
            const isCurrentMonth = day.isSame(currentDate, 'month');
            
            return (
              <div
                key={index}
                className={`week-day border rounded-lg p-2 min-h-32 ${
                  isToday ? 'bg-blue-50 border-blue-300' : 
                  isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                }`}
                onClick={(e) => {
                  if (e.target === e.currentTarget || e.target.classList.contains('week-day')) {
                    setSelectedDateForNewRecord(day);
                    setShowCreateRecordModal(true);
                  }
                }}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : 
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.format('D')}
                </div>
                
                {events.length > 0 && (
                  <div className="week-events space-y-1">
                    {events.slice(0, 3).map((event, eventIndex) => (
                      <Tooltip
                        key={event._id}
                        title={
                          <div>
                            <div><strong>{getEventDisplayText(event, 50)}</strong></div>
                            {event.data?.['Email'] && <div>📧 Email: {event.data.Email}</div>}
                            {event.data?.['Phone'] && <div>📞 Phone: {event.data.Phone}</div>}
                            {event.data?.['Position'] && <div>💼 Position: {event.data.Position}</div>}
                            <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8, borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                              Click để xem chi tiết
                            </div>
                          </div>
                        }
                        placement="topLeft"
                      >
                        <div
                          className="week-event text-xs p-1 rounded cursor-pointer bg-blue-500 text-white truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRecord(event);
                          }}
                        >
                          {getEventDisplayText(event, 15)}
                        </div>
                      </Tooltip>
                    ))}
                    {events.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{events.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Handle month cell render for year view
  const monthCellRender = (date) => {
    // Get all events for the month
    const monthStart = date.startOf('month');
    const monthEnd = date.endOf('month');
    const monthEvents = [];
    
    // Collect all events in this month
    for (let d = monthStart; d.isBefore(monthEnd) || d.isSame(monthEnd, 'day'); d = d.add(1, 'day')) {
      const dayEvents = getEventsForDate(d);
      monthEvents.push(...dayEvents);
    }
    
    // Remove duplicates
    const uniqueEvents = monthEvents.filter((event, index, self) => 
      index === self.findIndex(e => e._id === event._id)
    );
    
    return (
      <div 
        className="calendar-month-cell"
        onClick={(e) => {
          // If clicking on empty space, switch to month view
          if (e.target === e.currentTarget || e.target.classList.contains('calendar-month-cell')) {
            setCurrentDate(date);
            setViewType('month');
          }
        }}
        style={{ 
          minHeight: '60px', 
          cursor: 'pointer',
          position: 'relative',
          padding: '4px',
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f5f5f5';
          e.target.style.borderColor = '#d9d9d9';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderColor = '#f0f0f0';
        }}
      >
        {uniqueEvents.length > 0 && (
          <div className="calendar-month-events">
            {uniqueEvents.slice(0, 2).map((event, index) => (
              <Tooltip
                key={event._id}
                title={
                  <div>
                    <div><strong>{getEventDisplayText(event, 50)}</strong></div>
                    {event.data?.['Email'] && <div>📧 Email: {event.data.Email}</div>}
                    {event.data?.['Phone'] && <div>📞 Phone: {event.data.Phone}</div>}
                    {event.data?.['Position'] && <div>💼 Position: {event.data.Position}</div>}
                    <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8, borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                      Click để xem chi tiết
                    </div>
                  </div>
                }
                placement="topLeft"
              >
                <div
                  className="calendar-month-event"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRecord(event);
                  }}
                  style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    padding: '2px 4px',
                    margin: '1px 0',
                    borderRadius: '3px',
                    fontSize: '9px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    border: '1px solid #40a9ff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {getEventDisplayText(event, 15)}
                </div>
              </Tooltip>
            ))}
            {uniqueEvents.length > 2 && (
              <div 
                style={{ 
                  fontSize: '8px', 
                  color: '#666',
                  textAlign: 'center',
                  marginTop: '2px'
                }}
              >
                +{uniqueEvents.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
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
              <Tooltip
                key={event._id}
                title={
                  <div>
                    <div><strong>{getEventDisplayText(event, 50)}</strong></div>
                    {event.data?.['Email'] && <div>📧 Email: {event.data.Email}</div>}
                    {event.data?.['Phone'] && <div>📞 Phone: {event.data.Phone}</div>}
                    {event.data?.['Position'] && <div>💼 Position: {event.data.Position}</div>}
                    {event.data?.['Full Name'] && <div>👤 Full Name: {event.data['Full Name']}</div>}
                    {event.data?.['Company'] && <div>🏢 Company: {event.data.Company}</div>}
                    <div style={{ marginTop: '6px', fontSize: '10px', opacity: 0.8, borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                      Click để xem chi tiết đầy đủ
                    </div>
                  </div>
                }
                placement="topLeft"
              >
                <div
                  className="calendar-event"
                  draggable
                  onDragStart={(e) => handleDragStart(e, event)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRecord(event);
                  }}
                  style={{
                    backgroundColor: '#1890ff',
                    color: 'white',
                    padding: '4px 8px',
                    margin: '1px 0',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    border: '1px solid #40a9ff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#40a9ff';
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#1890ff';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {getEventDisplayText(event)}
                </div>
              </Tooltip>
            ))}
            {events.length > 3 && (
              <Tooltip
                title={`Còn ${events.length - 3} events khác. Click để xem tất cả.`}
                placement="topLeft"
              >
                <div 
                  className="calendar-event-more" 
                  style={{ 
                    fontSize: '11px', 
                    color: '#666',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '3px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #d9d9d9',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show all events for this date in a modal or expand view
                    setSelectedDateForNewRecord(date);
                    setShowCreateRecordModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e6f7ff';
                    e.target.style.borderColor = '#40a9ff';
                    e.target.style.color = '#1890ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.borderColor = '#d9d9d9';
                    e.target.style.color = '#666';
                  }}
                >
                  +{events.length - 3} more
                </div>
              </Tooltip>
            )}
          </div>
        )}
        
        {/* Show + button for empty dates */}
        {events.length === 0 && (
          <Tooltip title="Click để thêm event mới" placement="topRight">
            <div 
              className="calendar-add-event"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDateForNewRecord(date);
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
                transition: 'all 0.2s ease',
                border: '1px solid #d9d9d9'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e6f7ff';
                e.target.style.color = '#1890ff';
                e.target.style.opacity = '1';
                e.target.style.borderColor = '#40a9ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
                e.target.style.color = '#999';
                e.target.style.opacity = '0.7';
                e.target.style.borderColor = '#d9d9d9';
              }}
            >
              +
            </div>
          </Tooltip>
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
          {viewType === 'day' ? (
            <div>
              {/* Day Navigation */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <Button 
                    icon={<LeftOutlined />} 
                    onClick={() => {
                      setCurrentDate(currentDate.subtract(1, 'day'));
                      setTimeout(() => {
                        refetchCalendarData();
                      }, 100);
                    }}
                  />
                  <Title level={4} className="mb-0">
                    {currentDate.format('MMMM D, YYYY')}
                  </Title>
                  <Button 
                    icon={<RightOutlined />} 
                    onClick={() => {
                      setCurrentDate(currentDate.add(1, 'day'));
                      setTimeout(() => {
                        refetchCalendarData();
                      }, 100);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setCurrentDate(dayjs())}
                  >
                    Today
                  </Button>
                </div>
              </div>
              <DayView />
            </div>
          ) : viewType === 'week' ? (
            <div>
              {/* Week Navigation */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <Button 
                    icon={<LeftOutlined />} 
                    onClick={() => {
                      setCurrentDate(currentDate.subtract(1, 'week'));
                      setTimeout(() => {
                        refetchCalendarData();
                      }, 100);
                    }}
                  />
                  <Title level={4} className="mb-0">
                    {currentDate.startOf('week').format('MMM D')} - {currentDate.endOf('week').format('MMM D, YYYY')}
                  </Title>
                  <Button 
                    icon={<RightOutlined />} 
                    onClick={() => {
                      setCurrentDate(currentDate.add(1, 'week'));
                      setTimeout(() => {
                        refetchCalendarData();
                      }, 100);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setCurrentDate(dayjs())}
                  >
                    Today
                  </Button>
                </div>
              </div>
              <WeekView />
            </div>
          ) : (
            <Calendar
              value={currentDate}
              onChange={setCurrentDate}
              dateCellRender={dateCellRender}
              monthCellRender={monthCellRender}
              mode={viewType}
              onPanelChange={(date, mode) => {
                setCurrentDate(date);
                setViewType(mode);
                // Force refetch when changing year/month
                setTimeout(() => {
                  refetchCalendarData();
                }, 100);
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
          )}
        </Card>
      </div>


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
      {console.log('🔍 Rendering EditRecordModal with:', {
        showEditRecordModal,
        recordToEdit,
        tableId,
        hasTableColumns: !!tableColumns
      })}
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
