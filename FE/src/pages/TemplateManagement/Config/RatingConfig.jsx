import React from 'react';
import { InputNumber, Select, Input, Space, Typography, Row, Col, Radio } from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  HeartOutlined, 
  HeartFilled,
  LikeOutlined,
  LikeFilled,
  FireOutlined,
  FireFilled,
  TrophyOutlined,
  TrophyFilled
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const RatingConfig = ({ ratingConfig, setRatingConfig }) => {
  const currentConfig = ratingConfig || { maxStars: 5, allowHalf: false, icon: 'star', color: '#faad14', defaultValue: 0 };

  const iconOptions = [
    { value: 'star', label: 'Star', icon: <StarOutlined />, filled: <StarFilled /> },
    { value: 'heart', label: 'Heart', icon: <HeartOutlined />, filled: <HeartFilled /> },
    { value: 'like', label: 'Like', icon: <LikeOutlined />, filled: <LikeFilled /> },
    { value: 'fire', label: 'Fire', icon: <FireOutlined />, filled: <FireFilled /> },
    { value: 'trophy', label: 'Trophy', icon: <TrophyOutlined />, filled: <TrophyFilled /> }
  ];

  const colorOptions = [
    { value: '#faad14', label: 'Gold', color: '#faad14' },
    { value: '#f5222d', label: 'Red', color: '#f5222d' },
    { value: '#52c41a', label: 'Green', color: '#52c41a' },
    { value: '#1890ff', label: 'Blue', color: '#1890ff' },
    { value: '#722ed1', label: 'Purple', color: '#722ed1' },
    { value: '#fa8c16', label: 'Orange', color: '#fa8c16' }
  ];

  const handleConfigChange = (key, value) => {
    setRatingConfig({
      ...currentConfig,
      [key]: value
    });
  };

  const renderStars = (count, maxStars, icon, color, allowHalf = false) => {
    const iconData = iconOptions.find(opt => opt.value === icon);
    const filledIcon = iconData?.filled;
    const outlineIcon = iconData?.icon;
    
    const renderStar = (index) => {
      const starValue = index + 1;
      const isFullStar = count >= starValue;
      const isHalfStar = allowHalf && count > index && count < starValue;
      
      if (isHalfStar) {
        return (
          <span
            key={index}
            style={{
              position: 'relative',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#d9d9d9'
            }}
            onClick={() => handleConfigChange('defaultValue', starValue - 0.5)}
          >
            {outlineIcon}
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                overflow: 'hidden',
                color: color
              }}
            >
              {filledIcon}
            </span>
          </span>
        );
      }
      
      return (
        <span
          key={index}
          style={{
            color: isFullStar ? color : '#d9d9d9',
            fontSize: '16px',
            cursor: 'pointer'
          }}
          onClick={() => handleConfigChange('defaultValue', starValue)}
        >
          {isFullStar ? filledIcon : outlineIcon}
        </span>
      );
    };
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
      </div>
    );
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Icon
            </label>
            <Select
              value={currentConfig.icon}
              onChange={(value) => handleConfigChange('icon', value)}
              style={{ width: '100%' }}
              placeholder="Select icon"
            >
              {iconOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col span={8}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Colour
            </label>
            <Select
              value={currentConfig.color}
              onChange={(value) => handleConfigChange('color', value)}
              style={{ width: '100%' }}
              placeholder="Select color"
            >
              {colorOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: option.color, fontSize: '16px' }}>
                      {iconOptions.find(opt => opt.value === currentConfig.icon)?.icon}
                    </span>
                    <span>{option.label}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        
        <Col span={8}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Max
            </label>
            <Select
              value={currentConfig.maxStars}
              onChange={(value) => handleConfigChange('maxStars', value)}
              style={{ width: '100%' }}
              placeholder="Select max stars"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <Option key={num} value={num}>
                  {num}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
      </Row>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Default value
        </label>
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px', 
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa'
        }}>
          {renderStars(currentConfig.defaultValue || 0, currentConfig.maxStars, currentConfig.icon, currentConfig.color, true)}
          <span
            style={{ 
              color: '#999', 
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px'
            }}
            onClick={() => handleConfigChange('defaultValue', 0)}
          >
            ×
          </span>
        </div>
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
          Click on stars to set default rating value
        </Text>
      </div>

    </div>
  );
};

export default RatingConfig;
