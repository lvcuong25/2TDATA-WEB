import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';
import {
  Layout,
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Switch,
  ColorPicker,
  Select,
  Divider,
  Upload,
  message,
  Badge,
  Tooltip,
  Rate,
  Modal
} from 'antd';
import {
  UploadOutlined,
  SettingOutlined,
  EditOutlined,
  DragOutlined,
  PlusOutlined,
  SearchOutlined,
  CloudOutlined,
  QuestionCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';
import LinkedTableSelectModal from './Components/LinkedTableSelectModal';
import { getDataTypeIcon, getDataTypeColor } from './Utils/dataTypeUtils';

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

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Custom AddOptionInput component for dropdown
const AddOptionInput = ({ onAddOption, placeholder = "Enter new option" }) => {
  const [newOptionInput, setNewOptionInput] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);

  const handleAddOption = () => {
    if (newOptionInput.trim()) {
      onAddOption(newOptionInput.trim());
      setNewOptionInput('');
      setIsAddingOption(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddOption();
    } else if (e.key === 'Escape') {
      setNewOptionInput('');
      setIsAddingOption(false);
    }
  };

  return (
    <div style={{ 
      padding: '4px 6px', 
      borderTop: '1px solid #e8e8e8',
      backgroundColor: '#f8f9fa'
    }}>
      {isAddingOption ? (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Input
            value={newOptionInput}
            onChange={(e) => setNewOptionInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            size="small"
            style={{ flex: 1 }}
            autoFocus
          />
          <Button
            type="primary"
            size="small"
            onClick={handleAddOption}
            disabled={!newOptionInput.trim()}
            style={{ minWidth: 'auto', padding: '0 8px' }}
          >
            Add
          </Button>
          <Button
            size="small"
            onClick={() => {
              setNewOptionInput('');
              setIsAddingOption(false);
            }}
            style={{ minWidth: 'auto', padding: '0 8px' }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #e1e5e9',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          width: '100%',
          height: '28px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f0f7ff';
          e.target.style.borderColor = '#1890ff';
          e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.15)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#ffffff';
          e.target.style.borderColor = '#e1e5e9';
          e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          e.target.style.transform = 'translateY(0)';
        }}
        onClick={() => setIsAddingOption(true)}
        >
          <PlusOutlined style={{ 
            color: '#1890ff', 
            fontSize: '14px',
            fontWeight: 'bold'
          }} />
        </div>
      )}
    </div>
  );
};

