/**
 * Data Type utilities
 * Provides functions to handle data type related operations
 */

import React from 'react';
import { Tag } from 'antd';
import {
  FontSizeOutlined,
  NumberOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DownOutlined,
  FunctionOutlined,
  DollarOutlined,
  MailOutlined,
  LinkOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  PhoneOutlined,
  FieldTimeOutlined,
  StarOutlined
} from '@ant-design/icons';

/**
 * Get icon component for data type
 * @param {string} dataType - Data type name
 * @returns {JSX.Element} Icon component
 */
export const getDataTypeIcon = (dataType) => {
  switch (dataType) {
    case 'text': 
      return <FontSizeOutlined style={{ color: '#1890ff', fontSize: '16px' }} />;
    case 'number': 
      return <NumberOutlined style={{ color: '#52c41a', fontSize: '16px' }} />;
    case 'date': 
      return <CalendarOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />;
    case 'year': 
      return <ClockCircleOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />;
    case 'checkbox': 
      return <CheckSquareOutlined style={{ color: '#52c41a', fontSize: '16px' }} />;
    case 'single_select': 
      return <DownOutlined style={{ color: '#1890ff', fontSize: '16px' }} />;
    case 'multi_select': 
      return <CheckSquareOutlined style={{ color: '#722ed1', fontSize: '16px' }} />;
    case 'formula': 
      return <FunctionOutlined style={{ color: '#722ed1', fontSize: '16px' }} />;
    case 'currency': 
      return <DollarOutlined style={{ color: '#52c41a', fontSize: '16px' }} />;
    case 'email': 
      return <MailOutlined style={{ color: '#1890ff', fontSize: '16px' }} />;
    case 'url': 
      return <LinkOutlined style={{ color: '#1890ff', fontSize: '16px' }} />;
    case 'json': 
      return <CodeOutlined style={{ color: '#722ed1', fontSize: '16px' }} />;
    case 'percent': 
      return <PercentageOutlined style={{ color: '#fa541c', fontSize: '16px' }} />;
    case 'phone': 
      return <PhoneOutlined style={{ color: '#13c2c2', fontSize: '16px' }} />;
    case 'time': 
      return <FieldTimeOutlined style={{ color: '#fa8c16', fontSize: '16px' }} />;
    case 'rating': 
      return <StarOutlined style={{ color: '#faad14', fontSize: '16px' }} />;
    default: 
      return <FontSizeOutlined style={{ color: '#1890ff', fontSize: '16px' }} />;
  }
};

/**
 * Get color for data type
 * @param {string} dataType - Data type name
 * @returns {string} Color hex code
 */
export const getDataTypeColor = (dataType) => {
  switch (dataType) {
    case 'text': return '#1890ff';
    case 'number': return '#52c41a';
    case 'date': return '#fa8c16';
    case 'year': return '#fa8c16';
    case 'checkbox': return '#52c41a';
    case 'single_select': return '#1890ff';
    case 'multi_select': return '#722ed1';
    case 'formula': return '#722ed1';
    case 'currency': return '#52c41a';
    case 'email': return '#1890ff';
    case 'url': return '#1890ff';
    case 'json': return '#722ed1';
    case 'percent': return '#fa541c';
    case 'phone': return '#13c2c2';
    case 'time': return '#fa8c16';
    case 'rating': return '#faad14';
    default: return '#1890ff';
  }
};

/**
 * Get tag component for data type
 * @param {string} dataType - Data type name
 * @returns {JSX.Element} Tag component
 */
export const getDataTypeTag = (dataType) => {
  const colorMap = {
    text: 'blue',
    number: 'green',
    date: 'orange',
    year: 'orange',
    checkbox: 'green',
    single_select: 'blue',
    multi_select: 'purple',
    formula: 'purple',
    currency: 'green',
    email: 'blue',
    url: 'blue',
    json: 'purple',
    percent: 'orange',
    phone: 'cyan',
    time: 'orange',
    rating: 'gold'
  };
  return <Tag color={colorMap[dataType] || 'blue'}>{dataType.toUpperCase()}</Tag>;
};

/**
 * Get type letter for data type
 * @param {string} dataType - Data type name
 * @returns {string} Type letter
 */
export const getTypeLetter = (dataType) => {
  switch (dataType) {
    case 'text': return 'T';
    case 'number': return 'N';
    case 'date': return 'D';
    case 'year': return 'Y';
    case 'checkbox': return '☑';
    case 'single_select': return '▼';
    case 'currency': return '$';
    case 'time': return '⏰';
    case 'rating': return '⭐';
    case 'datetime': return '📅';
    default: return 'T';
  }
};

/**
 * Get all supported data types
 * @returns {Array} Array of data type objects
 */
export const getSupportedDataTypes = () => {
  return [
    { value: 'text', label: 'Text', icon: 'T', color: '#1890ff' },
    { value: 'number', label: 'Number', icon: 'N', color: '#52c41a' },
    { value: 'date', label: 'Date', icon: 'D', color: '#fa8c16' },
    { value: 'year', label: 'Year', icon: 'Y', color: '#fa8c16' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑', color: '#52c41a' },
    { value: 'single_select', label: 'Single Select', icon: '▼', color: '#1890ff' },
    { value: 'multi_select', label: 'Multi Select', icon: '☑', color: '#722ed1' },
    { value: 'formula', label: 'Formula', icon: 'f', color: '#722ed1' },
    { value: 'currency', label: 'Currency', icon: '$', color: '#52c41a' },
    { value: 'percent', label: 'Percent', icon: '%', color: '#fa541c' },
    { value: 'phone', label: 'Phone Number', icon: '📞', color: '#13c2c2' },
    { value: 'time', label: 'Time', icon: '⏰', color: '#fa8c16' },
    { value: 'rating', label: 'Rating', icon: '⭐', color: '#faad14' },
    { value: 'email', label: 'Email', icon: '@', color: '#1890ff' },
    { value: 'url', label: 'URL', icon: '🔗', color: '#1890ff' },
    { value: 'json', label: 'JSON', icon: '{}', color: '#722ed1' }
  ];
};

/**
 * Check if data type is valid
 * @param {string} dataType - Data type to validate
 * @returns {boolean} True if valid
 */
export const isValidDataType = (dataType) => {
  const supportedTypes = getSupportedDataTypes();
  return supportedTypes.some(type => type.value === dataType);
};

/**
 * Get data type label
 * @param {string} dataType - Data type name
 * @returns {string} Human readable label
 */
export const getDataTypeLabel = (dataType) => {
  const supportedTypes = getSupportedDataTypes();
  const type = supportedTypes.find(t => t.value === dataType);
  return type ? type.label : dataType;
};

/**
 * Get data type info object
 * @param {string} dataType - Data type name
 * @returns {Object} Data type info object
 */
export const getDataTypeInfo = (dataType) => {
  return {
    value: dataType,
    label: getDataTypeLabel(dataType),
    icon: getTypeLetter(dataType),
    color: getDataTypeColor(dataType),
    isValid: isValidDataType(dataType)
  };
};
