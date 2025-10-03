import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Button, message, Spin, Alert, Typography, Divider } from 'antd';
import { EditOutlined, SearchOutlined, LinkOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';

const { Option } = Select;
const { Text, Title } = Typography;

const EditLookupModal = ({ 
  visible, 
  onCancel, 
  column, 
  record, 
  currentValue,
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState(null);
  const queryClient = useQueryClient();
  const pageSize = 20;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSearchValue('');
      setCurrentPage(1);
      setSelectedValue(currentValue);
      form.setFieldsValue({
        lookupValue: currentValue
      });
    } else {
      form.resetFields();
      setSelectedValue(null);
    }
  }, [visible, currentValue, form]);

  // Fetch lookup data
  const { data: lookupData, isLoading, error } = useQuery({
    queryKey: ['lookupData', column?._id, searchValue, currentPage],
    queryFn: async () => {
      if (!column || !column.lookupConfig?.linkedTableId || !column.lookupConfig?.lookupColumnId) {
        return { data: { options: [], totalCount: 0 } };
      }

      const params = new URLSearchParams();
      if (searchValue) params.append('search', searchValue);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await axiosInstance.get(
        `/database/columns/${column._id}/lookup-data?${params.toString()}`
      );
      
      return response.data;
    },
    enabled: visible && !!column && !!column.lookupConfig?.linkedTableId && !!column.lookupConfig?.lookupColumnId,
    staleTime: 30 * 1000,
  });

  // Update lookup value mutation
  const updateLookupMutation = useMutation({
    mutationFn: async (lookupValue) => {
      const response = await axiosInstance.put(
        `/database/columns/${column._id}/records/${record._id}/lookup`,
        { lookupValue }
      );
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Lookup value updated successfully!');
      queryClient.invalidateQueries(['records', record.tableId]);
      queryClient.invalidateQueries(['record', record._id]);
      onSuccess?.(data);
      onCancel();
    },
    onError: (error) => {
      console.error('Error updating lookup value:', error);
      message.error(error.response?.data?.message || 'Failed to update lookup value');
    }
  });

  const options = lookupData?.data?.options || [];
  const totalCount = lookupData?.data?.totalCount || 0;

  const handleSearch = (value) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleSelect = (selectedValue) => {
    const selectedOption = options.find(opt => opt.value === selectedValue);
    setSelectedValue(selectedOption);
    form.setFieldsValue({
      lookupValue: selectedOption
    });
  };

  const handleClear = () => {
    setSelectedValue(null);
    form.setFieldsValue({
      lookupValue: null
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      updateLookupMutation.mutate(values.lookupValue);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedValue(currentValue);
    onCancel();
  };

  // Get display value for current selection
  const getDisplayValue = () => {
    if (!selectedValue) return null;
    
    if (typeof selectedValue === 'object' && selectedValue.label) {
      return selectedValue.label;
    }
    
    return String(selectedValue);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditOutlined style={{ color: '#1890ff' }} />
          <span>Edit Lookup Value</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={updateLookupMutation.isPending}
          disabled={!selectedValue}
        >
          Update Lookup Value
        </Button>
      ]}
    >
      <div style={{ marginBottom: '16px' }}>
        <Title level={5} style={{ margin: 0 }}>
          Column: {column?.name}
        </Title>
        <Text type="secondary">
          {column?.lookupConfig?.linkedTableName && (
            <>
              <LinkOutlined style={{ marginRight: '4px' }} />
              Linked to: {column.lookupConfig.linkedTableName}
            </>
          )}
        </Text>
      </div>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          lookupValue: currentValue
        }}
      >
        <Form.Item
          name="lookupValue"
          label="Select Lookup Value"
          rules={[
            { required: true, message: 'Please select a lookup value' }
          ]}
        >
          <Select
            placeholder="Search and select a value..."
            showSearch
            allowClear
            loading={isLoading}
            onSearch={handleSearch}
            onChange={handleSelect}
            onClear={handleClear}
            filterOption={false}
            notFoundContent={isLoading ? <Spin size="small" /> : 'No data found'}
            style={{ width: '100%' }}
            suffixIcon={<SearchOutlined />}
            dropdownStyle={{ maxHeight: 300 }}
            value={selectedValue?.value || selectedValue}
          >
            {options.map((option) => (
              <Option key={option.value} value={option.value}>
                <div>
                  <div style={{ fontWeight: '500' }}>{option.label}</div>
                  {column?.lookupConfig?.linkedTableName && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#999',
                      marginTop: '2px'
                    }}>
                      from {column.lookupConfig.linkedTableName}
                    </div>
                  )}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Current Selection Display */}
        {selectedValue && (
          <Alert
            message="Selected Value"
            description={
              <div>
                <div><strong>Label:</strong> {getDisplayValue()}</div>
                <div><strong>Value:</strong> {selectedValue.value || selectedValue}</div>
                {selectedValue.data && (
                  <div><strong>Additional Data:</strong> Available</div>
                )}
              </div>
            }
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}

        {/* Error Display */}
        {error && (
          <Alert
            message="Error loading lookup data"
            description={error.message || 'Failed to load lookup options'}
            type="error"
            style={{ marginTop: '16px' }}
          />
        )}

        {/* Pagination Info */}
        {totalCount > pageSize && (
          <div style={{ 
            marginTop: '16px', 
            textAlign: 'center',
            color: '#666',
            fontSize: '12px'
          }}>
            Showing {options.length} of {totalCount} options
            {searchValue && (
              <div>Search results for: "{searchValue}"</div>
            )}
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default EditLookupModal;