const FormView = () => {
  const { databaseId, tableId, viewId } = useParams();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  // Watch all form values for formula dependencies
  const formValues = Form.useWatch([], form) || {};
  const [formConfig, setFormConfig] = useState({
    backgroundColor: '#fef7f0',
    hideBranding: false,
    hideBanner: true,
    redirectUrl: '',
    showSubmitAnother: false,
    showBlankForm: false,
    emailResponses: '',
    displayMessage: '',
    logoUrl: ''
  });

  // Linked table modal states
  const [linkedTableModalVisible, setLinkedTableModalVisible] = useState(false);
  const [currentLinkedTableColumn, setCurrentLinkedTableColumn] = useState(null);
  const [selectedLinkedTableValue, setSelectedLinkedTableValue] = useState(null);

  // Field search state
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');

  // Field visibility states
  const [fieldVisibility, setFieldVisibility] = useState({});
  const [selectAllFields, setSelectAllFields] = useState(true);

  // Custom color picker state
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);


  // Fetch view details
  const { data: viewData, isLoading: viewLoading } = useQuery({
    queryKey: ['view', viewId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/views/${viewId}`);
      return response.data.data;
    },
    enabled: !!viewId
  });

  // Fetch table structure for form fields
  const { data: tableStructure, isLoading: tableStructureLoading } = useQuery({
    queryKey: ['tableStructure', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/structure`);
      return response.data.data;
    },
    enabled: !!tableId
  });

  // Update view mutation
  const updateViewMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await axiosInstance.put(`/database/views/${viewId}`, updateData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Form settings updated successfully');
      queryClient.invalidateQueries(['view', viewId]);
    },
    onError: (error) => {
      console.error('Error updating view:', error);
      toast.error(error.response?.data?.message || 'Failed to update form settings');
    }
  });

  // Submit form data mutation
  const submitFormMutation = useMutation({
    mutationFn: async (formData) => {
      
      const response = await axiosInstance.post('/database/records', {
        tableId,
        data: formData
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Biểu mẫu đã được gửi thành công! Record ID: ${data.data?._id || 'N/A'}`);
      form.resetFields();
      
      // Invalidate records query to refresh data
      queryClient.invalidateQueries(['records', tableId]);
    },
    onError: (error) => {
      console.error('❌ Error submitting form:', error);
      console.error('📄 Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Không thể gửi biểu mẫu';
      toast.error(`Lỗi: ${errorMessage}`);
    }
  });

  useEffect(() => {
    if (viewData) {
      const newConfig = {
        ...formConfig,
        ...viewData.config
      };
      setFormConfig(newConfig);
      if (viewData.config?.logoUrl) {
        setLogoUrl(viewData.config.logoUrl);
      }
    }
  }, [viewData]);

  // Initialize field visibility when table structure changes
  useEffect(() => {
    if (tableStructure?.columns) {
      const initialVisibility = {};
      tableStructure.columns
        .filter(column => !['lookup', 'formula'].includes(column.dataType))
        .forEach(column => {
          initialVisibility[column._id] = true; // Default to visible
        });
      setFieldVisibility(initialVisibility);
    }
  }, [tableStructure]);

  const handleFormSubmit = (values) => {
    
    // Process currency fields to combine amount and currency
    const processedValues = { ...values };
    
    // Find currency columns and process them
    if (tableStructure?.columns) {
      tableStructure.columns.forEach(column => {
        if (column.dataType === 'currency') {
          const amountField = `${column.name}_amount`;
          const currencyField = `${column.name}_currency`;
          
          if (values[amountField] !== undefined && values[currencyField] !== undefined) {
            processedValues[column.name] = {
              amount: values[amountField],
              currency: values[currencyField]
            };
            // Remove the temporary fields
            delete processedValues[amountField];
            delete processedValues[currencyField];
          }
        }
      });
    }
    
    // Don't set formData with processed values to avoid rendering issues
    submitFormMutation.mutate(processedValues);
  };

  const handleConfigUpdate = (key, value) => {
    const newConfig = { ...formConfig, [key]: value };
    setFormConfig(newConfig);
    updateViewMutation.mutate({ config: newConfig });
  };

  const handleCustomColorSelect = (color) => {
    setCustomColor(color);
    handleConfigUpdate('backgroundColor', color);
    setColorPickerVisible(false);
    // Force immediate update for form card
    setTimeout(() => {
      const formCard = document.querySelector('.ant-card');
      if (formCard) {
        formCard.style.background = color;
      }
    }, 0);
  };

  // Logo upload handler
  const handleLogoUpload = async (file) => {
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file); // Use 'image' field name as expected by backend
      
      const response = await axiosInstance.post('/view/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success && response.data.data) {
        const uploadedUrl = response.data.data.url;
        setLogoUrl(uploadedUrl);
        handleConfigUpdate('logoUrl', uploadedUrl);
        message.success('Logo đã được tải lên thành công!');
      } else {
        throw new Error('Upload response không hợp lệ');
      }
      
      return false; // Prevent default upload behavior
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi tải lên logo!';
      message.error(errorMessage);
      console.error('Logo upload error:', error);
      return false;
    } finally {
      setLogoUploading(false);
    }
  };

  // Linked table modal handlers
  const handleOpenLinkedTableModal = (column) => {
    setCurrentLinkedTableColumn(column);
    setLinkedTableModalVisible(true);
  };

  const handleCloseLinkedTableModal = () => {
    setLinkedTableModalVisible(false);
    setCurrentLinkedTableColumn(null);
    setSelectedLinkedTableValue(null);
  };

  const handleSelectLinkedTableValue = (value) => {
    if (currentLinkedTableColumn) {
      const valueField = currentLinkedTableColumn.linkedTableConfig?.linkedColumnId || '_id';
      const displayField = currentLinkedTableColumn.linkedTableConfig?.displayColumnId || 'name';
      
      // Set form value
      if (currentLinkedTableColumn.linkedTableConfig?.allowMultiple) {
        form.setFieldValue(currentLinkedTableColumn.name, value);
      } else {
        form.setFieldValue(currentLinkedTableColumn.name, value[0] || value);
      }
      setSelectedLinkedTableValue(value);
      handleCloseLinkedTableModal();
    }
  };

  // Function to add new option to single select or multi select column
  const handleAddNewOption = (column, newOption) => {
    if (!newOption || !newOption.trim()) return;
    
    let updatedColumnData;
    
    if (column.dataType === 'single_select') {
      const currentOptions = column.singleSelectConfig?.options || [];
      const updatedOptions = [...currentOptions, newOption.trim()];
      
      updatedColumnData = {
        ...column,
        singleSelectConfig: {
          ...column.singleSelectConfig,
          options: updatedOptions
        }
      };
    } else if (column.dataType === 'multi_select') {
      const currentOptions = column.multiSelectConfig?.options || [];
      const updatedOptions = [...currentOptions, newOption.trim()];
      
      updatedColumnData = {
        ...column,
        multiSelectConfig: {
          ...column.multiSelectConfig,
          options: updatedOptions
        }
      };
    } else {
      return; // Unsupported column type
    }
    
    // Call API to update column
    axiosInstance.put(`/database/columns/${column._id}`, updatedColumnData)
      .then(() => {
        toast.success('Option đã được thêm thành công!');
        queryClient.invalidateQueries(['tableStructure', tableId]);
      })
      .catch((error) => {
        console.error('Error adding option:', error);
        toast.error('Không thể thêm option mới');
      });
  };


  // Use the consistent icon function from utils
  const getFieldIcon = (dataType) => {
    return getDataTypeIcon(dataType);
  };

  // Use the consistent color function from utils
  const getFieldColor = (dataType) => {
    return getDataTypeColor(dataType);
  };

  // Helper function to filter form fields
  const getFilteredFormFields = (columns) => {
    if (!columns) return [];
    return columns.filter(column => {
      // Filter out lookup and formula fields
      if (['lookup', 'formula'].includes(column.dataType)) {
        return false;
      }
      // Filter by search term
      if (fieldSearchTerm) {
        return column.name.toLowerCase().includes(fieldSearchTerm.toLowerCase());
      }
      return true;
    });
  };

  // Handle select all fields toggle
  const handleSelectAllFields = (checked) => {
    setSelectAllFields(checked);
  if (tableStructure?.columns) {
      const newVisibility = {};
      tableStructure.columns
        .filter(column => !['lookup', 'formula'].includes(column.dataType))
        .forEach(column => {
          newVisibility[column._id] = checked;
        });
      setFieldVisibility(newVisibility);
    }
  };

  // Handle individual field visibility toggle
  const handleFieldVisibilityToggle = (columnId, checked) => {
    setFieldVisibility(prev => ({
      ...prev,
      [columnId]: checked
    }));
    
    // Update select all state based on individual field states
    if (tableStructure?.columns) {
      const visibleFields = tableStructure.columns
        .filter(column => !['lookup', 'formula'].includes(column.dataType))
        .filter(column => {
          if (column._id === columnId) {
            return checked;
          }
          return fieldVisibility[column._id] !== false;
        });
      
      const totalFields = tableStructure.columns.filter(column => !['lookup', 'formula'].includes(column.dataType)).length;
      setSelectAllFields(visibleFields.length === totalFields);
    }
  };

  if (viewLoading || tableStructureLoading) {
    return <div>Loading...</div>;
  }


  return (
    <>
      <style>{customScrollbarStyles}</style>
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>

      <Layout>
        <Content style={{ padding: '24px' }}>
          <Row gutter={24}>
            {/* Form Preview */}
            <Col span={16}>
              {/* Banner */}
              {!formConfig.hideBranding && (
              <Card 
                style={{ 
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '40px', textAlign: 'center' }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  left: '-50px',
                  width: '200px',
                  height: '200px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  filter: 'blur(40px)'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-100px',
                  right: '-100px',
                  width: '300px',
                  height: '300px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '50%',
                  filter: 'blur(60px)'
                }} />
                
                <div style={{ 
                  position: 'relative', 
                  zIndex: 1,
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  display: 'inline-block',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#1890ff', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {formConfig.logoUrl ? (
                      <img 
                        src={formConfig.logoUrl} 
                        alt="Logo" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }} 
                      />
                    ) : (
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>2T</span>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '12px',
                      height: '12px',
                      background: '#52c41a',
                      borderRadius: '50%'
                    }} />
                  </div>
                </div>
              </Card>
              )}

              <Card 
                style={{ 
                  minHeight: '500px',
                  background: formConfig.backgroundColor,
                  border: '1px solid #d9d9d9',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: '40px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <Upload
                    beforeUpload={handleLogoUpload}
                    showUploadList={false}
                    accept="image/*"
                    disabled={logoUploading}
                  >
                  <Button 
                    type="dashed" 
                    icon={<UploadOutlined />}
                    style={{ marginBottom: '24px' }}
                    size="large"
                      loading={logoUploading}
                  >
                      {logoUploading ? 'Đang tải lên...' : 'Tải lên Logo'}
                  </Button>
                  </Upload>
                  <Title level={2} style={{ margin: '0 0 8px 0' }}>Biểu mẫu</Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>Thêm mô tả biểu mẫu</Text>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleFormSubmit}
                  style={{ maxWidth: '600px', margin: '0 auto' }}
                >
                  {tableStructure?.columns && tableStructure.columns.length > 0 ? (
                    tableStructure.columns
                      .filter(column => {
                        // Filter out lookup and formula fields
                        if (['lookup', 'formula'].includes(column.dataType)) {
                          return false;
                        }
                        // Only show fields that are visible (selected)
                        return fieldVisibility[column._id] !== false;
                      })
                      .map((column) => (
                    <Form.Item
                      key={column._id}
                      label={
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: '#262626',
                          marginBottom: '8px'
                        }}>
                          {column.name}
                        </div>
                      }
                      name={column.dataType === 'currency' ? undefined : column.name}
                      rules={column.dataType === 'currency' ? [] : [{ required: column.isRequired }]}
                      style={{ marginBottom: '20px' }}
                    >
                      {column.dataType === 'text' && (
                        <Input 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'number' && (
                        <Input 
                          type="number" 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'email' && (
                        <Input 
                          type="email" 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'date' && (
                        <Input 
                          type="date" 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'boolean' && (
                        <Select 
                          placeholder={`Chọn ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            height: '40px'
                          }}
                        >
                          <Select.Option value={true}>Có</Select.Option>
                          <Select.Option value={false}>Không</Select.Option>
                        </Select>
                      )}
                      {column.dataType === 'checkbox' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input 
                            type="checkbox" 
                            style={{ 
                              width: '18px', 
                              height: '18px',
                              accentColor: column.checkboxConfig?.color || '#52c41a'
                            }}
                          />
                          <Text style={{ fontSize: '14px', color: '#262626' }}>
                            {column.name}
                          </Text>
                        </div>
                      )}
                      {column.dataType === 'phone' && (
                        <Input 
                          type="tel" 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'textarea' && (
                        <TextArea 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          rows={4}
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'select' && (
                        <Select 
                          placeholder={`Chọn ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            height: '40px'
                          }}
                        >
                          {column.options?.map((option) => (
                            <Select.Option key={option} value={option}>{option}</Select.Option>
                          ))}
                        </Select>
                      )}
                      {column.dataType === 'multiselect' && (
                        <Select 
                          mode="multiple"
                          placeholder={`Chọn ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            minHeight: '40px'
                          }}
                        >
                          {column.options?.map((option) => (
                            <Select.Option key={option} value={option}>{option}</Select.Option>
                          ))}
                        </Select>
                      )}
                      {column.dataType === 'currency' && (
                        <div style={{ position: 'relative' }}>
                          <Form.Item
                            name={`${column.name}_amount`}
                            style={{ margin: 0 }}
                            rules={[{ required: column.isRequired }]}
                          >
                            <Input 
                              type="number" 
                              placeholder={`Nhập ${column.name.toLowerCase()}`} 
                              size="large"
                              style={{ 
                                borderRadius: '8px',
                                border: '1px solid #d9d9d9',
                                height: '40px',
                                fontSize: '14px',
                                paddingRight: '80px'
                              }}
                            />
                          </Form.Item>
                          <Form.Item
                            name={`${column.name}_currency`}
                            style={{ 
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              margin: 0,
                              width: '70px'
                            }}
                            initialValue="VND"
                          >
                            <Select
                              size="large"
                              bordered={false}
                              style={{ 
                                height: '40px',
                                background: 'transparent'
                              }}
                              dropdownStyle={{
                                borderRadius: '8px'
                              }}
                            >
                              <Select.Option value="VND">VNĐ</Select.Option>
                              <Select.Option value="USD">USD</Select.Option>
                              <Select.Option value="EUR">EUR</Select.Option>
                              <Select.Option value="JPY">JPY</Select.Option>
                              <Select.Option value="GBP">GBP</Select.Option>
                              <Select.Option value="CNY">CNY</Select.Option>
                              <Select.Option value="KRW">KRW</Select.Option>
                              <Select.Option value="THB">THB</Select.Option>
                              <Select.Option value="SGD">SGD</Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                      )}
                      {column.dataType === 'url' && (
                        <Input 
                          type="url" 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'time' && (
                        <Input 
                          type="time" 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'datetime' && (
                        <Input 
                          type="datetime-local" 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                      {column.dataType === 'linked_table' && (
                        <div style={{ position: 'relative' }}>
                          <Input
                            placeholder={`Chọn từ ${column.linkedTableConfig?.linkedTableName || 'bảng liên kết'}`}
                            size="large"
                            readOnly
                            value={(() => {
                              if (!selectedLinkedTableValue) return '';
                              if (Array.isArray(selectedLinkedTableValue)) {
                                return selectedLinkedTableValue.map(item => item.label || item.name).join(', ');
                              }
                              return selectedLinkedTableValue.label || selectedLinkedTableValue.name || '';
                            })()}
                            style={{ 
                              borderRadius: '8px',
                              border: '1px solid #d9d9d9',
                              height: '40px',
                              fontSize: '14px',
                              paddingRight: '50px',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleOpenLinkedTableModal(column)}
                          />
                          <Button
                            type="text"
                            icon={<LinkOutlined />}
                            size="small"
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: '24px',
                              width: '24px',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#722ed1',
                              border: 'none',
                              background: 'transparent'
                            }}
                            onClick={() => handleOpenLinkedTableModal(column)}
                            title="Chọn từ bảng liên kết"
                          />
                        </div>
                      )}
                      {column.dataType === 'rating' && (
                        // Custom RatingField component that works with Form.Item
                        ((props) => {
                          const RatingField = ({ value, onChange, ...otherProps }) => {
                            return (
                              <div style={{ 
                                padding: '16px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px'
                              }}>
                                <Rate 
                                  count={column.ratingConfig?.maxStars || 5}
                                  value={value || column.ratingConfig?.defaultValue || 0}
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
                        })()
                      )}
                      {column.dataType === 'single_select' ? (
                        <Select 
                          placeholder={`Chọn ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            height: '40px'
                          }}
                          dropdownRender={(menu) => (
                            <div>
                              {menu}
                              <AddOptionInput 
                                onAddOption={(newOption) => handleAddNewOption(column, newOption)} 
                              />
                            </div>
                          )}
                        >
                          {(column.options || 
                            column.singleSelectConfig?.options || 
                            column.multiSelectConfig?.options || 
                            column.selectConfig?.options || 
                            column.enumConfig?.options || 
                            ['Low', 'Medium', 'High']).map((option) => (
                            <Select.Option key={option} value={option}>{option}</Select.Option>
                          ))}
                        </Select>
                      ) : !['text', 'number', 'email', 'date', 'boolean', 'checkbox', 'phone', 'textarea', 'select', 'multiselect', 'currency', 'url', 'time', 'datetime', 'formula', 'lookup', 'linked_table', 'rating'].includes(column.dataType) && (
                        <Input 
                          placeholder={`Nhập ${column.name.toLowerCase()}`} 
                          size="large"
                          style={{ 
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
                            height: '40px',
                            fontSize: '14px'
                          }}
                        />
                      )}
                    </Form.Item>
                    ))
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '40px',
                      color: '#8c8c8c'
                    }}>
                      <Text>Chưa có trường nào trong bảng này</Text>
                    </div>
                  )}

                  <Form.Item style={{ textAlign: 'center', marginTop: '40px' }}>
                    <Space size="large">
                      <Button 
                        onClick={() => form.resetFields()}
                        size="large"
                        style={{ 
                          minWidth: '120px',
                          height: '40px',
                          borderRadius: '8px',
                          border: '1px solid #d9d9d9',
                          background: '#fff'
                        }}
                      >
                        Xóa biểu mẫu
                      </Button>
                      <Button 
                        type="primary" 
                        htmlType="submit"
                        loading={submitFormMutation.isPending}
                        size="large"
                        style={{ 
                          minWidth: '120px',
                          height: '40px',
                          borderRadius: '8px',
                          background: '#1890ff',
                          border: 'none'
                        }}
                      >
                        Gửi
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>

                {!formConfig.hideBranding && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '32px',
                    color: '#8c8c8c',
                    fontSize: '12px'
                  }}>
                    Powered by 2TDATA
                  </div>
                )}
              </Card>
            </Col>

            {/* Settings Sidebar */}
            <Col span={8}>
              <Card 
                title="Cài đặt biểu mẫu" 
                size="small"
                style={{ 
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'sticky',
                  top: '24px',
                  maxHeight: 'calc(100vh - 48px)',
                  overflow: 'hidden'
                }}
                bodyStyle={{ 
                  padding: '20px',
                  maxHeight: 'calc(100vh - 120px)',
                  overflow: 'auto'
                }}
              >
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Title level={5} style={{ margin: 0 }}>Trường biểu mẫu</Title>
                    <Badge count={getFilteredFormFields(tableStructure?.columns).length} showZero color="#1890ff" />
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<PlusOutlined />}
                      style={{ marginBottom: '12px', width: '100%' }}
                    >
                      Thêm trường
                    </Button>
                    <Input 
                      placeholder="Tìm kiếm trường..." 
                      size="small"
                      prefix={<SearchOutlined />}
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      style={{ marginBottom: '12px', borderRadius: '6px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <Switch 
                        size="small" 
                        checked={selectAllFields}
                        onChange={handleSelectAllFields}
                        style={{ marginRight: '8px' }} 
                      />
                      <Text>Chọn tất cả trường</Text>
                    </div>
                  </div>

                  <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {getFilteredFormFields(tableStructure?.columns)?.map((column) => (
                      <div key={column._id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '8px',
                        padding: '12px',
                        background: '#f9f9f9',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0'
                      }}>
                        <DragOutlined style={{ marginRight: '8px', color: '#8c8c8c' }} />
                        <Switch 
                          size="small" 
                          checked={fieldVisibility[column._id] !== false}
                          onChange={(checked) => handleFieldVisibilityToggle(column._id, checked)}
                          style={{ marginRight: '12px' }} 
                        />
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '6px',
                          background: getFieldColor(column.dataType),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginRight: '12px'
                        }}>
                          {React.cloneElement(getFieldIcon(column.dataType), { 
                            style: { 
                              color: 'white', 
                              fontSize: '12px' 
                            } 
                          })}
                        </div>
                        <Text strong>{column.name}</Text>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider />

                <div style={{ marginBottom: '32px' }}>
                  <Title level={5} style={{ marginBottom: '16px' }}>Cài đặt giao diện</Title>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <Text strong style={{ display: 'block', marginBottom: '12px' }}>Màu nền</Text>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { color: '#ffffff', name: 'Trắng' },
                        { color: '#f8f9fa', name: 'Xám nhạt' },
                        { color: '#e9ecef', name: 'Xám' },
                        { color: '#fef7f0', name: 'Hồng nhạt' },
                        { color: '#fff7e6', name: 'Vàng nhạt' },
                        { color: '#f6ffed', name: 'Xanh lá nhạt' },
                        { color: '#e6f7ff', name: 'Xanh dương nhạt' },
                        { color: '#f9f0ff', name: 'Tím nhạt' },
                        { color: '#ff4d4f', name: 'Đỏ' },
                        { color: '#fa8c16', name: 'Cam' },
                        { color: '#fadb14', name: 'Vàng' },
                        { color: '#52c41a', name: 'Xanh lá' },
                        { color: '#13c2c2', name: 'Xanh ngọc' },
                        { color: '#1890ff', name: 'Xanh dương' },
                        { color: '#722ed1', name: 'Tím' },
                        { color: '#eb2f96', name: 'Hồng' }
                      ].map((item) => (
                        <Tooltip key={item.color} title={item.name} placement="top">
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: item.color,
                            border: formConfig.backgroundColor === item.color ? '2px solid #1890ff' : '2px solid #d9d9d9',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                              transition: 'all 0.2s',
                              boxShadow: formConfig.backgroundColor === item.color ? '0 2px 8px rgba(24, 144, 255, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                            onClick={() => {
                              handleConfigUpdate('backgroundColor', item.color);
                              // Force immediate update for form card
                              setTimeout(() => {
                                const formCard = document.querySelector('.ant-card');
                                if (formCard) {
                                  formCard.style.background = item.color;
                                }
                              }, 0);
                            }}
                            onMouseEnter={(e) => {
                              if (formConfig.backgroundColor !== item.color) {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (formConfig.backgroundColor !== item.color) {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                              }
                            }}
                        >
                          {formConfig.backgroundColor === item.color && (
                              <span style={{ color: item.color === '#ffffff' ? '#000' : '#fff', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                          )}
                        </div>
                        </Tooltip>
                      ))}
                      <Tooltip title="Thêm màu tùy chỉnh" placement="top">
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '2px dashed #d9d9d9',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                            color: '#8c8c8c',
                            transition: 'all 0.2s',
                            background: 'linear-gradient(45deg, #f0f0f0, #ffffff)'
                          }}
                          onClick={() => setColorPickerVisible(true)}
                          onMouseEnter={(e) => {
                            e.target.style.borderColor = '#1890ff';
                            e.target.style.color = '#1890ff';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.borderColor = '#d9d9d9';
                            e.target.style.color = '#8c8c8c';
                            e.target.style.transform = 'scale(1)';
                        }}
                      >
                        <PlusOutlined />
                      </div>
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <Switch 
                      size="small" 
                      checked={formConfig.hideBranding}
                      onChange={(checked) => handleConfigUpdate('hideBranding', checked)}
                      style={{ marginRight: '12px' }} 
                    />
                    <Text style={{ fontWeight: 500 }}>Ẩn thương hiệu</Text>
                  </div>
                  
                </div>

                <Divider />

                <div>
                  <Title level={5} style={{ marginBottom: '16px' }}>Cài đặt sau khi gửi biểu mẫu</Title>
                  
                  {/* Redirect URL */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Switch 
                        size="small" 
                        checked={formConfig.redirectUrl !== ''}
                        onChange={(checked) => handleConfigUpdate('redirectUrl', checked ? 'https://example.com' : '')}
                        style={{ marginRight: '12px' }} 
                      />
                      <Text style={{ fontWeight: 500 }}>Chuyển hướng đến URL</Text>
                    </div>
                    {formConfig.redirectUrl && (
                      <Input 
                        placeholder="https://example.com" 
                        size="small"
                        value={formConfig.redirectUrl}
                        onChange={(e) => handleConfigUpdate('redirectUrl', e.target.value)}
                        style={{ marginLeft: '24px', borderRadius: '6px' }}
                      />
                    )}
                  </div>
                  
                  {/* Show Submit Another Button */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <Switch 
                      size="small" 
                      checked={formConfig.showSubmitAnother}
                      onChange={(checked) => handleConfigUpdate('showSubmitAnother', checked)}
                      style={{ marginRight: '12px' }} 
                    />
                    <Text style={{ fontWeight: 500 }}>Hiển thị nút 'Gửi biểu mẫu khác'</Text>
                  </div>
                  
                  {/* Show Blank Form After 5 Seconds */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <Switch 
                      size="small" 
                      checked={formConfig.showBlankForm}
                      onChange={(checked) => handleConfigUpdate('showBlankForm', checked)}
                      style={{ marginRight: '12px' }} 
                    />
                    <Text style={{ fontWeight: 500 }}>Hiển thị biểu mẫu trống sau 5 giây</Text>
                  </div>
                  
                  {/* Email Responses */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Switch 
                        size="small" 
                        checked={formConfig.emailResponses !== ''}
                        onChange={(checked) => handleConfigUpdate('emailResponses', checked ? 'anhltn2003@gmail.com' : '')}
                        style={{ marginRight: '12px' }} 
                      />
                      <Text style={{ fontWeight: 500 }}>Gửi phản hồi qua email đến</Text>
                    </div>
                    {formConfig.emailResponses && (
                    <Input 
                      placeholder="anhltn2003@gmail.com" 
                      size="small"
                        value={formConfig.emailResponses}
                        onChange={(e) => handleConfigUpdate('emailResponses', e.target.value)}
                      style={{ marginLeft: '24px', borderRadius: '6px' }}
                    />
                    )}
                  </div>
                  
                  {/* Display Message */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Switch 
                        size="small" 
                        checked={formConfig.displayMessage !== ''}
                        onChange={(checked) => handleConfigUpdate('displayMessage', checked ? 'Cảm ơn bạn đã gửi biểu mẫu!' : '')}
                        style={{ marginRight: '12px' }} 
                      />
                      <Text style={{ fontWeight: 500 }}>Hiển thị thông báo</Text>
                    </div>
                    {formConfig.displayMessage && (
                      <Input.TextArea 
                        placeholder="Cảm ơn bạn đã gửi biểu mẫu!" 
                        size="small"
                        value={formConfig.displayMessage}
                        onChange={(e) => handleConfigUpdate('displayMessage', e.target.value)}
                        style={{ marginLeft: '24px', borderRadius: '6px' }}
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>

      {/* Custom Color Picker Modal */}
      <Modal
        title="Chọn màu tùy chỉnh"
        open={colorPickerVisible}
        onCancel={() => setColorPickerVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setColorPickerVisible(false)}>
            Hủy
          </Button>,
          <Button 
            key="ok" 
            type="primary" 
            onClick={() => handleCustomColorSelect(customColor)}
          >
            Áp dụng
          </Button>
        ]}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <ColorPicker
            value={customColor}
            onChange={(color) => setCustomColor(color.toHexString())}
            showText
            style={{ marginBottom: '20px' }}
          />
          <div style={{ 
            marginTop: '20px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <Text strong>Màu đã chọn:</Text>
            <div style={{
              width: '100%',
              height: '40px',
              background: customColor,
              borderRadius: '6px',
              marginTop: '8px',
              border: '1px solid #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text style={{ 
                color: customColor === '#ffffff' ? '#000' : '#fff',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}>
                {customColor}
              </Text>
            </div>
          </div>
        </div>
      </Modal>

      {/* Linked Table Modal */}
      <LinkedTableSelectModal
        visible={linkedTableModalVisible}
        onCancel={handleCloseLinkedTableModal}
        onSelect={handleSelectLinkedTableValue}
        column={currentLinkedTableColumn}
        record={{ _id: 'form-record', data: {} }}
        updateRecordMutation={{
          mutate: (data, options) => {
            // For form, we just update the form value
            if (data.data && currentLinkedTableColumn) {
              form.setFieldValue(currentLinkedTableColumn.name, data.data[currentLinkedTableColumn.name]);
            }
            options?.onSuccess?.();
          }
        }}
      />
    </Layout>
    </>
  );
};

export default FormView;
