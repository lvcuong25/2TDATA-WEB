import React, { useState } from 'react';
import { 
  Input, 
  Select, 
  Button, 
  Space, 
  Row, 
  Col,
  Typography,
  Tag,
  Divider
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  AppstoreOutlined,
  EyeOutlined,
  LockOutlined,
  ClearOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

/**
 * TEMPLATE SEARCH BAR
 * 
 * Component tìm kiếm và filter templates
 * Giao diện giống database search bar
 */

const TemplateSearchBar = ({ 
  onSearch,
  onFilterChange,
  onSortChange,
  loading = false,
  showAdvanced = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPublic, setSelectedPublic] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const handleSearch = (value) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    onFilterChange?.({ category: value, public: selectedPublic });
  };

  const handlePublicChange = (value) => {
    setSelectedPublic(value);
    onFilterChange?.({ category: selectedCategory, public: value });
  };

  const handleSortChange = (value) => {
    const [field, order] = value.split('_');
    setSortBy(field);
    setSortOrder(order);
    onSortChange?.({ field, order });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedPublic('');
    setSortBy('created_at');
    setSortOrder('desc');
    onSearch?.('');
    onFilterChange?.({ category: '', public: '' });
    onSortChange?.({ field: 'created_at', order: 'desc' });
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedPublic;

  return (
    <div className="template-search-bar">
      {/* Search Input */}
      <div style={{ marginBottom: '16px' }}>
        <Search
          placeholder="Search templates by name, description, or tags..."
          allowClear
          onSearch={handleSearch}
          loading={loading}
          size="large"
          style={{ width: '100%' }}
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
        />
      </div>

      {/* Filters */}
      {showAdvanced && (
        <>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                  Category
                </Text>
                <Select
                  placeholder="All Categories"
                  allowClear
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  style={{ width: '100%' }}
                  suffixIcon={<AppstoreOutlined />}
                >
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                  Visibility
                </Text>
                <Select
                  placeholder="All Templates"
                  allowClear
                  value={selectedPublic}
                  onChange={handlePublicChange}
                  style={{ width: '100%' }}
                >
                  <Option value="true">
                    <Space>
                      <EyeOutlined />
                      Public
                    </Space>
                  </Option>
                  <Option value="false">
                    <Space>
                      <LockOutlined />
                      Private
                    </Space>
                  </Option>
                </Select>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                  Sort By
                </Text>
                <Select
                  placeholder="Sort by"
                  value={`${sortBy}_${sortOrder}`}
                  onChange={handleSortChange}
                  style={{ width: '100%' }}
                  suffixIcon={<SortAscendingOutlined />}
                >
                  <Option value="created_at_desc">Newest First</Option>
                  <Option value="created_at_asc">Oldest First</Option>
                  <Option value="name_asc">Name A-Z</Option>
                  <Option value="name_desc">Name Z-A</Option>
                  <Option value="usage_count_desc">Most Used</Option>
                  <Option value="rating_desc">Highest Rated</Option>
                  <Option value="updated_at_desc">Recently Updated</Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100%' }}>
                {hasActiveFilters && (
                  <Button 
                    icon={<ClearOutlined />}
                    onClick={handleClearFilters}
                    size="large"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div style={{ marginTop: '16px' }}>
              <Text strong style={{ marginRight: '8px' }}>Active Filters:</Text>
              <Space wrap>
                {searchQuery && (
                  <Tag closable onClose={() => handleSearch('')}>
                    Search: "{searchQuery}"
                  </Tag>
                )}
                {selectedCategory && (
                  <Tag closable onClose={() => handleCategoryChange('')}>
                    Category: {selectedCategory}
                  </Tag>
                )}
                {selectedPublic && (
                  <Tag closable onClose={() => handlePublicChange('')}>
                    {selectedPublic === 'true' ? 'Public' : 'Private'}
                  </Tag>
                )}
              </Space>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .template-search-bar {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
};

export default TemplateSearchBar;
