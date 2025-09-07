import React, { useState } from 'react';
import { Select, Space, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const DateConfig = ({ config, onChange }) => {
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const dateFormats = [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
    { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD MM YYYY', label: 'DD MM YYYY' }
  ];

  const handleFormatChange = (format) => {
    const newConfig = { ...config, format };
    onChange(newConfig);
    setShowFormatDropdown(false);
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Date Configuration
      </Text>
      
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Date Format Selection */}
        <div style={{ position: 'relative' }}>
          <Text style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
            Date Format
          </Text>
          
          <div
            onClick={() => setShowFormatDropdown(!showFormatDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: 'white',
              transition: 'all 0.2s',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#40a9ff'}
            onMouseLeave={(e) => e.target.style.borderColor = '#d9d9d9'}
          >
            <CalendarOutlined 
              style={{ 
                marginRight: '8px', 
                color: '#666',
                fontSize: '14px'
              }} 
            />
            <span style={{ flex: 1, fontSize: '14px' }}>
              {config.format || 'DD/MM/YYYY'}
            </span>
            <span style={{ 
              color: '#666', 
              fontSize: '12px',
              transition: 'transform 0.2s',
              transform: showFormatDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </span>
          </div>

          {/* Format Dropdown */}
          {showFormatDropdown && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setShowFormatDropdown(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}
              >
                {dateFormats.map((format, index) => (
                  <div
                    key={format.value}
                    onClick={() => handleFormatChange(format.value)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: index < dateFormats.length - 1 ? '1px solid #f0f0f0' : 'none',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontSize: '14px' }}>{format.label}</span>
                    {(config.format || 'DD/MM/YYYY') === format.value && (
                      <span style={{ color: '#1890ff', fontSize: '14px' }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Space>
    </div>
  );
};

export default DateConfig;
