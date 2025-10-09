import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  message,
  Typography,
  Divider,
  Switch
} from 'antd';
import { 
  EditOutlined, 
  DatabaseOutlined,
  AppstoreOutlined,
  EyeOutlined,
  LockOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

/**
 * TEMPLATE EDIT MODAL
 * 
 * Modal để chỉnh sửa template
 * Giao diện giống database edit modal
 */

const TemplateEditModal = ({ 
  visible, 
  template,
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

  // Initialize form when template changes
  useEffect(() => {
    if (template && visible) {
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags || []
      });
      setSelectedCategory(template.category);
      setIsPublic(template.is_public);
    }
  }, [template, visible, form]);

  const handleSubmit = async (values) => {
    try {
      const templateData = {
        ...values,
        category: selectedCategory,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      };
      
      await onSubmit(templateData);
      form.resetFields();
      setSelectedCategory('');
      setIsPublic(true);
    } catch (error) {
      console.error('Error updating template:', error);
      message.error('Failed to update template');
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
          <EditOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>Edit Template</span>
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
        initialValues={template}
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
              <Option value={true}>
                <Space>
                  <EyeOutlined />
                  Public - Visible to everyone
                </Space>
              </Option>
              <Option value={false}>
                <Space>
                  <LockOutlined />
                  Private - Only visible to you
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select
              mode="tags"
              placeholder="Add tags to help others find your template"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </div>

        <Divider />

        {/* Template Stats */}
        {template && (
          <div style={{ marginBottom: '24px' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>
              Template Statistics
            </Title>
            <div style={{ 
              padding: '16px', 
              background: '#f5f5f5', 
              borderRadius: '8px',
              border: '1px solid #d9d9d9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>Usage Count:</Text>
                <Text strong>{template.usage_count || 0}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>Rating:</Text>
                <Text strong>{template.rating ? `${template.rating}/5` : 'N/A'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Tables:</Text>
                <Text strong>{template.structure?.tables?.length || 0}</Text>
              </div>
            </div>
          </div>
        )}

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
            icon={<EditOutlined />}
          >
            Update Template
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TemplateEditModal;
