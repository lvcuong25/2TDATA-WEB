import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  message,
  Typography,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  DatabaseOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

/**
 * TEMPLATE CREATE MODAL
 * 
 * Modal để tạo template mới
 * Giao diện giống database create modal
 */

const TemplateCreateModal = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Mock categories
  const categories = [
    'CRM',
    'Project Management', 
    'Inventory',
    'Finance',
    'HR',
    'Marketing',
    'Sales',
    'Support',
    'Analytics',
    'Other'
  ];

  const handleSubmit = async (values) => {
    try {
      const templateData = {
        ...values,
        category: selectedCategory,
        is_public: isPublic,
        created_at: new Date().toISOString()
      };
      
      await onSubmit(templateData);
      form.resetFields();
      setSelectedCategory('');
      setIsPublic(true);
    } catch (error) {
      console.error('Error creating template:', error);
      message.error('Failed to create template');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedCategory('');
    setIsPublic(true);
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DatabaseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>Create New Template</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        {/* Template Basic Info */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Template Information
          </Title>
          
          <Form.Item
            name="name"
            label="Template Name"
            rules={[
              { required: true, message: 'Please enter template name' },
              { min: 3, message: 'Template name must be at least 3 characters' },
              { max: 100, message: 'Template name must be less than 100 characters' }
            ]}
          >
            <Input 
              placeholder="Enter template name"
              prefix={<DatabaseOutlined style={{ color: '#8c8c8c' }} />}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { max: 500, message: 'Description must be less than 500 characters' }
            ]}
          >
            <TextArea 
              placeholder="Enter template description"
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              placeholder="Select category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              suffixIcon={<AppstoreOutlined />}
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Divider />

        {/* Template Settings */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Template Settings
          </Title>

          <Form.Item
            name="is_public"
            label="Visibility"
            rules={[{ required: true, message: 'Please select visibility' }]}
          >
            <Select
              placeholder="Select visibility"
              value={isPublic}
              onChange={setIsPublic}
            >
              <Option value={true}>Public - Visible to everyone</Option>
              <Option value={false}>Private - Only visible to you</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags (Optional)"
          >
            <Select
              mode="tags"
              placeholder="Add tags to help others find your template"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <Divider />

        {/* Template Preview */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Template Preview
          </Title>
          <div style={{ 
            padding: '16px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            border: '1px solid #d9d9d9'
          }}>
            <Text type="secondary">
              Your template will be created with the basic structure. 
              You can add tables, columns, and configure settings after creation.
            </Text>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
            icon={<PlusOutlined />}
          >
            Create Template
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TemplateCreateModal;
