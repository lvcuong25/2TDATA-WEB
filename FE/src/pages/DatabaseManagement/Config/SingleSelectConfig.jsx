import React, { useState } from 'react';
import { Input, Button, Space, Typography, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, MenuOutlined, DownOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const SingleSelectConfig = ({ 
  config, 
  onChange, 
  style = {} 
}) => {
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim()) {
      const updatedOptions = [...(config?.options || []), newOption.trim()];
      onChange({
        ...config,
        options: updatedOptions
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = (config?.options || []).filter((_, i) => i !== index);
    const updatedConfig = {
      ...config,
      options: updatedOptions
    };
    
    // If the removed option was the default value, clear it
    if (config?.defaultValue === config?.options[index]) {
      updatedConfig.defaultValue = '';
    }
    
    onChange(updatedConfig);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...(config?.options || [])];
    updatedOptions[index] = value;
    
    const updatedConfig = {
      ...config,
      options: updatedOptions
    };
    
    // If the changed option was the default value, update it
    if (config?.defaultValue === config?.options[index]) {
      updatedConfig.defaultValue = value;
    }
    
    onChange(updatedConfig);
  };

  const handleDefaultValueChange = (value) => {
    onChange({
      ...config,
      defaultValue: value
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#fafafa', 
      padding: '16px', 
      borderRadius: '8px',
      border: '1px solid #f0f0f0',
      ...style
    }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Options Section */}
        <div>
          <Text strong>Single Select Options</Text>
          <div style={{ marginTop: '8px' }}>
            {(config?.options || []).map((option, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}
              >
                {/* Drag Handle */}
                <div style={{ 
                  cursor: 'grab',
                  color: '#bfbfbf',
                  fontSize: '12px',
                  padding: '4px'
                }}>
                  <MenuOutlined />
                </div>
                
                {/* Dropdown Arrow */}
                <div style={{ 
                  color: '#bfbfbf',
                  fontSize: '12px',
                  padding: '4px'
                }}>
                  ▼
                </div>
                
                {/* Option Input */}
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  style={{ flex: 1 }}
                  size="small"
                  placeholder="Option text"
                />
                
                {/* Delete Button */}
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => handleRemoveOption(index)}
                  style={{ color: '#ff4d4f' }}
                />
              </div>
            ))}
            
            {/* Add Option */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              backgroundColor: 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}>
              <div style={{ 
                color: '#bfbfbf',
                fontSize: '12px',
                padding: '4px',
                width: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MenuOutlined style={{ fontSize: '12px', color: '#bfbfbf' }} />
              </div>
              
              <div style={{ 
                color: '#1890ff',
                fontSize: '12px',
                padding: '4px',
                width: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DownOutlined style={{ fontSize: '12px', color: '#1890ff' }} />
              </div>
              
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add option"
                style={{ flex: 1 }}
                size="small"
              />
              
              <Button
                type="text"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddOption}
                disabled={!newOption.trim()}
                style={{ color: '#52c41a' }}
              />
            </div>
          </div>
        </div>

        {/* Default Value Section */}
        <div>
          <Text strong>Default Value</Text>
          <div style={{ marginTop: '8px' }}>
            <Select
              value={config?.defaultValue || ''}
              onChange={handleDefaultValueChange}
              style={{ width: '100%' }}
              placeholder="Select default value"
              allowClear
            >
              {(config?.options || []).map((option, index) => (
                <Option key={index} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Space>
    </div>
  );
};

export default SingleSelectConfig;
