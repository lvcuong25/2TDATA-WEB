import React, { useState } from 'react';
import { Select, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';

const { Option } = Select;

const LookupDropdown = ({ 
  column, 
  value, 
  onChange, 
  placeholder = "Select value...",
  disabled = false 
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch lookup data
  const { data: lookupData, isLoading, error } = useQuery({
    queryKey: ['lookupData', column._id, searchValue, currentPage],
    queryFn: async () => {
      if (!column || !column.lookupConfig?.linkedTableId || !column.lookupConfig?.lookupColumnId) {
        return { data: { options: [], totalCount: 0 } };
      }

      const params = new URLSearchParams();
      if (searchValue) params.append('search', searchValue);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await axiosInstance.get(
        `/database/columns/${column._id}/lookup-data?${params.toString()}`
      );
      
      return response.data;
    },
    enabled: !!column && !!column.lookupConfig?.linkedTableId && !!column.lookupConfig?.lookupColumnId,
    staleTime: 30 * 1000, // 30 seconds
  });

  const options = lookupData?.data?.options || [];
  const totalCount = lookupData?.data?.totalCount || 0;

  const handleSearch = (value) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSelect = (selectedValue) => {
    const selectedOption = options.find(opt => opt.value === selectedValue);
    if (selectedOption) {
      onChange(selectedOption);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  // Get display value
  const getDisplayValue = () => {
    if (!value) return null;
    
    if (typeof value === 'object' && value.label) {
      return value.label;
    }
    
    if (typeof value === 'string') {
      // If it's just an ID, try to find the option
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    }
    
    return String(value);
  };

  return (
    <div>
      <Select
        value={value?.value || value}
        onChange={handleSelect}
        onClear={handleClear}
        onSearch={handleSearch}
        placeholder={placeholder}
        disabled={disabled}
        loading={isLoading}
        showSearch
        allowClear
        filterOption={false} // We handle filtering on the server
        notFoundContent={isLoading ? <Spin size="small" /> : 'No data found'}
        style={{ width: '100%' }}
        suffixIcon={<SearchOutlined />}
        dropdownStyle={{ maxHeight: 300 }}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            <div>
              <div style={{ fontWeight: '500' }}>{option.label}</div>
              {column.lookupConfig?.linkedTableName && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  marginTop: '2px'
                }}>
                  from {column.lookupConfig.linkedTableName}
                </div>
              )}
            </div>
          </Option>
        ))}
      </Select>
      
      {error && (
        <div style={{ 
          color: '#ff4d4f', 
          fontSize: '12px', 
          marginTop: '4px' 
        }}>
          Error loading data
        </div>
      )}
    </div>
  );
};

export default LookupDropdown;