import React from 'react';
import { Button, Input, Select, Checkbox, Tooltip, Tag } from 'antd';
import {
  UnorderedListOutlined,
  FilterOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  MoreOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  PlusOutlined,
  DeleteOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import {
  getFieldVisibilityButtonStyle,
  getSystemFieldsButtonStyle,
  getFieldItemStyle,
  getFieldHoverStyle,
  getFieldLeaveStyle,
  filterFieldsBySearch
} from '../Utils/fieldVisibilityUtils.jsx';
import {
  getDataTypeIcon
} from '../Utils/dataTypeUtils.jsx';
import {
  getOperatorOptions,
  getFilterButtonStyle
} from '../Utils/filterUtils.jsx';
import {
  getGroupButtonStyle,
  getGroupRulesCount,
  isFieldUsedInGroup
} from '../Utils/groupUtils.jsx';
import {
  getSortButtonStyle,
  getSortBadgeStyle,
  isSortActive,
  getSortRulesCount
} from '../Utils/tableDetailSortUtils.jsx';
import RowHeightDropdown from './RowHeightDropdown';

const { Option } = Select;

const TableHeader = ({
  // Fields dropdown props
  showFieldsDropdown,
  fieldsDropdownPosition,
  fieldSearch,
  setFieldSearch,
  allColumnsWithSystem,
  fieldVisibility,
  showSystemFields,
  handleFieldsButtonClick,
  handleToggleFieldVisibility,
  handleToggleSystemFields,
  setShowAddColumn,

  // Filter dropdown props
  showFilterDropdown,
  filterDropdownPosition,
  filterRules,
  isFilterActive,
  columns,
  handleFilterButtonClick,
  handleToggleFilterActive,
  handleUpdateFilterRule,
  handleRemoveFilterRule,
  addFilterRule,

  // Group dropdown props
  showGroupDropdown,
  groupDropdownPosition,
  groupRules,
  groupFieldSearch,
  setGroupFieldSearch,
  currentGroupField,
  setCurrentGroupField,
  handleGroupButtonClick,
  handleGroupFieldSelect,
  handleRemoveGroupRule,
  handleExpandAllGroups,
  handleCollapseAllGroups,

  // Sort dropdown props
  showSortDropdown,
  sortDropdownPosition,
  sortRules,
  sortFieldSearch,
  setSortFieldSearch,
  currentSortField,
  setCurrentSortField,
  handleSortButtonClick,
  onSortFieldSelect,
  handleUpdateSortRule,
  handleRemoveSortRule,
  // Row height props
  tableId,
  rowHeightSettings,
  onRowHeightChange
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      backgroundColor: '#fafafa',
      border: '1px solid #d9d9d9',
      borderBottom: 'none',
      borderTopLeftRadius: '6px',
      borderTopRightRadius: '6px',
      marginBottom: '0',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Fields Button */}
        <div style={{ position: 'relative' }}>
          <Button 
            type="text" 
            icon={<UnorderedListOutlined />}
            size="small"
            onClick={handleFieldsButtonClick}
            data-fields-button
            style={getFieldVisibilityButtonStyle(fieldVisibility)}
          >
            Fields
          </Button>
          
          {/* Fields Dropdown */}
          {showFieldsDropdown && (
            <div 
              data-fields-dropdown
              style={{
                position: 'fixed',
                top: fieldsDropdownPosition.y,
                left: fieldsDropdownPosition.x,
                zIndex: 9999,
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UnorderedListOutlined style={{ color: '#666' }} />
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Fields</span>
                </div>
              </div>

              {/* Search Bar */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <Input
                  placeholder="Search fields"
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  size="small"
                  style={{ 
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
              
              {/* Field List */}
              <div style={{ 
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {allColumnsWithSystem ? filterFieldsBySearch(allColumnsWithSystem, fieldSearch)
                  .map(column => (
                    <div
                      key={column._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0',
                        ...getFieldItemStyle(fieldVisibility, column._id, column.isSystem)
                      }}
                      onMouseEnter={(e) => {
                        const hoverStyle = getFieldHoverStyle(fieldVisibility, column._id);
                        Object.assign(e.target.style, hoverStyle);
                      }}
                      onMouseLeave={(e) => {
                        const leaveStyle = getFieldLeaveStyle(fieldVisibility, column._id, column.isSystem);
                        Object.assign(e.target.style, leaveStyle);
                      }}
                      onClick={() => handleToggleFieldVisibility(column._id)}
                    >
                      {/* Field Icon */}
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: column.isSystem ? '#f0f0f0' : '#e6f7ff',
                        borderRadius: '3px',
                        padding: '4px 6px',
                        minWidth: '24px',
                        minHeight: '20px',
                        border: '1px solid #d9d9d9'
                      }}>
                        {getDataTypeIcon(column.dataType)}
                      </div>
                      
                      {/* Field Name */}
                      <span style={{ 
                        fontSize: '13px', 
                        flex: 1,
                        fontWeight: fieldVisibility[column._id] === false ? '400' : (column.isSystem ? '400' : '500'),
                        color: fieldVisibility[column._id] === false ? '#999' : (column.isSystem ? '#52c41a' : '#333'),
                        fontStyle: column.isSystem ? 'italic' : 'normal',
                        textDecoration: fieldVisibility[column._id] === false ? 'line-through' : 'none'
                      }}>
                        {String(column.name || '')}
                      </span>
                      
                      {/* Visibility Toggle */}
                      <Checkbox
                        checked={column.isSystem ? 
                          (showSystemFields && fieldVisibility[column._id] !== false) : 
                          (fieldVisibility[column._id] !== false)
                        }
                        onChange={() => handleToggleFieldVisibility(column._id)}
                        style={{ margin: 0 }}
                      />
                    </div>
                  )) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#999', 
                      fontSize: '14px', 
                      padding: '20px'
                    }}>
                      Loading fields...
                    </div>
                  )}
              </div>
              
              {/* Bottom Action Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <Button
                  type="text"
                  size="small"
                  onClick={handleToggleSystemFields}
                  style={getSystemFieldsButtonStyle(showSystemFields)}
                >
                  System fields
                </Button>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  size="small"
                  onClick={() => setShowAddColumn(true)}
                  style={{ 
                    color: '#1890ff',
                    fontSize: '12px'
                  }}
                >
                  + New Field
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Button */}
        <div style={{ position: 'relative' }}>
          <Button 
            type="text" 
            icon={<FilterOutlined />}
            size="small"
            onClick={handleFilterButtonClick}
            data-filter-button
            style={getFilterButtonStyle(filterRules)}
          >
            Filter {filterRules.length > 0 && filterRules.length}
          </Button>
          
          {/* Filter Dropdown */}
          {showFilterDropdown && (
            <div 
              data-filter-dropdown
              style={{
                position: 'fixed',
                top: filterDropdownPosition.y,
                left: filterDropdownPosition.x,
                zIndex: 9999,
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                minWidth: '400px',
                padding: '20px'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FilterOutlined style={{ color: '#666' }} />
                  <span style={{ fontWeight: '500', fontSize: '16px' }}>Filter</span>
                </div>
                <Checkbox
                  checked={isFilterActive}
                  onChange={handleToggleFilterActive}
                  size="small"
                >
                  Active
                </Checkbox>
              </div>
              
              {/* Filter Rules */}
              {filterRules.length > 0 ? (
                <div>
                  {filterRules.map((rule, index) => {
                    const column = columns.find(col => col.name === rule.field);
                    const operatorOptions = getOperatorOptions(column?.dataType || 'text');
                    
                    return (
                      <div key={index} style={{
                        marginBottom: '16px'
                      }}>
                        {/* Filter Rule Row */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: '#fafafa',
                          borderRadius: '6px',
                          border: '1px solid #e8e8e8'
                        }}>
                          {/* Where Label */}
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '500', 
                            color: '#666',
                            minWidth: '50px'
                          }}>
                            Where
                          </span>
                          
                          {/* Field Select */}
                          <Select
                            value={rule.field}
                            onChange={(value) => handleUpdateFilterRule(index, value, rule.operator, rule.value)}
                            size="small"
                            style={{ 
                              width: '140px',
                              backgroundColor: 'white'
                            }}
                            suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                            dropdownStyle={{ zIndex: 9999 }}
                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                            placeholder="Select field"
                            showSearch={false}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {columns.map(col => (
                              <Option key={col._id} value={col.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {getDataTypeIcon(col.dataType)}
                                  <span>{String(col.name || '')}</span>
                                </div>
                              </Option>
                            ))}
                          </Select>
                          
                          {/* Operator Select */}
                          <Select
                            value={rule.operator}
                            onChange={(value) => handleUpdateFilterRule(index, rule.field, value, rule.value)}
                            size="small"
                            style={{ 
                              width: '120px',
                              backgroundColor: 'white'
                            }}
                            suffixIcon={<DownOutlined style={{ fontSize: '12px' }} />}
                            dropdownStyle={{ zIndex: 9999 }}
                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                            placeholder="Select operator"
                            showSearch={false}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            {operatorOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                          
                          {/* Value Input */}
                          {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                            <Input
                              value={rule.value}
                              onChange={(e) => handleUpdateFilterRule(index, rule.field, rule.operator, e.target.value)}
                              size="small"
                              style={{ 
                                flex: 1,
                                backgroundColor: 'white'
                              }}
                              placeholder="Enter a value"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          )}
                          
                          {/* Delete Button */}
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => handleRemoveFilterRule(index)}
                            style={{ 
                              color: '#666',
                              padding: '4px 8px'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#999', 
                  fontSize: '14px', 
                  marginBottom: '16px',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: '6px'
                }}>
                  No filter rules added yet
                </div>
              )}
              
              {/* Add Filter Button */}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addFilterRule}
                style={{ 
                  width: '100%',
                  height: '36px',
                  borderStyle: 'dashed',
                  borderColor: '#d9d9d9'
                }}
                size="small"
              >
                + Add filter
              </Button>
            </div>
          )}
        </div>

        {/* Group Button */}
        <div style={{ position: 'relative' }}>
          <Button 
            type="text" 
            icon={<AppstoreOutlined />}
            size="small"
            onClick={handleGroupButtonClick}
            data-group-button
            style={getGroupButtonStyle(groupRules)}
          >
            Group
            {getGroupRulesCount(groupRules) > 0 && (
              <span style={{
                backgroundColor: '#52c41a',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getGroupRulesCount(groupRules)}
              </span>
            )}
          </Button>
          
          {/* Group Dropdown */}
          {showGroupDropdown && (
            <div 
              data-group-dropdown
              style={{
                position: 'fixed',
                top: groupDropdownPosition.y,
                left: groupDropdownPosition.x,
                zIndex: 1000,
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AppstoreOutlined style={{ color: '#666' }} />
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Group</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tooltip title="Expand All Groups">
                    <Button
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      style={{ color: '#666' }}
                      onClick={handleExpandAllGroups}
                    />
                  </Tooltip>
                  <Tooltip title="Collapse All Groups">
                    <Button
                      type="text"
                      size="small"
                      icon={<RightOutlined />}
                      style={{ color: '#666' }}
                      onClick={handleCollapseAllGroups}
                    />
                  </Tooltip>
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    style={{ color: '#666' }}
                  />
                </div>
              </div>

              {/* Show group rules and add option when rules exist */}
              {groupRules.length > 0 ? (
                <>
                  {/* Existing Group Rules */}
                  {groupRules.map((rule, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#f6ffed'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#e6f7ff',
                          borderRadius: '3px',
                          padding: '4px 6px',
                          minWidth: '24px',
                          minHeight: '20px',
                          border: '1px solid #d9d9d9'
                        }}>
                          {getDataTypeIcon(columns.find(col => col.name === rule.field)?.dataType || 'text')}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{rule.field}</span>
                      </div>

                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleRemoveGroupRule(index)}
                        style={{ color: '#ff4d4f' }}
                      />
                    </div>
                  ))}

                  {/* Add Group Option */}
                  <div style={{ padding: '12px 16px' }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setCurrentGroupField('show_field_selection');
                        setGroupFieldSearch('');
                      }}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      + Add Group Option
                    </Button>
                  </div>

                  {/* Field Selection when adding new group option */}
                  {currentGroupField === 'show_field_selection' && (
                    <>
                      {/* Search Input */}
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <Input
                          placeholder="Select Field to Group"
                          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                          value={groupFieldSearch}
                          onChange={(e) => setGroupFieldSearch(e.target.value)}
                          size="small"
                          style={{ 
                            border: '1px solid #52c41a',
                            borderRadius: '4px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Field List */}
                      <div style={{ 
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {columns
                          .filter(column => 
                            column.name.toLowerCase().includes(groupFieldSearch.toLowerCase()) &&
                            !isFieldUsedInGroup(groupRules, column.name)
                          )
                          .map(column => (
                            <div
                              key={column._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => handleGroupFieldSelect(column.name)}
                              onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#e6f7ff',
                                borderRadius: '3px',
                                padding: '4px 6px',
                                minWidth: '24px',
                                minHeight: '20px',
                                border: '1px solid #d9d9d9'
                              }}>
                                {getDataTypeIcon(column.dataType)}
                              </div>
                              <span style={{ fontSize: '13px' }}>{column.name}</span>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Initial State - Show search and field list when no group rules exist */}
                  {/* Search Input */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Input
                      placeholder="Select Field to Group"
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      value={groupFieldSearch}
                      onChange={(e) => setGroupFieldSearch(e.target.value)}
                      size="small"
                      style={{ 
                        border: '1px solid #52c41a',
                        borderRadius: '4px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Field List */}
                  <div style={{ 
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {columns
                      .filter(column => 
                        column.name.toLowerCase().includes(groupFieldSearch.toLowerCase()) &&
                        !isFieldUsedInGroup(groupRules, column.name)
                      )
                      .map(column => (
                        <div
                          key={column._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={() => handleGroupFieldSelect(column.name)}
                          onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#e6f7ff',
                              borderRadius: '3px',
                              padding: '4px 6px',
                              minWidth: '24px',
                              minHeight: '20px',
                              border: '1px solid #d9d9d9'
                            }}>
                              {getDataTypeIcon(column.dataType)}
                            </div>
                          <span style={{ fontSize: '13px' }}>{column.name}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sort Button */}
        <div style={{ position: 'relative' }}>
          <Button 
            type="text" 
            icon={<BarChartOutlined />}
            size="small"
            onClick={handleSortButtonClick}
            data-sort-button
            style={getSortButtonStyle(sortRules)}
          >
            Sort
            {isSortActive(sortRules) && (
              <span style={getSortBadgeStyle()}>
                {getSortRulesCount(sortRules)}
              </span>
            )}
          </Button>
          
          {/* Sort Dropdown */}
          {showSortDropdown && (
            <div 
              data-sort-dropdown
              style={{
                position: 'fixed',
                top: sortDropdownPosition.y,
                left: sortDropdownPosition.x,
                zIndex: 1000,
                backgroundColor: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                minWidth: '300px',
                maxWidth: '400px'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChartOutlined style={{ color: '#666' }} />
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>Sort</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<SortAscendingOutlined />}
                    style={{ color: '#666' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    style={{ color: '#666' }}
                  />
                </div>
              </div>

              {/* Show sort rules and add option when rules exist */}
              {isSortActive(sortRules) ? (
                <>
                  {/* Existing Sort Rules */}
                  {sortRules.map((rule, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <div style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#e6f7ff',
                          borderRadius: '3px',
                          padding: '4px 6px',
                          minWidth: '24px',
                          minHeight: '20px',
                          border: '1px solid #d9d9d9'
                        }}>
                          {getDataTypeIcon(columns.find(col => col.name === rule.field)?.dataType || 'text')}
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{rule.field}</span>
                      </div>
                      <Select
                        value={rule.order}
                        onChange={(value) => handleUpdateSortRule(index, rule.field, value)}
                        size="small"
                        style={{ width: '100px' }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Option value="asc">A → Z</Option>
                        <Option value="desc">Z → A</Option>
                      </Select>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleRemoveSortRule(index)}
                        style={{ color: '#ff4d4f' }}
                      />
                    </div>
                  ))}

                  {/* Add Sort Option */}
                  <div style={{ padding: '12px 16px' }}>
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setCurrentSortField('show_field_selection');
                        setSortFieldSearch('');
                      }}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      + Add Sort Option
                    </Button>
                  </div>

                  {/* Field Selection when adding new sort option */}
                  {currentSortField === 'show_field_selection' && (
                    <>
                      {/* Search Input */}
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f0f0f0'
                      }}>
                        <Input
                          placeholder="Select Field to Sort"
                          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                          value={sortFieldSearch}
                          onChange={(e) => setSortFieldSearch(e.target.value)}
                          size="small"
                          style={{ 
                            border: '1px solid #1890ff',
                            borderRadius: '4px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* Field List */}
                      <div style={{ 
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        {columns
                          .filter(column => 
                            column.name.toLowerCase().includes(sortFieldSearch.toLowerCase()) &&
                            !sortRules.some(rule => rule.field === column.name)
                          )
                          .map(column => (
                            <div
                              key={column._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'background-color 0.2s'
                              }}
                              onClick={() => onSortFieldSelect(column.name)}
                              onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#e6f7ff',
                                borderRadius: '3px',
                                padding: '4px 6px',
                                minWidth: '24px',
                                minHeight: '20px',
                                border: '1px solid #d9d9d9'
                              }}>
                                {getDataTypeIcon(column.dataType)}
                              </div>
                              <span style={{ fontSize: '13px' }}>{column.name}</span>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Initial State - Show search and field list when no sort rules exist */}
                  {/* Search Input */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <Input
                      placeholder="Select Field to Sort"
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      value={sortFieldSearch}
                      onChange={(e) => setSortFieldSearch(e.target.value)}
                      size="small"
                      style={{ 
                        border: '1px solid #1890ff',
                        borderRadius: '4px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Field List */}
                  <div style={{ 
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {columns
                      .filter(column => 
                        column.name.toLowerCase().includes(sortFieldSearch.toLowerCase()) &&
                        !sortRules.some(rule => rule.field === column.name)
                      )
                      .map(column => (
                        <div
                          key={column._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={() => onSortFieldSelect(column.name)}
                          onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#e6f7ff',
                              borderRadius: '3px',
                              padding: '4px 6px',
                              minWidth: '24px',
                              minHeight: '20px',
                              border: '1px solid #d9d9d9'
                            }}>
                              {getDataTypeIcon(column.dataType)}
                            </div>
                          <span style={{ fontSize: '13px' }}>{column.name}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Row Height Dropdown */}
        <RowHeightDropdown
          tableId={tableId}
          currentSettings={rowHeightSettings}
          onRowHeightChange={onRowHeightChange}
        />
        
        <Button 
          type="text" 
          icon={<MoreOutlined />}
          size="small"
          style={{ color: '#666' }}
        />
      </div>
      <Button 
        type="text" 
        icon={<SearchOutlined />}
        size="small"
        style={{ color: '#666' }}
      />
    </div>
  );
};

export default TableHeader;
