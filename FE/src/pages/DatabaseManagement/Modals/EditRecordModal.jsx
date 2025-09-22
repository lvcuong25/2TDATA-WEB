import React, { useState, useEffect } from 'react';
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
  Divider
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
  FieldTimeOutlined
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../../utils/axiosInstance-cookie-only';
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

  // Reset form when modal opens/closes or record changes
  useEffect(() => {
    if (open && record) {
      // Convert record data to form values
      const formValues = {};
      Object.entries(record.data || {}).forEach(([key, value]) => {
        // Convert date/time strings to dayjs objects
        if (value && typeof value === 'string') {
          const column = tableColumns?.data?.find(col => col.name === key);
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
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error updating record:', error);
      message.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Convert date/time values to appropriate format
      const processedValues = { ...values };
      Object.keys(processedValues).forEach(key => {
        if (dayjs.isDayjs(processedValues[key])) {
          const column = tableColumns?.data?.find(col => col.name === key);
          if (column?.dataType === 'time') {
            // For time field, save as HH:mm format
            processedValues[key] = processedValues[key].format('HH:mm');
          } else {
            // For date/datetime fields, save as ISO string
            processedValues[key] = processedValues[key].toISOString();
          }
        }
      });

      // Debug: Log the processed values
      console.log('Edit form values:', values);
      console.log('Edit processed values:', processedValues);

      await updateRecordMutation.mutateAsync({
        recordId: record._id,
        data: processedValues
      });
    } catch (error) {
      // Error is handled by mutation
    } finally {
      setLoading(false);
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
        footer={[
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            loading={loading}
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
        ]}
        width={600}
        className="edit-record-modal"
        destroyOnClose
        closeIcon={<span style={{ color: '#8c8c8c', fontSize: '18px' }}>×</span>}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          {tableColumns?.data
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
      </Modal>
    </>
  );
};

export default EditRecordModal;
