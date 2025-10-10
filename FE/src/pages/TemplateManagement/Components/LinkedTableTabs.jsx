import React, { useState } from 'react';
import { Input, Button, Tag } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  LinkOutlined,
  CloseOutlined,
  ExpandAltOutlined,
  DownOutlined
} from '@ant-design/icons';

const LinkedTableTabs = ({
  linkedTableConfig,
  value,
  onChange,
  onModalOpen,
  style = {}
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Get linked records count
  const getLinkedRecordsCount = () => {
    if (!value) return 0;
    if (Array.isArray(value)) {
      return value.length;
    }
    return 1;
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchValue(e.target.value);
  };

  // Handle tab click
  const handleTabClick = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  // Handle remove record
  const handleRemoveRecord = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange(Array.isArray(value) ? [] : null);
    }
  };

  // Handle expand record
  const handleExpandRecord = (e) => {
    e.stopPropagation();
  };

  return (
    <div style={{ width: '100%', ...style }}>
      {/* Tabs Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '8px',
        borderBottom: '1px solid #f0f0f0',
        paddingBottom: '6px'
      }}>
        {/* Tab 1 - Main linked table */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 8px',
            marginRight: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
            backgroundColor: '#f6f0ff',
            border: '1px solid #d9d9d9',
            transition: 'all 0.2s',
            maxWidth: '140px'
          }}
          onClick={() => handleTabClick(0)}
        >
          <LinkOutlined style={{ color: '#722ed1', fontSize: '12px' }} />
          <span style={{ 
            fontSize: '11px', 
            color: '#722ed1',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            1 Bản đồ chiến lược...
          </span>
          <DownOutlined style={{ 
            fontSize: '8px', 
            color: '#722ed1',
            marginLeft: '2px'
          }} />
        </div>

        {/* Tab 2 - Secondary tab */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 8px',
            marginRight: '6px',
            cursor: 'pointer',
            borderRadius: '4px',
            backgroundColor: activeTab === 1 ? '#f6f0ff' : 'transparent',
            border: activeTab === 1 ? '1px solid #d9d9d9' : '1px solid transparent',
            transition: 'all 0.2s',
            maxWidth: '140px'
          }}
          onClick={() => handleTabClick(1)}
        >
          <LinkOutlined style={{ color: '#722ed1', fontSize: '12px' }} />
          <span style={{ 
            fontSize: '11px', 
            color: '#722ed1',
            fontWeight: activeTab === 1 ? '500' : '400',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            2 Chân dung khách...
          </span>
          <DownOutlined style={{ 
            fontSize: '8px', 
            color: '#722ed1',
            marginLeft: '2px'
          }} />
        </div>
        
        {/* Add new tab button */}
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          style={{
            color: '#722ed1',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            minWidth: '24px',
            height: '24px',
            fontSize: '10px'
          }}
        />
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '8px' }}>
        <Input
          placeholder="Search records to link..."
          value={searchValue}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
          allowClear
          size="small"
          style={{ borderRadius: '4px', fontSize: '11px' }}
        />
      </div>

      {/* Selected Record Display */}
      {value && (
        <div style={{
          border: '2px solid #1890ff',
          borderRadius: '6px',
          padding: '8px',
          marginBottom: '8px',
          backgroundColor: '#f6ffed',
          position: 'relative',
          minHeight: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag
              color="blue"
              style={{
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: '#e6f7ff',
                color: '#1890ff',
                border: '1px solid #91d5ff'
              }}
            >
              1
            </Tag>
            
            <span style={{ fontSize: '11px', color: '#666' }}>
              {Array.isArray(value) ? `Record ${value[0]}` : `Record ${value}`}
            </span>
            
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleRemoveRecord}
              style={{
                color: '#ff4d4f',
                padding: '1px',
                minWidth: '16px',
                height: '16px',
                fontSize: '10px'
              }}
            />
          </div>
          
          {/* Expand button */}
          <Button
            type="text"
            size="small"
            icon={<ExpandAltOutlined />}
            onClick={handleExpandRecord}
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              color: '#1890ff',
              padding: '1px',
              minWidth: '16px',
              height: '16px',
              fontSize: '10px'
            }}
          />
        </div>
      )}

      {/* Linked Record Indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        marginBottom: '6px'
      }}>
        <Tag
          color="purple"
          icon={<LinkOutlined />}
          style={{
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '10px',
            backgroundColor: '#f9f0ff',
            color: '#722ed1',
            border: '1px solid #d3adf7'
          }}
        >
          {getLinkedRecordsCount()} linked record{getLinkedRecordsCount() !== 1 ? 's' : ''}
        </Tag>
      </div>

      {/* Click to link records */}
      <div 
        style={{ 
          width: '100%', 
          height: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#1890ff',
          fontSize: '11px',
          textDecoration: 'underline',
          padding: '6px',
          border: '1px dashed #d9d9d9',
          borderRadius: '4px',
          backgroundColor: '#fafafa',
          transition: 'all 0.2s'
        }}
        onClick={onModalOpen}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f8ff';
          e.currentTarget.style.borderColor = '#1890ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fafafa';
          e.currentTarget.style.borderColor = '#d9d9d9';
        }}
      >
        <span style={{ textAlign: 'center' }}>
          {!value ? 'Click to link records' : 'Click to manage linked records'}
        </span>
      </div>
    </div>
  );
};

export default LinkedTableTabs;
