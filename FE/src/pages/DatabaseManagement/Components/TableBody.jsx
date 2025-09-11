import React, { useState } from 'react';
import { Button, Input, Select, Checkbox, Tooltip, Tag, Dropdown, DatePicker } from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  DownOutlined,
  RightOutlined,
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
import { formatDateForDisplay, formatDateForInput } from '../../../utils/dateFormatter.js';
import dayjs from 'dayjs';
import {
  getColumnWidthString,
  isColumnCompact
} from '../Utils/columnUtils.jsx';
import {
  getDataTypeIcon
} from '../Utils/dataTypeUtils.jsx';

// Custom SingleSelectPill component
const SingleSelectPill = ({ value, options, onChange, onAddNewOption, isActive = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const pillRef = React.useRef(null);

  // Color mapping for different options
  const getPillColor = (option) => {
    const optionStr = String(option).toLowerCase();
    if (optionStr === '1' || optionStr.includes('option 1') || optionStr.includes('status 1')) {
      return { bg: '#e6f7ff', text: '#1890ff', border: '#91d5ff' };
    } else if (optionStr === '2' || optionStr.includes('option 2') || optionStr.includes('status 2')) {
      return { bg: '#e6fffb', text: '#13c2c2', border: '#87e8de' };
    } else if (optionStr === '3' || optionStr.includes('option 3') || optionStr.includes('status 3')) {
      return { bg: '#f6ffed', text: '#52c41a', border: '#b7eb8f' };
    } else {
      return { bg: '#f0f0f0', text: '#666666', border: '#d9d9d9' };
    }
  };

  const selectedColor = getPillColor(value);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        ref={pillRef}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '16px',
          backgroundColor: selectedColor.bg,
          color: selectedColor.text,
          border: `1px solid ${selectedColor.border}`,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          minWidth: '32px',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isActive ? '0 0 0 2px #1890ff' : 'none',
          position: 'relative'
        }}
        onClick={() => {
          if (!isOpen && pillRef.current) {
            const rect = pillRef.current.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX + (rect.width / 2)
            });
          }
          setIsOpen(!isOpen);
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        {value || 'Select'}
        <DownOutlined 
          style={{ 
            marginLeft: '4px', 
            fontSize: '10px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e8e8e8',
            padding: '4px',
            minWidth: '120px'
          }}
        >
          {options.map((option, index) => {
            const optionColor = getPillColor(option);
            const isSelected = option === value;
            
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  backgroundColor: isSelected ? optionColor.bg : 'transparent',
                  color: isSelected ? optionColor.text : '#333',
                  border: `1px solid ${isSelected ? optionColor.border : 'transparent'}`,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  margin: '2px 0',
                  transition: 'all 0.2s ease',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = optionColor.bg;
                    e.target.style.color = optionColor.text;
                    e.target.style.borderColor = optionColor.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#333';
                    e.target.style.borderColor = 'transparent';
                  }
                }}
              >
                {option}
              </div>
            );
          })}
          
          {onAddNewOption && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderTop: '1px solid #e8e8e8',
                marginTop: '4px',
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                const newOption = prompt('Enter new option:');
                if (newOption && newOption.trim()) {
                  onAddNewOption(newOption);
                  setIsOpen(false);
                }
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f0f7ff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <PlusOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
import {
  isCellEditing
} from '../Utils/cellUtils.jsx';
import ProgressBar from './ProgressBar';

const { Option } = Select;

const TableBody = ({
  // Data props
  visibleColumns,
  columns,
  records,
  groupedData,
  expandedGroups,
  selectedRowKeys,
  columnWidths,
  editingCell,
  selectedCell,
  cellValue,

  // Handlers
  handleSelectAll,
  handleSelectRow,
  handleCellClick,
  handleCellSave,
  setCellValue,
  handleResizeStart,
  handleEditColumn,
  handleDeleteColumn,
  handleAddRow,
  handleAddRowToGroup,
  handleToggleGroupExpansion,
  handleContextMenu,
  updateRecordMutation,
  updateColumnMutation,

  // State
  isResizing,
  resizingColumn,
  selectAll,
  setShowAddColumn,

  // Utility functions
  formatCellValueForDisplay
}) => {
  // Format datetime to YYYY-MM-DD HH:MM format
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  // Check if a cell is selected
  const isCellSelected = (recordId, columnName) => {
    return selectedCell?.recordId === recordId && selectedCell?.columnName === columnName;
  };

  // Function to add new option to single select column
  const handleAddNewOption = (column, newOption) => {
    if (!newOption || !newOption.trim()) return;
    
    const currentOptions = column.singleSelectConfig?.options || [];
    const updatedOptions = [...currentOptions, newOption.trim()];
    
    const updatedColumnData = {
      ...column,
      singleSelectConfig: {
        ...column.singleSelectConfig,
        options: updatedOptions
      }
    };
    
    updateColumnMutation.mutate({
      columnId: column._id,
      columnData: updatedColumnData
    });
  };

  return (
    <div
      data-table-container
      style={{
        background: 'transparent',
        overflow: 'auto',
        cursor: isResizing ? 'col-resize' : 'default',
        width: '100%'
      }}
    >
      <div style={{
        display: 'block',
        border: '1px solid #d9d9d9',
        borderTop: '1px solid #d9d9d9',
        overflow: 'auto',
        backgroundColor: 'transparent',
        userSelect: isResizing ? 'none' : 'auto',
        width: 'fit-content',
        minWidth: 'max-content',
        maxWidth: '100%',
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #d9d9d9',
          backgroundColor: '#fafafa'
        }}>
          {/* Checkbox and Index Column */}
          <div style={{
            width: '60px',
            minWidth: '60px',
            padding: '8px',
            borderRight: '1px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            backgroundColor: '#f5f5f5'
          }}>
            <Checkbox
              checked={selectAll}
              onClick={() => handleSelectAll(null, records)}
              indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < records.length}
            />
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>#</span>
          </div>

          {/* Data Columns */}
          {visibleColumns.map(column => (
            <div key={column._id} style={{
              width: getColumnWidthString(columnWidths, column._id),
              minWidth: '50px',
              padding: isColumnCompact(columnWidths, column._id) ? '4px' : '8px',
              borderRight: '1px solid #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isColumnCompact(columnWidths, column._id) ? 'center' : 'space-between',
              backgroundColor: column.isSystem ? '#f6ffed' : '#f5f5f5',
              position: 'relative',
              borderTop: column.isSystem ? '2px solid #52c41a' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
                {isColumnCompact(columnWidths, column._id) ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: column.isSystem ? '#52c41a' : '#666',
                    fontStyle: column.isSystem ? 'italic' : 'normal'
                  }}>
                    {getDataTypeIcon(column.dataType)}
                  </div>
                ) : (
                  <>
                    {getDataTypeIcon(column.dataType)}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: column.isSystem ? '400' : 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: column.isSystem ? '#52c41a' : '#333',
                      fontStyle: column.isSystem ? 'italic' : 'normal'
                    }}>
                      {column.name}
                    </span>
                    {column.isSystem && (
                      <span style={{
                        fontSize: '10px',
                        color: '#52c41a',
                        fontWeight: 'bold',
                        marginLeft: '4px'
                      }}>
                        S
                      </span>
                    )}
                  </>
                )}
              </div>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      label: 'Chỉnh sửa cột',
                      icon: <MoreOutlined />,
                      onClick: () => handleEditColumn(column),
                    },
                    {
                      type: 'divider',
                    },
                    {
                      key: 'delete',
                      label: 'Delete Column',
                      icon: <MoreOutlined />,
                      danger: true,
                      onClick: () => handleDeleteColumn(column._id, column.name),
                    }
                  ]
                }}
                trigger={['click']}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  style={{
                    padding: isColumnCompact(columnWidths, column._id) ? '2px' : '2px',
                    fontSize: isColumnCompact(columnWidths, column._id) ? '10px' : '12px'
                  }}
                />
              </Dropdown>

              {/* Resize handle */}
              <div
                style={{
                  position: 'absolute',
                  right: '-3px',
                  top: 0,
                  bottom: 0,
                  width: '6px',
                  cursor: 'col-resize',
                  backgroundColor: isResizing && resizingColumn === column._id ? '#1890ff' : 'transparent',
                  zIndex: 1
                }}
                onMouseDown={(e) => handleResizeStart(e, column._id)}
                onMouseEnter={(e) => {
                  if (!isResizing) {
                    e.target.style.backgroundColor = '#d9d9d9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isResizing || resizingColumn !== column._id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              />
            </div>
          ))}

          {/* Add Column Button */}
          <div style={{
            width: '50px',
            minWidth: '50px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
            onClick={() => setShowAddColumn(true)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          >
            <Tooltip title="Thêm cột">
              <PlusOutlined
                style={{
                  color: '#1890ff',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'visible' }}>
          {/* Grouped Records */}
          {groupedData.groups.map((group, groupIndex) => {
            const isExpanded = expandedGroups.has(group.key);

            return (
              <div key={group.key} style={{
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                {/* Group Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid #d9d9d9' : 'none',
                  backgroundColor: '#f6ffed',
                  transition: 'background-color 0.2s'
                }}
                  onClick={() => handleToggleGroupExpansion(group.key)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f6ffed'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#52c41a',
                      textTransform: 'uppercase'
                    }}>
                      {group.rules[0].field}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {group.values[0] || '(empty)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tooltip title={`Add record to ${group.rules[0].field}: ${group.values[0] || '(empty)'}`}>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        style={{
                          color: '#52c41a',
                          fontSize: '12px',
                          padding: '2px 4px',
                          minWidth: 'auto'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddRowToGroup(group.values, group.rules);
                        }}
                      />
                    </Tooltip>
                    <span style={{
                      fontSize: '11px',
                      color: '#666',
                      backgroundColor: '#e6f7ff',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      Count {group.count}
                    </span>
                  </div>
                </div>

                {/* Group Records */}
                {isExpanded && group.records.map((record, index) => (
                  <div key={record._id} style={{
                    display: 'flex',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: 'white'
                  }}
                    onContextMenu={(e) => handleContextMenu(e, record._id)}
                  >
                    {/* Checkbox and Index */}
                    <div style={{
                      width: '60px',
                      minWidth: '60px',
                      padding: '8px',
                      borderRight: '1px solid #d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      backgroundColor: '#fafafa'
                    }}>
                      <Checkbox
                        checked={selectedRowKeys.includes(record._id)}
                        onChange={(e) => handleSelectRow(record._id, e.target.checked)}
                      />
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        fontWeight: 'bold',
                        opacity: selectedRowKeys.includes(record._id) ? 0.3 : 1
                      }}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Data Cells */}
                    {visibleColumns.map(column => {
                      let value = '';
                      if (column.isSystem) {
                        // Handle system fields
                        switch (column.name) {
                          case 'Id':
                            value = record._id || '';
                            break;
                          case 'CreatedAt':
                            value = record.createdAt ? formatDateTime(record.createdAt) : '';
                            break;
                          case 'UpdatedAt':
                            value = record.updatedAt ? formatDateTime(record.updatedAt) : '';
                            break;
                          default:
                            value = '';
                        }
                      } else {
                        // For percent columns, use default value if no value provided
                        if (column.dataType === 'percent') {
                          const cellValue = record.data?.[column.name];
                          value = (cellValue !== null && cellValue !== undefined && cellValue !== '') 
                            ? cellValue 
                            : (column.percentConfig?.defaultValue || 0);
                        } else if (column.dataType === 'single_select') {
                          // For single select columns, use default value if cell is null/undefined (new records)
                          // But if cell is empty string (cleared by user), show empty
                          const cellValue = record.data?.[column.name];
                          if (cellValue === null || cellValue === undefined) {
                            // New record - use default value
                            value = column.singleSelectConfig?.defaultValue || '';
                          } else {
                            // Existing record - use actual value (including empty string if cleared)
                            value = cellValue;
                          }
                        } else {
                          value = record.data?.[column.name] || '';
                        }
                      }
                      const isEditing = isCellEditing(editingCell, record._id, column.name);
                      const isSelected = isCellSelected(record._id, column.name);

                      return (
                        <div key={column._id} style={{
                          width: getColumnWidthString(columnWidths, column._id),
                          minWidth: '50px',
                          padding: '0',
                          borderRight: '1px solid #d9d9d9',
                          position: 'relative',
                          minHeight: '40px',
                          boxShadow: isSelected ? 'inset 0 0 0 2px #1890ff' : 'none'
                        }}>
                          {isEditing ? (
                            (() => {
                              const dataType = column.dataType;

                              if (dataType === 'date') {
                                return (
                                  <Input
                                    type="date"
                                    value={formatDateForInput(cellValue)}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  />
                                );
                              } else if (dataType === 'percent') {
                                return (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  />
                                );
                              } else if (dataType === 'number' || dataType === 'currency') {
                                return (
                                  <Input
                                    type="number"
                                    step={dataType === 'currency' ? "0.01" : undefined}
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  />
                                );
                              } else if (dataType === 'year') {
                                return (
                                  <DatePicker
                                    picker="year"
                                    value={cellValue ? dayjs().year(cellValue) : null}
                                    onChange={(date) => {
                                      const year = date ? date.year() : '';
                                      setCellValue(year);
                                    }}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder="Select year"
                                    style={{ 
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                    inputStyle={{
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      height: '100%'
                                    }}
                                  />
                                );
                              } else if (dataType === 'phone') {
                                return (
                                  <Input
                                    type="tel"
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder="Enter phone number"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  />
                                );
                              } else if (dataType === 'time') {
                                const format = column.timeConfig?.format || '24';
                                const placeholder = format === '24' ? 'Enter time (HH:MM)' : 'Enter time (H:MM AM/PM)';
                                
                                return (
                                  <Input
                                    type={format === '24' ? 'time' : 'text'}
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder={placeholder}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  />
                                );
                              } else if (dataType === 'rating') {
                                const maxStars = column.ratingConfig?.maxStars || 5;
                                const allowHalf = true; // Always allow half stars
                                const icon = column.ratingConfig?.icon || 'star';
                                const color = column.ratingConfig?.color || '#faad14';
                                
                                const iconMap = {
                                  star: { filled: <StarFilled />, outline: <StarOutlined /> },
                                  heart: { filled: <HeartFilled />, outline: <HeartOutlined /> },
                                  like: { filled: <LikeFilled />, outline: <LikeOutlined /> },
                                  fire: { filled: <FireFilled />, outline: <FireOutlined /> },
                                  trophy: { filled: <TrophyFilled />, outline: <TrophyOutlined /> }
                                };
                                
                                const icons = iconMap[icon] || iconMap.star;
                                
                                const handleStarClick = (starValue) => {
                                  setCellValue(starValue.toString());
                                };
                                
                                const handleHalfStarClick = (starValue) => {
                                  if (allowHalf) {
                                    setCellValue((starValue - 0.5).toString());
                                  }
                                };
                                
                                return (
                                  <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    padding: '4px',
                                    backgroundColor: 'white',
                                    border: '1px solid #1890ff',
                                    borderRadius: '4px'
                                  }}>
                                    {Array.from({ length: maxStars }, (_, index) => {
                                      const starValue = index + 1;
                                      const currentValue = Number(cellValue) || 0;
                                      const isFullStar = currentValue >= starValue;
                                      const isHalfStar = allowHalf && currentValue > index && currentValue < starValue;
                                      
                                      return (
                                        <div key={index} style={{ position: 'relative', display: 'flex' }}>
                                          {/* Half star click area */}
                                          {allowHalf && (
                                            <div
                                              style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                width: '50%',
                                                height: '100%',
                                                cursor: 'pointer',
                                                zIndex: 2
                                              }}
                                              onClick={() => handleHalfStarClick(starValue)}
                                            />
                                          )}
                                          
                                          {/* Full star click area */}
                                          <div
                                            style={{
                                              position: 'absolute',
                                              right: 0,
                                              top: 0,
                                              width: '50%',
                                              height: '100%',
                                              cursor: 'pointer',
                                              zIndex: 2
                                            }}
                                            onClick={() => handleStarClick(starValue)}
                                          />
                                          
                                          {/* Star display */}
                                          <span
                                            style={{
                                              color: isFullStar ? color : '#d9d9d9',
                                              fontSize: '16px',
                                              position: 'relative'
                                            }}
                                          >
                                            {isFullStar ? icons.filled : icons.outline}
                                            {isHalfStar && (
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
                                                {icons.filled}
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      );
                                    })}
                                    
                                    {/* Number input for precise value */}
                                    <Input
                                      type="number"
                                      value={cellValue}
                                      onChange={(e) => setCellValue(e.target.value)}
                                      onPressEnter={handleCellSave}
                                      onBlur={handleCellSave}
                                      size="small"
                                      placeholder={allowHalf ? `0-${maxStars}` : `0-${maxStars}`}
                                      min={0}
                                      max={maxStars}
                                      step={allowHalf ? 0.5 : 1}
                                      style={{
                                        width: '60px',
                                        marginLeft: '8px',
                                        fontSize: '12px'
                                      }}
                                    />
                                  </div>
                                );
                              } else if (dataType === 'checkbox') {
                                return (
                                  <Select
                                    value={cellValue}
                                    onChange={(value) => {
                                      setCellValue(value);
                                      handleCellSave();
                                    }}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  >
                                    <Option value="true">True</Option>
                                    <Option value="false">False</Option>
                                  </Select>
                                );
                              } else if (dataType === 'single_select') {
                                const options = column.singleSelectConfig?.options || [];
                                return (
                                  <Select
                                    value={cellValue}
                                    onChange={(value) => {
                                      setCellValue(value || '');
                                      handleCellSave();
                                    }}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                    placeholder="Select option"
                                    allowClear
                                    dropdownRender={(menu) => (
                                      <div>
                                        {menu}
                                        <div style={{ 
                                          padding: '4px 6px', 
                                          borderTop: '1px solid #e8e8e8',
                                          backgroundColor: '#f8f9fa'
                                        }}>
                                          <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            padding: '6px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e1e5e9',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                            width: '100%',
                                            height: '28px'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f0f7ff';
                                            e.target.style.borderColor = '#1890ff';
                                            e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.15)';
                                            e.target.style.transform = 'translateY(-1px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#ffffff';
                                            e.target.style.borderColor = '#e1e5e9';
                                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                            e.target.style.transform = 'translateY(0)';
                                          }}
                                          onClick={() => {
                                            const newOption = prompt('Enter new option:');
                                            if (newOption && newOption.trim()) {
                                              handleAddNewOption(column, newOption);
                                            }
                                          }}
                                          >
                                            <PlusOutlined style={{ 
                                              color: '#1890ff', 
                                              fontSize: '14px',
                                              fontWeight: 'bold'
                                            }} />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  >
                                    {options.map((option, index) => (
                                      <Option key={index} value={option}>
                                        {option}
                                      </Option>
                                    ))}
                                  </Select>
                                );
                              } else {
                                return (
                                  <Input
                                    value={cellValue}
                                    onChange={(e) => setCellValue(e.target.value)}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  />
                                );
                              }
                            })()
                          ) : (
                            <div
                              style={{
                                cursor: column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? 'default' : 'pointer',
                                padding: '8px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '12px',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                                backgroundColor: column.isSystem ? '#fafafa' : 'transparent',
                                color: column.isSystem ? '#666' : '#333',
                                fontStyle: column.isSystem ? 'italic' : 'normal'
                              }}
                              onClick={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? undefined : () => handleCellClick(record._id, column.name, value)}
                              onMouseEnter={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              {column.dataType === 'datetime' && value ? 
                                value // Already formatted by formatDateTime
                                : column.dataType === 'date' && value ? 
                                (() => {
                                  try {
                                    const date = new Date(value);
                                    return formatDateForDisplay(value, column.dateConfig?.format || 'DD/MM/YYYY');
                                  } catch {
                                    return value;
                                  }
                                })() 
                                : column.dataType === "year" ? 
                                (value || <span style={{color: "#bfbfbf", fontStyle: "italic"}}>Select year</span>)
                                : column.dataType === 'checkbox' ?
                                    (() => {
                                      const isChecked = value === 'true' || value === true;
                                      const config = column.checkboxConfig || { icon: 'check-circle', color: '#52c41a', defaultValue: false };

                                      return (
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          height: '100%',
                                          width: '100%'
                                        }}>
                                          <div
                                            onClick={() => {
                                              const newValue = !isChecked;
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = newValue;

                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            style={{
                                              cursor: 'pointer',
                                              fontSize: '16px',
                                              color: isChecked ? config.color : '#666',
                                              transition: 'all 0.2s ease'
                                            }}
                                          >
                                            {isChecked ? (
                                              config.icon === 'check-circle' ?
                                                <CheckCircleOutlined style={{ color: config.color, fontSize: '16px' }} /> :
                                                <CheckSquareOutlined style={{ color: config.color, fontSize: '16px' }} />
                                            ) : (
                                              config.icon === 'check-circle' ?
                                                <BorderOutlined style={{ color: '#666', fontSize: '16px' }} /> :
                                                <BorderOutlined style={{ color: '#666', fontSize: '16px' }} />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()
                                    : column.dataType === 'single_select' ?
                                      (() => {
                                        const options = column.singleSelectConfig?.options || [];
                                        const selectedValue = value;
                                        
                                        return (
                                          <SingleSelectPill
                                            value={selectedValue}
                                            options={options}
                                            onChange={(newValue) => {
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = newValue || '';

                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            onAddNewOption={(newOption) => handleAddNewOption(column, newOption)}
                                            isActive={isCellSelected(record._id, column.name)}
                                          />
                                        );
                                      })()
                                    : column.dataType === 'currency' && value !== null && value !== undefined ?
                                      (() => {
                                        const config = column.currencyConfig || {
                                          currency: 'USD',
                                          symbol: '$',
                                          position: 'before',
                                          decimalPlaces: 2,
                                          thousandsSeparator: ',',
                                          decimalSeparator: '.'
                                        };

                                        const numValue = parseFloat(value);
                                        if (isNaN(numValue)) return value;

                                        const formatted = numValue.toLocaleString('en-US', {
                                          minimumFractionDigits: config.decimalPlaces,
                                          maximumFractionDigits: config.decimalPlaces
                                        }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);

                                        return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
                                      })()
                                      : column.dataType === 'percent' && column.percentConfig?.displayAsProgress ? (
                                        <ProgressBar 
                                          value={Number(value) || 0} 
                                          max={100}
                                          color="#1890ff"
                                          height="6px"
                                        />
                                      ) : formatCellValueForDisplay ? formatCellValueForDisplay(value, column) : (value || '')
                              }
                            </div>
                          )}

                          {/* Autofill handle for selected cell */}
                          {isSelected && !isEditing && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#ff4d4f',
                                border: '1px solid #fff',
                                borderRadius: '1px',
                                cursor: 'crosshair',
                                zIndex: 10
                              }}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Empty cell for alignment */}
                    <div style={{
                      width: '50px',
                      minWidth: '50px',
                      padding: '8px'
                    }} />
                  </div>
                ))}

                {/* Add New Record to Group */}
                {isExpanded && (
                  <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #d9d9d9',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                    onClick={() => handleAddRowToGroup(group.values, group.rules)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                  >
                    {/* Checkbox and Index Column */}
                    <div style={{
                      width: '60px',
                      minWidth: '60px',
                      padding: '8px',
                      borderRight: '1px solid #d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PlusOutlined
                        style={{
                          color: '#52c41a',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>

                    {/* Data Columns */}
                    {visibleColumns.map(column => (
                      <div key={column._id} style={{
                        width: getColumnWidthString(columnWidths, column._id),
                        minWidth: '50px',
                        padding: '8px',
                        borderRight: '1px solid #d9d9d9'
                      }} />
                    ))}

                    {/* Empty cell for alignment */}
                    <div style={{
                      width: '50px',
                      minWidth: '50px',
                      padding: '8px'
                    }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped Records */}
          {groupedData.ungroupedRecords.map((record, index) => (
            <div key={record._id} style={{
              display: 'flex',
              borderBottom: '1px solid #f0f0f0'
            }}
              onContextMenu={(e) => handleContextMenu(e, record._id)}
            >
              {/* Checkbox and Index */}
              <div style={{
                width: '60px',
                minWidth: '60px',
                padding: '8px',
                borderRight: '1px solid #d9d9d9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <Checkbox
                  checked={selectedRowKeys.includes(record._id)}
                  onChange={(e) => handleSelectRow(record._id, e.target.checked)}
                />
                <span style={{
                  fontSize: '12px',
                  color: '#666',
                  fontWeight: 'bold',
                  opacity: selectedRowKeys.includes(record._id) ? 0.3 : 1
                }}>
                  {index + 1}
                </span>
              </div>

              {/* Data Cells */}
              {visibleColumns.map(column => {
                let value = '';
                if (column.isSystem) {
                  // Handle system fields
                  switch (column.name) {
                    case 'Id':
                      value = record._id || '';
                      break;
                    case 'CreatedAt':
                      value = record.createdAt ? formatDateTime(record.createdAt) : '';
                      break;
                    case 'UpdatedAt':
                      value = record.updatedAt ? formatDateTime(record.updatedAt) : '';
                      break;
                    default:
                      value = '';
                  }
                } else {
                  // For percent columns, use default value if no value provided
                  if (column.dataType === 'percent') {
                    const cellValue = record.data?.[column.name];
                    value = (cellValue !== null && cellValue !== undefined && cellValue !== '') 
                      ? cellValue 
                      : (column.percentConfig?.defaultValue || 0);
                  } else if (column.dataType === 'single_select') {
                    // For single select columns, use default value if cell is null/undefined (new records)
                    // But if cell is empty string (cleared by user), show empty
                    const cellValue = record.data?.[column.name];
                    if (cellValue === null || cellValue === undefined) {
                      // New record - use default value
                      value = column.singleSelectConfig?.defaultValue || '';
                    } else {
                      // Existing record - use actual value (including empty string if cleared)
                      value = cellValue;
                    }
                  } else {
                    value = record.data?.[column.name] || '';
                  }
                }
                const isEditing = editingCell?.recordId === record._id && editingCell?.columnName === column.name;
                const isSelected = isCellSelected(record._id, column.name);

                return (
                  <div key={column._id} style={{
                    width: getColumnWidthString(columnWidths, column._id),
                    minWidth: '50px',
                    padding: '0',
                    borderRight: '1px solid #d9d9d9',
                    position: 'relative',
                    minHeight: '40px',
                    boxShadow: isSelected ? 'inset 0 0 0 2px #1890ff' : 'none'
                  }}>
                    {isEditing ? (
                      (() => {
                        const dataType = column.dataType;

                        if (dataType === 'date') {
                          return (
                            <Input
                              type="date"
                              value={formatDateForInput(cellValue)}
                              onChange={(e) => setCellValue(e.target.value)}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            />
                          );
                        } else if (dataType === 'number' || dataType === 'currency') {
                          return (
                            <Input
                              type="number"
                              step={dataType === 'currency' ? "0.01" : undefined}
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            />
                          );
                        } else if (dataType === 'phone') {
                          return (
                            <Input
                              type="tel"
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder="Enter phone number"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            />
                          );
                        } else if (dataType === 'time') {
                          const format = column.timeConfig?.format || '24';
                          const placeholder = format === '24' ? 'Enter time (HH:MM)' : 'Enter time (H:MM AM/PM)';
                          
                          return (
                            <Input
                              type={format === '24' ? 'time' : 'text'}
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder={placeholder}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            />
                          );
                        } else if (dataType === 'year') {
                          return (
                            <DatePicker
                              picker="year"
                              value={cellValue ? dayjs().year(cellValue) : null}
                              onChange={(date) => {
                                const year = date ? date.year() : '';
                                setCellValue(year);
                              }}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder="Select year"
                              style={{ 
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                              inputStyle={{
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                height: '100%'
                              }}
                            />
                          );
                        } else if (dataType === 'checkbox') {
                          return (
                            <Select
                              value={cellValue}
                              onChange={(value) => {
                                setCellValue(value);
                                handleCellSave();
                              }}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            >
                              <Option value="true">True</Option>
                              <Option value="false">False</Option>
                            </Select>
                          );
                        } else if (dataType === 'single_select') {
                          const options = column.singleSelectConfig?.options || [];
                          return (
                            <Select
                              value={cellValue}
                              onChange={(value) => {
                                setCellValue(value || '');
                                handleCellSave();
                              }}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                              placeholder="Select option"
                              allowClear
                              dropdownRender={(menu) => (
                                <div>
                                  {menu}
                                  <div style={{ 
                                    padding: '4px 6px', 
                                    borderTop: '1px solid #e8e8e8',
                                    backgroundColor: '#f8f9fa'
                                  }}>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      padding: '6px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #e1e5e9',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                      width: '100%',
                                      height: '28px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#f0f7ff';
                                      e.target.style.borderColor = '#1890ff';
                                      e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.15)';
                                      e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = '#ffffff';
                                      e.target.style.borderColor = '#e1e5e9';
                                      e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                      e.target.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => {
                                      const newOption = prompt('Enter new option:');
                                      if (newOption && newOption.trim()) {
                                        handleAddNewOption(column, newOption);
                                      }
                                    }}
                                    >
                                      <PlusOutlined style={{ 
                                        color: '#1890ff', 
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                      }} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            >
                              {options.map((option, index) => (
                                <Option key={index} value={option}>
                                  {option}
                                </Option>
                              ))}
                            </Select>
                          );
                        } else {
                          return (
                            <Input
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            />
                          );
                        }
                      })()
                    ) : (
                      <div
                        style={{
                          cursor: column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? 'default' : 'pointer',
                          padding: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12px',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          backgroundColor: column.isSystem ? '#fafafa' : 'transparent',
                          color: column.isSystem ? '#666' : '#333',
                          fontStyle: column.isSystem ? 'italic' : 'normal'
                        }}
                        onClick={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? undefined : () => handleCellClick(record._id, column.name, value)}
                        onMouseEnter={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        {column.dataType === 'datetime' && value ? 
                          value // Already formatted by formatDateTime
                          : column.dataType === 'date' && value ? 
                          (() => {
                            try {
                              const date = new Date(value);
                              return formatDateForDisplay(value, column.dateConfig?.format || 'DD/MM/YYYY');
                            } catch {
                              return value;
                            }
                          })() 
                          : column.dataType === "year" ? 
                          (value || <span style={{color: "#bfbfbf", fontStyle: "italic"}}>Select year</span>)
                          : column.dataType === 'url' && value ?
                              (() => {
                                let displayUrl = value;


                                // Debug log
                                console.log('TableBody URL Debug:', {
                                  columnName: column.name,
                                  value,
                                  urlConfig: column.urlConfig,
                                  hasUrlConfig: !!column.urlConfig,
                                  protocol: column.urlConfig?.protocol
                                });

                                // Auto-add protocol
                                if (!value.startsWith('http://') && !value.startsWith('https://')) {
                                  if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
                                    // Use the configured protocol
                                    const protocol = column.urlConfig.protocol;
                                    displayUrl = `${protocol}://${value}`;
                                    console.log('Using configured protocol:', protocol, '→', displayUrl);
                                  } else if (column.urlConfig && column.urlConfig.protocol === 'none') {
                                    // Don't add protocol, keep original value
                                    displayUrl = value;
                                    console.log('Protocol is none, keeping original value:', displayUrl);
                                  } else if (!column.urlConfig) {
                                    // Fallback for old columns without urlConfig
                                    displayUrl = `https://${value}`;
                                    console.log('Using fallback protocol: https →', displayUrl);
                                  }
                                }

                                return displayUrl;
                              })()
                              : column.dataType === 'email' && value ?
                                value
                                : column.dataType === 'phone' && value ?
                                  value
                                  : column.dataType === 'time' && value ?
                                    value
                                    : column.dataType === 'rating' ?
                                      (() => {
                                        const ratingValue = value && value !== '' ? Number(value) : 0;
                                        const maxStars = column.ratingConfig?.maxStars || 5;
                                        const icon = column.ratingConfig?.icon || 'star';
                                        const color = column.ratingConfig?.color || '#faad14';
                                        const allowHalf = true; // Always allow half stars
                                        
                                        console.log('TableBody: Displaying rating', {
                                          columnName: column.name,
                                          ratingValue,
                                          maxStars,
                                          icon,
                                          color,
                                          ratingConfig: column.ratingConfig
                                        });
                                        
                                        const iconMap = {
                                          star: { filled: <StarFilled />, outline: <StarOutlined /> },
                                          heart: { filled: <HeartFilled />, outline: <HeartOutlined /> },
                                          like: { filled: <LikeFilled />, outline: <LikeOutlined /> },
                                          fire: { filled: <FireFilled />, outline: <FireOutlined /> },
                                          trophy: { filled: <TrophyFilled />, outline: <TrophyOutlined /> }
                                        };
                                        
                                        const icons = iconMap[icon] || iconMap.star;
                                        
                                        const renderStar = (index) => {
                                          const starValue = index + 1;
                                          const isHalfStar = allowHalf && ratingValue > index && ratingValue < starValue;
                                          const isFullStar = ratingValue >= starValue;
                                          
                                          if (isHalfStar) {
                                            return (
                                              <span
                                                key={index}
                                                style={{
                                                  position: 'relative',
                                                  fontSize: '14px',
                                                  color: '#d9d9d9'
                                                }}
                                              >
                                                {icons.outline}
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
                                                  {icons.filled}
                                                </span>
                                              </span>
                                            );
                                          }
                                          
                                          return (
                                            <span
                                              key={index}
                                              style={{
                                                color: isFullStar ? color : '#d9d9d9',
                                                fontSize: '14px'
                                              }}
                                            >
                                              {isFullStar ? icons.filled : icons.outline}
                                            </span>
                                          );
                                        };
                                        
                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
                                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                              {ratingValue}/{maxStars}
                                            </span>
                                          </div>
                                        );
                                      })()
                                    : column.dataType === 'checkbox' ?
                                  (() => {
                                    const isChecked = value === 'true' || value === true;
                                    const config = column.checkboxConfig || { icon: 'check-circle', color: '#52c41a', defaultValue: false };

                                    return (
                                      <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%',
                                        width: '100%'
                                      }}>
                                        <div
                                          onClick={() => {
                                            const newValue = !isChecked;
                                            const updatedData = { ...record.data };
                                            updatedData[column.name] = newValue;

                                            updateRecordMutation.mutate({
                                              recordId: record._id,
                                              data: updatedData
                                            });
                                          }}
                                          style={{
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: isChecked ? config.color : '#666',
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          {isChecked ? (
                                            config.icon === 'check-circle' ?
                                              <CheckCircleOutlined style={{ color: config.color, fontSize: '16px' }} /> :
                                              <CheckSquareOutlined style={{ color: config.color, fontSize: '16px' }} />
                                          ) : (
                                            config.icon === 'check-circle' ?
                                              <BorderOutlined style={{ color: '#666', fontSize: '16px' }} /> :
                                              <BorderOutlined style={{ color: '#666', fontSize: '16px' }} />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                  : column.dataType === 'single_select' ?
                                    (() => {
                                      const options = column.singleSelectConfig?.options || [];
                                      const selectedValue = value;
                                      
                                      return (
                                        <SingleSelectPill
                                          value={selectedValue}
                                          options={options}
                                          onChange={(newValue) => {
                                            const updatedData = { ...record.data };
                                            updatedData[column.name] = newValue || '';

                                            updateRecordMutation.mutate({
                                              recordId: record._id,
                                              data: updatedData
                                            });
                                          }}
                                          onAddNewOption={(newOption) => handleAddNewOption(column, newOption)}
                                          isActive={isCellSelected(record._id, column.name)}
                                        />
                                      );
                                    })()
                                  : column.dataType === 'currency' && value !== null && value !== undefined ?
                                    (() => {
                                      const config = column.currencyConfig || {
                                        currency: 'USD',
                                        symbol: '$',
                                        position: 'before',
                                        decimalPlaces: 2,
                                        thousandsSeparator: ',',
                                        decimalSeparator: '.'
                                      };

                                      const numValue = parseFloat(value);
                                      if (isNaN(numValue)) return value;

                                      const formatted = numValue.toLocaleString('en-US', {
                                        minimumFractionDigits: config.decimalPlaces,
                                        maximumFractionDigits: config.decimalPlaces
                                      }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);

                                      return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
                                    })()
                                    : column.dataType === 'percent' && column.percentConfig?.displayAsProgress ? (
                                      <ProgressBar 
                                        value={Number(value) || 0} 
                                        max={100}
                                        color="#1890ff"
                                        height="6px"
                                      />
                                    ) : formatCellValueForDisplay ? formatCellValueForDisplay(value, column) : (value || '')
                        }
                      </div>
                    )}

                    {/* Autofill handle for selected cell */}
                    {isSelected && !isEditing && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#ff4d4f',
                          border: '1px solid #fff',
                          borderRadius: '1px',
                          cursor: 'crosshair',
                          zIndex: 10
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {/* Empty cell for alignment */}
              <div style={{
                width: '50px',
                minWidth: '50px',
                padding: '8px'
              }} />
            </div>
          ))}

          {/* Add Row Footer */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #d9d9d9',
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
            onClick={handleAddRow}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
          >
            {/* Checkbox and Index Column */}
            <div style={{
              width: '60px',
              minWidth: '60px',
              padding: '8px',
              borderRight: '1px solid #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusOutlined
                style={{
                  color: '#1890ff',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            {/* Data Columns */}
            {visibleColumns.map(column => (
              <div key={column._id} style={{
                width: getColumnWidthString(columnWidths, column._id),
                minWidth: '50px',
                padding: '8px',
                borderRight: '1px solid #d9d9d9'
              }} />
            ))}

            {/* Empty cell for alignment */}
            <div style={{
              width: '50px',
              minWidth: '50px',
              padding: '8px'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableBody;
