import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../utils/axiosInstance-cookie-only';
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  TimePicker,
  Select, 
  Switch, 
  Checkbox,
  InputNumber,
  Rate,
  message,
  Space,
  Typography,
  Divider,
  Tabs,
  Dropdown
} from 'antd';
import { 
  EditOutlined, 
  LinkOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  NumberOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  StarOutlined,
  FieldTimeOutlined,
  SendOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  MessageOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  MoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getDataTypeIcon } from '../Utils/dataTypeUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EditRecordModal = ({ 
  open, 
  onCancel, 
  record,
  tableId, 
  tableColumns, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Comment functionality state
  const [activeTab, setActiveTab] = useState('comments');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');


  // Reset form when modal opens/closes or record changes
  useEffect(() => {
    if (open && record) {
      // Fetch comments when modal opens
      fetchCommentsMutation.mutate();
      // Convert record data to form values
      const formValues = {};
      Object.entries(record.data || {}).forEach(([key, value]) => {
        // Convert date/time strings to dayjs objects
        if (value && typeof value === 'string') {
          const columns = Array.isArray(tableColumns) ? tableColumns : (tableColumns?.data || Object.values(tableColumns || {}));
          const column = columns.find(col => col.name === key);
          if (column?.dataType === 'date' || column?.dataType === 'datetime') {
            try {
              formValues[key] = dayjs(value);
            } catch {
              formValues[key] = value;
            }
          } else if (column?.dataType === 'time') {
            try {
              // Handle time format (HH:mm) - create dayjs object for today with the time
              const today = dayjs();
              const timeParts = value.split(':');
              if (timeParts.length === 2) {
                formValues[key] = today.hour(parseInt(timeParts[0])).minute(parseInt(timeParts[1])).second(0);
              } else {
                formValues[key] = value;
              }
            } catch {
              formValues[key] = value;
            }
          } else {
            formValues[key] = value;
          }
        } else {
          formValues[key] = value;
        }
      });
      
      form.setFieldsValue(formValues);
    }
  }, [open, record, form, tableColumns]);

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ recordId, data }) => {
      const response = await axiosInstance.put(`/database/records/${recordId}`, {
        data
      });
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Record updated successfully');
      form.resetFields();
      // Invalidate and refetch table data
      queryClient.invalidateQueries({ queryKey: ['tableRecords', tableId] });
      onSuccess?.(data);
      onCancel();
    },
    onError: (error) => {
      console.error('Error updating record:', error);
      message.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const recordId = record._id || record.id;
      console.log('🔍 Adding comment for record:', recordId);
      const response = await axiosInstance.post(`/database/records/${recordId}/comments`, {
        text: commentData.text,
        recordId: recordId,
        tableId: tableId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setComments(prev => [...prev, data]);
      setComment('');
      message.success('Comment added successfully!');
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      message.error('Failed to add comment. Please try again.');
    }
  });

  // Fetch comments mutation
  const fetchCommentsMutation = useMutation({
    mutationFn: async () => {
      console.log('🔍 Fetching comments for record:', record._id, record.id);
      const recordId = record._id || record.id;
      const response = await axiosInstance.get(`/database/records/${recordId}/comments`);
      console.log('🔍 Comments response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      setComments(data || []);
    },
    onError: (error) => {
      console.error('Error fetching comments:', error);
      // Don't show error message for fetch, just log it
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }) => {
      const response = await axiosInstance.put(`/database/comments/${commentId}`, { text });
      return response.data;
    },
    onSuccess: (data) => {
      setComments(prev => prev.map(comment => 
        comment._id === data._id ? data : comment
      ));
      setEditingComment(null);
      setEditCommentText('');
      message.success('Comment updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      message.error('Failed to update comment. Please try again.');
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await axiosInstance.delete(`/database/comments/${commentId}`);
      return response.data;
    },
    onSuccess: (data, commentId) => {
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      message.success('Comment deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      message.error('Failed to delete comment. Please try again.');
    }
  });

  // Comment functions
  const handleSendComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate({ text: comment });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendComment();
    }
  };

  // Edit comment functions
  const handleEditComment = (comment) => {
    // Cancel any existing edit first
    if (editingComment && editingComment._id !== comment._id) {
      setEditingComment(null);
      setEditCommentText('');
    }
    setEditingComment(comment);
    setEditCommentText(comment.text);
  };

  const handleSaveEdit = () => {
    if (editCommentText.trim()) {
      updateCommentMutation.mutate({
        commentId: editingComment._id,
        text: editCommentText
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (commentId) => {
    // You can add a confirmation dialog here if needed
    deleteCommentMutation.mutate(commentId);
  };

  const handleSubmit = async (values) => {
    try {
      // Convert date/time values to appropriate format
      const processedValues = { ...values };
      Object.keys(processedValues).forEach(key => {
        if (dayjs.isDayjs(processedValues[key])) {
          const columns = Array.isArray(tableColumns) ? tableColumns : (tableColumns?.data || Object.values(tableColumns || {}));
          const column = columns.find(col => col.name === key);
          if (column?.dataType === 'time') {
            // For time field, save as HH:mm format
            processedValues[key] = processedValues[key].format('HH:mm');
          } else {
            // For date/datetime fields, save as ISO string
            processedValues[key] = processedValues[key].toISOString();
          }
        }
      });


      await updateRecordMutation.mutateAsync({
        recordId: record._id,
        data: processedValues
      });
    } catch (error) {
      // Error is handled by mutation
      console.error('Update failed:', error);
    }
  };

  // Get icon for data type (using centralized function)
  const getIconForDataType = (dataType) => {
    // Override for long_text to use text icon
    if (dataType === 'long_text') {
      return getDataTypeIcon('text');
    }
    // Override for datetime to use date icon
    if (dataType === 'datetime') {
      return getDataTypeIcon('date');
    }
    return getDataTypeIcon(dataType);
  };

  // Render input field based on data type
  const renderInputField = (column) => {
    const { name, dataType, isRequired, options, singleSelectConfig, multiSelectConfig } = column;

    const commonProps = {
      placeholder: `Enter ${name}`,
      style: { width: '100%' }
    };

    switch (dataType) {
      case 'text':
        return <Input {...commonProps} />;
      
      case 'long_text':
        return <TextArea {...commonProps} rows={3} />;
      
      case 'number':
      case 'currency':
      case 'percent':
        return <InputNumber {...commonProps} style={{ width: '100%' }} />;
      
      case 'email':
        return <Input type="email" {...commonProps} />;
      
      case 'url':
        return <Input type="url" {...commonProps} />;
      
      case 'phone':
        return <Input {...commonProps} />;
      
      case 'date':
        return <DatePicker {...commonProps} format="DD/MM/YYYY" />;
      
      case 'datetime':
        return <DatePicker showTime {...commonProps} format="DD/MM/YYYY HH:mm" />;
      
      case 'time':
        return <TimePicker {...commonProps} format="HH:mm" />;
      
      case 'rating':
        // Custom Rate component that works with Form.Item
        const RatingField = ({ value, onChange, ...props }) => {
          return (
            <div style={{ 
              padding: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Rate 
                allowHalf
                count={column.ratingConfig?.maxStars || 5}
                value={value || 0}
                onChange={onChange}
                style={{ 
                  fontSize: '36px',
                  color: column.ratingConfig?.color || '#faad14',
                  lineHeight: '1'
                }}
                character={column.ratingConfig?.icon === 'star' ? '★' : 
                         column.ratingConfig?.icon === 'heart' ? '♥' :
                         column.ratingConfig?.icon === 'like' ? '👍' :
                         column.ratingConfig?.icon === 'fire' ? '🔥' :
                         column.ratingConfig?.icon === 'trophy' ? '🏆' :
                         column.ratingConfig?.icon === 'thumbs' ? '👍' :
                         column.ratingConfig?.icon === 'smile' ? '😊' :
                         column.ratingConfig?.icon === 'check' ? '✓' :
                         column.ratingConfig?.icon === 'flag' ? '🚩' :
                         column.ratingConfig?.icon === 'diamond' ? '💎' :
                         column.ratingConfig?.icon === 'crown' ? '👑' :
                         column.ratingConfig?.icon === 'medal' ? '🏅' :
                         column.ratingConfig?.icon === 'gem' ? '💎' :
                         column.ratingConfig?.icon === 'coin' ? '🪙' :
                         column.ratingConfig?.icon === 'lightning' ? '⚡' :
                         column.ratingConfig?.icon === 'sun' ? '☀️' :
                         column.ratingConfig?.icon === 'moon' ? '🌙' :
                         column.ratingConfig?.icon === 'flower' ? '🌸' :
                         column.ratingConfig?.icon === 'leaf' ? '🍃' :
                         column.ratingConfig?.icon === 'paw' ? '🐾' :
                         column.ratingConfig?.icon === 'hand' ? '✋' :
                         '★'}
              />
              <div style={{
                fontSize: '12px',
                color: '#8c8c8c',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                {column.ratingConfig?.maxStars ? 
                  `Đánh giá từ 1 đến ${column.ratingConfig.maxStars}` : 
                  'Đánh giá từ 1 đến 5'
                }
              </div>
            </div>
          );
        };
        return <RatingField />;

      case 'checkbox':
        return (
          <Checkbox {...commonProps} style={{ fontSize: '14px' }}>
            {column.name || 'Check'}
          </Checkbox>
        );
      case 'single_select':
        const singleOptions = singleSelectConfig?.options || options || [];
        return (
          <Select {...commonProps} allowClear>
            {singleOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        );
      
      case 'multi_select':
        const multiOptions = multiSelectConfig?.options || options || [];
        return (
          <Select {...commonProps} mode="multiple" allowClear>
            {multiOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        );
      
      case 'lookup':
      case 'linked_table':
        return (
          <Button 
            type="dashed" 
            style={{ 
              width: '100%', 
              textAlign: 'left',
              border: '1px solid #d9d9d9',
              backgroundColor: '#fafafa',
              color: '#1890ff',
              height: '32px'
            }}
          >
            No records linked
          </Button>
        );
      
      default:
        return <Input {...commonProps} />;
    }
  };

  if (!record) return null;

  return (
    <>
      <style jsx>{`
        .edit-record-modal .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        .edit-record-modal .ant-modal-title {
          font-size: 16px;
          font-weight: 500;
          color: #262626;
        }
        .edit-record-modal .ant-modal-body {
          padding: 24px;
        }
        .edit-record-modal .ant-modal-footer {
          border-top: 1px solid #f0f0f0;
          padding: 10px 16px;
          text-align: right;
        }
        .edit-record-modal .ant-form-item {
          margin-bottom: 16px;
        }
        .edit-record-modal .ant-input,
        .edit-record-modal .ant-select-selector,
        .edit-record-modal .ant-picker {
          border-radius: 6px;
          border: 1px solid #d9d9d9;
        }
        .edit-record-modal .ant-input:focus,
        .edit-record-modal .ant-select-focused .ant-select-selector,
        .edit-record-modal .ant-picker-focused {
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      `}</style>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined className="text-blue-600" />
            <span className="text-lg font-medium">Edit record</span>
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={1200}
        className="edit-record-modal"
        destroyOnClose
        closeIcon={<span style={{ color: '#8c8c8c', fontSize: '18px' }}>×</span>}
      >

        <div style={{ display: 'flex', height: '600px' }}>
          {/* Left Column - Edit Form */}
          <div style={{ flex: 1, paddingRight: '16px', overflowY: 'auto' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="space-y-4"
            >
               {(Array.isArray(tableColumns) ? tableColumns : (tableColumns?.data || Object.values(tableColumns || {})))
                 ?.filter(column => {
                   // Ẩn các field lookup và formula
                   return !['lookup', 'linked_table', 'formula'].includes(column.dataType);
                 })
                 ?.map((column, index) => {
                  const { name, dataType, isRequired, description } = column;
                  
                return (
                  <div key={column._id || index} className="mb-6">
                    {dataType !== 'checkbox' && (
                      <div className="flex items-center gap-2 mb-2">
                        {getIconForDataType(dataType)}
                        <span className="text-sm font-medium text-gray-700">{name}</span>
                        {isRequired && <span className="text-red-500 text-sm">*</span>}
                      </div>
                    )}
                    
                    <Form.Item
                      name={name}
                      {...(dataType === "checkbox" ? { valuePropName: "checked" } : {})}
                      rules={[
                        ...(isRequired ? [{ required: true, message: `${name} is required` }] : [])
                      ]}
                      className="mb-0"
                    >
                      {renderInputField(column)}
                    </Form.Item>
                    
                    {description && (
                      <Text type="secondary" className="text-xs mt-1 block">
                        {description}
                      </Text>
                    )}
                  </div>
                );
                })}
            </Form>
          </div>

          {/* Right Column - Comments & Audits */}
          <div style={{ flex: 1, paddingLeft: '16px', borderLeft: '1px solid #f0f0f0' }}>
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              items={[
                {
                  key: 'comments',
                  label: 'Comments',
                  children: (
                    <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                      {/* Comments List */}
                      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                        {fetchCommentsMutation.isPending ? (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            color: '#8c8c8c'
                          }}>
                            <Text type="secondary">Loading comments...</Text>
                          </div>
                        ) : comments.length === 0 ? (
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            height: '100%',
                            color: '#8c8c8c'
                          }}>
                            <MessageOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                            <Text type="secondary">Start commenting!</Text>
                          </div>
                        ) : (
                          <div>
                            {comments.map(comment => (
                              <div key={comment._id || comment.id} style={{ 
                                marginBottom: '16px', 
                                padding: '12px', 
                                backgroundColor: '#f9f9f9', 
                                borderRadius: '8px' 
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <Text strong>{comment.author || comment.user?.name || 'Unknown User'}</Text>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {new Date(comment.createdAt || comment.timestamp).toLocaleString()}
                                    </Text>
                                    <Dropdown
                                      menu={{
                                        items: [
                                          {
                                            key: 'edit',
                                            label: 'Edit',
                                            icon: <EditOutlined />,
                                            onClick: () => handleEditComment(comment),
                                            disabled: editingComment && editingComment._id !== comment._id
                                          },
                                          {
                                            key: 'delete',
                                            label: 'Delete',
                                            icon: <DeleteOutlined />,
                                            onClick: () => handleDeleteComment(comment._id || comment.id),
                                            danger: true,
                                            disabled: editingComment && editingComment._id !== comment._id
                                          }
                                        ]
                                      }}
                                      trigger={['click']}
                                      placement="bottomRight"
                                    >
                                      <Button 
                                        type="text" 
                                        size="small" 
                                        icon={<MoreOutlined />}
                                        style={{ 
                                          color: editingComment && editingComment._id !== comment._id ? '#d9d9d9' : '#8c8c8c'
                                        }}
                                        disabled={editingComment && editingComment._id !== comment._id}
                                      />
                                    </Dropdown>
                                  </div>
                                </div>
                                
                                {editingComment && editingComment._id === comment._id ? (
                                  <div>
                                    <Input.TextArea
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      rows={3}
                                      style={{ marginBottom: '8px' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <Button 
                                        size="small"
                                        onClick={handleCancelEdit}
                                        icon={<CloseOutlined />}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        type="primary" 
                                        size="small"
                                        onClick={handleSaveEdit}
                                        icon={<CheckOutlined />}
                                        loading={updateCommentMutation.isPending}
                                        disabled={!editCommentText.trim()}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Text>{comment.text || comment.content}</Text>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Comment Input */}
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <Space>
                            <Button type="text" size="small" icon={<BoldOutlined />} />
                            <Button type="text" size="small" icon={<ItalicOutlined />} />
                            <Button type="text" size="small" icon={<UnderlineOutlined />} />
                            <Button type="text" size="small" icon={<StrikethroughOutlined />} />
                            <Button type="text" size="small" icon={<LinkOutlined />} />
                          </Space>
                        </div>
                        <Input.TextArea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder={editingComment ? "Finish editing the comment above first..." : "Comment..."}
                          rows={3}
                          style={{ marginBottom: '8px' }}
                          disabled={!!editingComment}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button 
                            type="primary" 
                            icon={<SendOutlined />}
                            onClick={handleSendComment}
                            disabled={!comment.trim() || !!editingComment}
                            loading={addCommentMutation.isPending}
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'audits',
                  label: 'Audits',
                  children: (
                    <div style={{ 
                      height: '500px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#8c8c8c'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <ClockCircleOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                        <Text type="secondary">No audit history available</Text>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </div>
        </div>

        {/* Footer with Save/Cancel buttons */}
        <div style={{ 
          borderTop: '1px solid #f0f0f0', 
          padding: '16px 0', 
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            loading={updateRecordMutation.isPending}
            onClick={() => form.submit()}
            style={{
              backgroundColor: '#f5f5f5',
              borderColor: '#d9d9d9',
              color: '#595959',
              fontWeight: 'normal'
            }}
          >
            Save record
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default EditRecordModal;
