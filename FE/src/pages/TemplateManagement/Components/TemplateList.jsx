import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Input, 
  Select, 
  Button, 
  Space, 
  Pagination, 
  Spin, 
  Empty, 
  message,
  Modal,
  Form,
  Input as AntInput,
  Typography,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  FilterOutlined,
  ImportOutlined,
  ExportOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  StarOutlined
} from '@ant-design/icons';
import TemplateCard from './TemplateCard';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

/**
 * TEMPLATE LIST COMPONENT
 * 
 * Component hiển thị danh sách templates với giao diện giống database management
 * Tương tự như database list nhưng cho templates
 */

const TemplateList = ({ 
  onCreateTemplate,
  onEditTemplate,
  onViewTemplate,
  onApplyTemplate,
  showCreateButton = true,
  showSearch = true,
  showFilters = true,
  pageSize = 12,
  // Mock data for now - will be replaced with API calls
  templates = [],
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPublic, setSelectedPublic] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Categories
  const [categories, setCategories] = useState(['CRM', 'Project Management', 'Inventory', 'Finance', 'HR']);
  
  // Modals
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copyForm] = Form.useForm();

  // Mock templates data - giống database structure
  const mockTemplates = [
    {
      id: '1',
      name: 'CRM Lead Management',
      description: 'Complete CRM system for managing leads, contacts, and sales pipeline with advanced filtering and automation',
      category: 'CRM',
      is_public: true,
      usage_count: 45,
      rating: 4.8,
      version: '1.2',
      tags: ['sales', 'crm', 'leads', 'automation'],
      created_by: { name: 'John Doe' },
      structure: { tables: [{ name: 'Leads' }, { name: 'Contacts' }, { name: 'Deals' }] },
      created_at: '2024-01-15',
      updated_at: '2024-01-20'
    },
    {
      id: '2',
      name: 'Project Management Suite',
      description: 'Comprehensive project tracking system with task management, team collaboration, and progress monitoring',
      category: 'Project Management',
      is_public: true,
      usage_count: 32,
      rating: 4.5,
      version: '2.0',
      tags: ['project', 'tasks', 'team', 'collaboration'],
      created_by: { name: 'Jane Smith' },
      structure: { tables: [{ name: 'Projects' }, { name: 'Tasks' }, { name: 'Team Members' }] },
      created_at: '2024-01-10',
      updated_at: '2024-01-18'
    },
    {
      id: '3',
      name: 'Inventory Management System',
      description: 'Advanced inventory tracking with supplier management, stock levels, and automated reorder points',
      category: 'Inventory',
      is_public: false,
      usage_count: 18,
      rating: 4.2,
      version: '1.0',
      tags: ['inventory', 'products', 'stock', 'suppliers'],
      created_by: { name: 'Mike Johnson' },
      structure: { tables: [{ name: 'Products' }, { name: 'Suppliers' }, { name: 'Stock Levels' }] },
      created_at: '2024-01-05',
      updated_at: '2024-01-12'
    },
    {
      id: '4',
      name: 'Financial Dashboard',
      description: 'Complete financial management system with expense tracking, revenue analysis, and budget planning',
      category: 'Finance',
      is_public: true,
      usage_count: 28,
      rating: 4.6,
      version: '1.5',
      tags: ['finance', 'budget', 'expenses', 'revenue'],
      created_by: { name: 'Sarah Wilson' },
      structure: { tables: [{ name: 'Expenses' }, { name: 'Revenue' }, { name: 'Budgets' }] },
      created_at: '2024-01-08',
      updated_at: '2024-01-16'
    }
  ];

  // Filter templates based on search and filters
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesPublic = selectedPublic === '' || 
      (selectedPublic === 'true' && template.is_public) ||
      (selectedPublic === 'false' && !template.is_public);
    
    return matchesSearch && matchesCategory && matchesPublic;
  });

  // Copy template
  const handleCopyTemplate = (template) => {
    setSelectedTemplate(template);
    setCopyModalVisible(true);
    copyForm.setFieldsValue({
      name: `${template.name} (Copy)`,
      description: template.description
    });
  };

  const handleCopySubmit = async (values) => {
    try {
      // Mock copy operation
      console.log('Copying template:', selectedTemplate.id, values);
      message.success('Template copied successfully');
      setCopyModalVisible(false);
    } catch (error) {
      console.error('Error copying template:', error);
      message.error('Failed to copy template');
    }
  };

  // Export template
  const handleExportTemplate = async (template) => {
    try {
      // Mock export operation
      console.log('Exporting template:', template.id);
      message.success('Template exported successfully');
    } catch (error) {
      console.error('Error exporting template:', error);
      message.error('Failed to export template');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (template) => {
    Modal.confirm({
      title: 'Delete Template',
      content: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Mock delete operation
          console.log('Deleting template:', template.id);
          message.success('Template deleted successfully');
        } catch (error) {
          console.error('Error deleting template:', error);
          message.error('Failed to delete template');
        }
      }
    });
  };

  return (
    <div className="template-list">
      {/* Header - giống database management */}
      <div className="template-list-header">
        <div className="header-left">
          <div className="header-title">
            <DatabaseOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
            <div>
              <Title level={2} style={{ margin: 0, color: '#262626' }}>
                Template Management
              </Title>
              <Text type="secondary">
                Create, manage, and organize your database templates
              </Text>
            </div>
          </div>
        </div>
        <div className="header-right">
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => window.location.reload()}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<ImportOutlined />}
              onClick={() => console.log('Import templates')}
            >
              Import
            </Button>
            {showCreateButton && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={onCreateTemplate}
              >
                Create Template
              </Button>
            )}
          </Space>
        </div>
      </div>

      <Divider />

      {/* Search and Filters - giống database management */}
      {(showSearch || showFilters) && (
        <div className="template-list-filters">
          <Row gutter={[16, 16]} align="middle">
            {showSearch && (
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search templates by name or description..."
                  allowClear
                  onSearch={setSearchQuery}
                  style={{ width: '100%' }}
                  prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                />
              </Col>
            )}
            
            {showFilters && (
              <>
                <Col xs={24} sm={12} md={4}>
                  <Select
                    placeholder="Category"
                    allowClear
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    style={{ width: '100%' }}
                    suffixIcon={<AppstoreOutlined />}
                  >
                    {categories.map(category => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                </Col>
                
                <Col xs={24} sm={12} md={4}>
                  <Select
                    placeholder="Visibility"
                    allowClear
                    value={selectedPublic}
                    onChange={setSelectedPublic}
                    style={{ width: '100%' }}
                  >
                    <Option value="true">Public</Option>
                    <Option value="false">Private</Option>
                  </Select>
                </Col>
                
                <Col xs={24} sm={12} md={4}>
                  <Select
                    placeholder="Sort by"
                    value={`${sortBy}_${sortOrder}`}
                    onChange={(value) => {
                      const [field, order] = value.split('_');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    style={{ width: '100%' }}
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="created_at_desc">Newest First</Option>
                    <Option value="created_at_asc">Oldest First</Option>
                    <Option value="name_asc">Name A-Z</Option>
                    <Option value="name_desc">Name Z-A</Option>
                    <Option value="usage_count_desc">Most Used</Option>
                    <Option value="rating_desc">Highest Rated</Option>
                  </Select>
                </Col>
              </>
            )}
          </Row>
        </div>
      )}

      {/* Templates Grid - giống database management */}
      <div className="template-list-content">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Loading templates...</Text>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Empty
            description={
              <div>
                <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <Title level={4} type="secondary">No templates found</Title>
                <Text type="secondary">
                  {searchQuery || selectedCategory || selectedPublic 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first template to get started'
                  }
                </Text>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {showCreateButton && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={onCreateTemplate}
                size="large"
              >
                Create Your First Template
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <div className="template-grid-header">
              <Text type="secondary">
                Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </Text>
            </div>
            <Row gutter={[16, 16]}>
              {filteredTemplates.map(template => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                  <TemplateCard
                    template={template}
                    onEdit={onEditTemplate}
                    onDelete={handleDeleteTemplate}
                    onCopy={handleCopyTemplate}
                    onExport={handleExportTemplate}
                    onView={onViewTemplate}
                    onApply={onApplyTemplate}
                  />
                </Col>
              ))}
            </Row>
          </>
        )}
      </div>

      {/* Copy Template Modal */}
      <Modal
        title="Copy Template"
        open={copyModalVisible}
        onCancel={() => setCopyModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={copyForm}
          layout="vertical"
          onFinish={handleCopySubmit}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <AntInput placeholder="Enter template name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <AntInput.TextArea 
              placeholder="Enter template description"
              rows={3}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Copy Template
              </Button>
              <Button onClick={() => setCopyModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .template-list {
          padding: 24px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .template-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header-title {
          display: flex;
          align-items: center;
        }

        .template-list-filters {
          margin-bottom: 24px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .template-list-content {
          min-height: 400px;
        }

        .template-grid-header {
          margin-bottom: 16px;
          padding: 0 8px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default TemplateList;