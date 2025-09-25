import moment from 'moment';
import React, { useState } from 'react';
import { 
  Modal, 
  Button, 
  Select, 
  Input, 
  DatePicker, 
  InputNumber, 
  Switch, 
  Tag, 
  Space, 
  Divider,
  Typography,
  Card,
  Row,
  Col,
  Checkbox
} from 'antd';
import { 
  FilterOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  ClearOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getDataTypeIcon } from '../../pages/DatabaseManagement/Utils/dataTypeUtils';
import axiosInstance from '../../utils/axiosInstance-cookie-only';

const { Option } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;

const FilterModal = ({ 
  open, 
  onCancel, 
  onApply, 
  onClear,
  columns = [], 
  currentFilters = {},
  searchQuery = ''
}) => {
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [operatorsByType, setOperatorsByType] = useState({});

  // Initialize filters when modal opens
  React.useEffect(() => {
    if (open) {
      setFilters(currentFilters || {});
      setSearch(searchQuery || '');
    }
  }, [open, currentFilters, searchQuery]);

  // Fetch filter operators for a field type
  const fetchOperators = async (fieldType) => {
    if (operatorsByType[fieldType]) {
      return operatorsByType[fieldType];
    }

    try {
      const response = await axiosInstance.get(`/database/kanban/filter-operators/${fieldType}`);
      const operators = response.data.operators || [];
      setOperatorsByType(prev => ({
        ...prev,
        [fieldType]: operators
      }));
      return operators;
    } catch (error) {
      console.error('Error fetching operators:', error);
      return [
        { value: 'contains', label: 'Contains' },
        { value: 'equals', label: 'Equals' }
      ];
    }
  };

  // Add new filter
  const addFilter = (fieldName = '') => {
    const filterId = Date.now().toString();
    setFilters(prev => ({
      ...prev,
      [filterId]: {
        field: fieldName,
        operator: 'contains',
        value: ''
      }
    }));
  };

  // Remove filter
  const removeFilter = (filterId) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
  };

  // Update filter
  const updateFilter = (filterId, key, value) => {
    setFilters(prev => ({
      ...prev,
      [filterId]: {
        ...prev[filterId],
        [key]: value
      }
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearch('');
  };

  // Apply filters
  const handleApply = () => {
    // Convert filters to the expected format
    const processedFilters = {};
    Object.values(filters).forEach(filter => {
      if (filter.field && filter.operator && (filter.value !== '' && filter.value !== null && filter.value !== undefined)) {
        processedFilters[filter.field] = {
          operator: filter.operator,
          value: filter.value
        };
      }
    });

    onApply(processedFilters, search);
  };

  // Get filter input component based on field type and operator
  const getFilterInput = (filter, filterId, column) => {
    const { operator, value } = filter;
    const dataType = column?.dataType || 'text';

    // Handle empty checks - no value input needed
    if (operator === 'is_empty' || operator === 'is_not_empty') {
      return (
        <div className="flex items-center justify-center h-8 text-gray-500 text-sm">
          No value needed
        </div>
      );
    }

    // Handle multi-select operators
    if (operator === 'in' || operator === 'not_in') {
      if (dataType === 'single_select' || dataType === 'multi_select') {
        const options = column?.options || column?.singleSelectConfig?.options || column?.multiSelectConfig?.options || [];
        return (
          <Select
            mode="multiple"
            placeholder="Select values"
            value={Array.isArray(value) ? value : []}
            onChange={(val) => updateFilter(filterId, 'value', val)}
            className="w-full"
          >
            {options.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        );
      } else {
        return (
          <Select
            mode="tags"
            placeholder="Enter values"
            value={Array.isArray(value) ? value : []}
            onChange={(val) => updateFilter(filterId, 'value', val)}
            className="w-full"
          />
        );
      }
    }

    // Handle different data types
    switch (dataType) {
      case 'number':
      case 'currency':
      case 'percent':
      case 'rating':
        return (
          <InputNumber
            placeholder="Enter number"
            value={value}
            onChange={(val) => updateFilter(filterId, 'value', val)}
            className="w-full"
          />
        );

      case 'date':
      case 'datetime':
        return (
          <DatePicker
            placeholder="Select date"
            value={value ? moment(value) : null}
            onChange={(date) => updateFilter(filterId, 'value', date ? date.toISOString() : '')}
            className="w-full"
          />
        );

      case 'checkbox':
        return (
          <Select
            placeholder="Select value"
            value={value}
            onChange={(val) => updateFilter(filterId, 'value', val)}
            className="w-full"
          >
            <Option value={true}>True</Option>
            <Option value={false}>False</Option>
          </Select>
        );

      case 'single_select':
        const singleSelectOptions = column?.options || column?.singleSelectConfig?.options || [];
        return (
          <Select
            placeholder="Select value"
            value={value}
            onChange={(val) => updateFilter(filterId, 'value', val)}
            className="w-full"
            allowClear
          >
            {singleSelectOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        );

      case 'multi_select':
        const multiSelectOptions = column?.options || column?.multiSelectConfig?.options || [];
        return (
          <Select
            mode={operator === 'contains' || operator === 'not_contains' ? 'multiple' : undefined}
            placeholder="Select value(s)"
            value={value}
            onChange={(val) => updateFilter(filterId, 'value', val)}
            className="w-full"
            allowClear
          >
            {multiSelectOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        );

      case 'long_text':
        return (
          <TextArea
            placeholder="Enter text"
            value={value}
            onChange={(e) => updateFilter(filterId, 'value', e.target.value)}
            rows={2}
            className="w-full"
          />
        );

      default:
        return (
          <Input
            placeholder="Enter value"
            value={value}
            onChange={(e) => updateFilter(filterId, 'value', e.target.value)}
            className="w-full"
          />
        );
    }
  };

  const filterCount = Object.keys(filters).length;
  const hasActiveFilters = filterCount > 0 || search;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FilterOutlined className="text-blue-500" />
          <span>Filter Records</span>
          {hasActiveFilters && (
            <Tag color="blue">
              {filterCount} filter{filterCount !== 1 ? 's' : ''}{search && ' + search'}
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="clear" icon={<ClearOutlined />} onClick={clearAllFilters}>
          Clear All
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="apply" 
          type="primary" 
          onClick={handleApply}
          icon={<FilterOutlined />}
        >
          Apply Filters
        </Button>
      ]}
    >
      <div className="space-y-4">
        {/* Search Section */}
        <Card size="small" title="Global Search">
          <Input
            placeholder="Search across all fields..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
          {search && (
            <div className="mt-2">
              <Text type="secondary" className="text-xs">
                Search will look for "{search}" in any field value
              </Text>
            </div>
          )}
        </Card>

        {/* Field Filters Section */}
        <Card 
          size="small" 
          title="Field Filters"
          extra={
            <Button 
              type="dashed" 
              size="small" 
              icon={<PlusOutlined />} 
              onClick={() => addFilter()}
            >
              Add Filter
            </Button>
          }
        >
          {Object.keys(filters).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm font-medium">No filters added yet</div>
              <div className="text-xs mt-1">
                Click "Add Filter" to start filtering your records
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(filters).map(([filterId, filter]) => {
                const selectedColumn = columns.find(col => col.name === filter.field);
                
                return (
                  <Card key={filterId} size="small" className="bg-gray-50">
                    <Row gutter={[16, 8]} align="middle">
                      {/* Field Selection */}
                      <Col span={6}>
                        <Select
                          placeholder="Select field"
                          value={filter.field}
                          onChange={(value) => {
                            updateFilter(filterId, 'field', value);
                            // Reset operator when field changes
                            updateFilter(filterId, 'operator', 'contains');
                            updateFilter(filterId, 'value', '');
                          }}
                          className="w-full"
                          showSearch
                        >
                          {columns.map(column => (
                            <Option key={column.name} value={column.name}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 flex items-center justify-center">
                                  {getDataTypeIcon(column.dataType)}
                                </div>
                                <span>{column.name}</span>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Col>

                      {/* Operator Selection */}
                      <Col span={5}>
                        {filter.field && selectedColumn ? (
                          <Select
                            placeholder="Operator"
                            value={filter.operator}
                            onChange={(value) => {
                              updateFilter(filterId, 'operator', value);
                              // Clear value when operator changes
                              updateFilter(filterId, 'value', '');
                            }}
                            className="w-full"
                            onFocus={() => fetchOperators(selectedColumn.dataType)}
                          >
                            {(operatorsByType[selectedColumn.dataType] || []).map(op => (
                              <Option key={op.value} value={op.value}>
                                {op.label}
                              </Option>
                            ))}
                          </Select>
                        ) : (
                          <Select placeholder="Select field first" disabled className="w-full" />
                        )}
                      </Col>

                      {/* Value Input */}
                      <Col span={10}>
                        {filter.field && selectedColumn ? (
                          getFilterInput(filter, filterId, selectedColumn)
                        ) : (
                          <Input placeholder="Select field and operator" disabled className="w-full" />
                        )}
                      </Col>

                      {/* Remove Button */}
                      <Col span={3}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeFilter(filterId)}
                          className="w-full"
                        />
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Filters */}
        <Card size="small" title="Quick Filters">
          <div className="flex flex-wrap gap-2">
            {columns
              .filter(col => ['single_select', 'multi_select', 'checkbox'].includes(col.dataType))
              .slice(0, 5)
              .map(column => (
                <Button
                  key={column.name}
                  size="small"
                  type="dashed"
                  onClick={() => addFilter(column.name)}
                  className="text-xs"
                >
                  <div className="flex items-center gap-1">
                    {getDataTypeIcon(column.dataType)}
                    {column.name}
                  </div>
                </Button>
              ))
            }
          </div>
          {columns.filter(col => ['single_select', 'multi_select', 'checkbox'].includes(col.dataType)).length === 0 && (
            <Text type="secondary" className="text-xs">
              No filterable fields available
            </Text>
          )}
        </Card>
      </div>
    </Modal>
  );
};

export default FilterModal;
