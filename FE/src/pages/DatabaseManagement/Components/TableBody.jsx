import React from 'react';
import { Button, Input, Select, Checkbox, Tooltip, Tag, Dropdown, DatePicker } from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  DownOutlined,
  RightOutlined
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
                                cursor: column.isSystem || column.dataType === 'checkbox' ? 'default' : 'pointer',
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
                              onClick={column.isSystem || column.dataType === 'checkbox' ? undefined : () => handleCellClick(record._id, column.name, value)}
                              onMouseEnter={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
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
                          cursor: column.isSystem || column.dataType === 'checkbox' ? 'default' : 'pointer',
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
                        onClick={column.isSystem || column.dataType === 'checkbox' ? undefined : () => handleCellClick(record._id, column.name, value)}
                        onMouseEnter={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={column.isSystem || column.dataType === 'checkbox' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
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
