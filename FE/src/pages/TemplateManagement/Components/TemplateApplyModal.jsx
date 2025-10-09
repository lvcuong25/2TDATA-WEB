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
  Card,
  List,
  Tag,
  Alert
} from 'antd';
import { 
  DatabaseOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

/**
 * TEMPLATE APPLY MODAL
 * 
 * Modal để apply template vào database
 * Giao diện giống database apply modal
 */

const TemplateApplyModal = ({ 
  visible, 
  template,
  onCancel, 
  onSubmit, 
  loading = false 
}) => {
  const [form] = Form.useForm();
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [applyMode, setApplyMode] = useState('create'); // 'create' or 'merge'

  // Mock databases
  const databases = [
    { id: '1', name: 'CRM Database', description: 'Customer relationship management' },
    { id: '2', name: 'Project Database', description: 'Project management system' },
    { id: '3', name: 'Inventory Database', description: 'Inventory tracking system' },
    { id: '4', name: 'Finance Database', description: 'Financial management system' }
  ];

  const handleSubmit = async (values) => {
    try {
      const applyData = {
        ...values,
        database_id: selectedDatabase,
        apply_mode: applyMode,
        template_id: template?.id
      };
      
      await onSubmit(applyData);
      form.resetFields();
      setSelectedDatabase('');
      setApplyMode('create');
    } catch (error) {
      console.error('Error applying template:', error);
      message.error('Failed to apply template');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedDatabase('');
    setApplyMode('create');
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DatabaseOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>Apply Template to Database</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      {/* Template Preview */}
      {template && (
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Template Preview
          </Title>
          <Card size="small">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div>
                <Title level={5} style={{ margin: 0 }}>{template.name}</Title>
                <Text type="secondary">{template.description}</Text>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <Tag color="blue">{template.category}</Tag>
              {template.is_public ? (
                <Tag color="green">Public</Tag>
              ) : (
                <Tag color="orange">Private</Tag>
              )}
              <Tag color="purple">{template.structure?.tables?.length || 0} tables</Tag>
            </div>
            {template.structure?.tables && (
              <div>
                <Text strong>Tables:</Text>
                <div style={{ marginTop: '8px' }}>
                  {template.structure.tables.map((table, index) => (
                    <Tag key={index} color="default" style={{ marginBottom: '4px' }}>
                      {table.name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        {/* Database Selection */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Database Selection
          </Title>
          
          <Form.Item
            name="database_id"
            label="Select Database"
            rules={[{ required: true, message: 'Please select a database' }]}
          >
            <Select
              placeholder="Choose database to apply template"
              value={selectedDatabase}
              onChange={setSelectedDatabase}
              suffixIcon={<DatabaseOutlined />}
            >
              {databases.map(db => (
                <Option key={db.id} value={db.id}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{db.name}</div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{db.description}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Divider />

        {/* Apply Mode */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Apply Mode
          </Title>

          <Form.Item
            name="apply_mode"
            label="How to apply template"
            rules={[{ required: true, message: 'Please select apply mode' }]}
          >
            <Select
              placeholder="Select apply mode"
              value={applyMode}
              onChange={setApplyMode}
            >
              <Option value="create">
                <div>
                  <div style={{ fontWeight: 'bold' }}>Create New Database</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    Create a new database with this template structure
                  </div>
                </div>
              </Option>
              <Option value="merge">
                <div>
                  <div style={{ fontWeight: 'bold' }}>Merge with Existing</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    Add template tables to existing database
                  </div>
                </div>
              </Option>
            </Select>
          </Form.Item>
        </div>

        {/* Apply Options */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={5} style={{ marginBottom: '16px' }}>
            Apply Options
          </Title>

          <Form.Item
            name="include_sample_data"
            label="Include Sample Data"
            valuePropName="checked"
            initialValue={true}
          >
            <Select>
              <Option value={true}>Yes - Include sample records</Option>
              <Option value={false}>No - Structure only</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="preserve_existing"
            label="Preserve Existing Data"
            valuePropName="checked"
            initialValue={true}
          >
            <Select>
              <Option value={true}>Yes - Keep existing tables and data</Option>
              <Option value={false}>No - Replace conflicting tables</Option>
            </Select>
          </Form.Item>
        </div>

        {/* Warning/Info */}
        <Alert
          message="Apply Template"
          description={
            applyMode === 'create' 
              ? "This will create a new database with the template structure. Existing data will not be affected."
              : "This will add template tables to the selected database. Make sure to backup your data first."
          }
          type={applyMode === 'create' ? 'info' : 'warning'}
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

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
            icon={<CheckCircleOutlined />}
          >
            Apply Template
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TemplateApplyModal;
