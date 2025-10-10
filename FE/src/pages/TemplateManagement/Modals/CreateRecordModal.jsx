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
  PlusOutlined, 
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
  HeartOutlined,
  LikeOutlined,
  FireOutlined,
  TrophyOutlined,
  SmileOutlined,
  CheckCircleOutlined,
  FlagOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  SunOutlined,
  MoonOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../../utils/axiosInstance-cookie-only';
import dayjs from 'dayjs';
import { getDataTypeIcon } from '../Utils/dataTypeUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CreateRecordModal = ({ 
  open, 
  onCancel, 
  tableId, 
  tableColumns, 
  dateField, 
  selectedDate,
  onSuccess,
  initialData = {},
  stackByField,
  availableOptions = []
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.resetFields();
      // Set initial data
      const formData = { ...initialData };
      
      // Set default date if provided
      if (selectedDate && dateField) {
        formData[dateField] = selectedDate;
      }
      
      // Set form values
      if (Object.keys(formData).length > 0) {
        form.setFieldsValue(formData);
      }
    }
  }, [open, selectedDate, dateField, form, initialData]);

  // Create record mutation
  const createRecordMutation = useMutation({
    mutationFn: async ({ tableId, data }) => {
      const response = await axiosInstance.post('/database/records', {
        tableId,
        data
      });
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Record created successfully');
      form.resetFields();
      onSuccess?.(data);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create record');
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

      await createRecordMutation.mutateAsync({
        tableId,
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
                character={column.ratingConfig?.icon === 'star' ? <StarOutlined /> : 
                         column.ratingConfig?.icon === 'heart' ? <HeartOutlined /> :
                         column.ratingConfig?.icon === 'like' ? <LikeOutlined /> :
                         column.ratingConfig?.icon === 'fire' ? <FireOutlined /> :
                         column.ratingConfig?.icon === 'trophy' ? <TrophyOutlined /> :
                         column.ratingConfig?.icon === 'thumbs' ? <LikeOutlined /> :
                         column.ratingConfig?.icon === 'smile' ? <SmileOutlined /> :
                         column.ratingConfig?.icon === 'check' ? <CheckCircleOutlined /> :
                         column.ratingConfig?.icon === 'flag' ? <FlagOutlined /> :
                         column.ratingConfig?.icon === 'diamond' ? <CrownOutlined /> :
                         column.ratingConfig?.icon === 'crown' ? <CrownOutlined /> :
                         column.ratingConfig?.icon === 'medal' ? <TrophyOutlined /> :
                         column.ratingConfig?.icon === 'gem' ? <CrownOutlined /> :
                         column.ratingConfig?.icon === 'coin' ? <CrownOutlined /> :
                         column.ratingConfig?.icon === 'lightning' ? <ThunderboltOutlined /> :
                         column.ratingConfig?.icon === 'sun' ? <SunOutlined /> :
                         column.ratingConfig?.icon === 'moon' ? <MoonOutlined /> :
                         column.ratingConfig?.icon === 'flower' ? <EnvironmentOutlined /> :
                             column.ratingConfig?.icon === 'leaf' ? <EnvironmentOutlined /> :
                         column.ratingConfig?.icon === 'paw' ? <EnvironmentOutlined /> :
                         column.ratingConfig?.icon === 'hand' ? <LikeOutlined /> :
                         <StarOutlined />}
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
        // Use availableOptions if this is the stackByField, otherwise use column options
        const singleOptions = (column.name === stackByField && availableOptions.length > 0) 
          ? availableOptions 
          : (singleSelectConfig?.options || options || []);
        return (
          <Select {...commonProps} allowClear>
            {singleOptions.map(option => {
              // Handle both string and object options
              const optionValue = typeof option === 'object' ? (option.id || option.name) : option;
              const optionLabel = typeof option === 'object' ? option.name : option;
              return <Option key={optionValue} value={optionValue}>{optionLabel}</Option>;
            })}
          </Select>
        );
      
      case 'multi_select':
        const multiOptions = multiSelectConfig?.options || options || [];
        return (
          <Select {...commonProps} mode="multiple" allowClear>
            {multiOptions.map(option => {
              // Handle both string and object options
              const optionValue = typeof option === 'object' ? (option.id || option.name) : option;
              const optionLabel = typeof option === 'object' ? option.name : option;
              return <Option key={optionValue} value={optionValue}>{optionLabel}</Option>;
            })}
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

  return (
    <>
      <style jsx>{`
        .create-record-modal .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        .create-record-modal .ant-modal-title {
          font-size: 16px;
          font-weight: 500;
          color: #262626;
        }
        .create-record-modal .ant-modal-body {
          padding: 24px;
        }
        .create-record-modal .ant-modal-footer {
          border-top: 1px solid #f0f0f0;
          padding: 10px 16px;
          text-align: right;
        }
        .create-record-modal .ant-form-item {
          margin-bottom: 16px;
        }
        .create-record-modal .ant-input,
        .create-record-modal .ant-select-selector,
        .create-record-modal .ant-picker {
          border-radius: 6px;
          border: 1px solid #d9d9d9;
        }
        .create-record-modal .ant-input:focus,
        .create-record-modal .ant-select-focused .ant-select-selector,
        .create-record-modal .ant-picker-focused {
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      `}</style>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">New record</span>
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={[
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
        className="create-record-modal"
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

export default CreateRecordModal;
