import React from 'react';
import {
  Modal,
  Input,
  Select,
  Space,
  Typography,
  Button,
  Row,
  Radio
} from 'antd';
import {
  FontSizeOutlined,
  NumberOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  DownOutlined,
  FunctionOutlined,
  DollarOutlined,
  MailOutlined,
  LinkOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  BorderOutlined,
  PlusOutlined,
  PercentageOutlined,
  PhoneOutlined,
  FieldTimeOutlined,
  StarOutlined,
  SearchOutlined
} from '@ant-design/icons';
import SingleSelectConfig from '../Config/SingleSelectConfig';
import MultiSelectConfig from '../Config/MultiSelectConfig';
import DateConfig from '../Config/DateConfig';
import FormulaConfig from '../Config/FormulaConfig';
import CurrencyConfig from '../Config/CurrencyConfig';
import PercentConfig from '../Config/PercentConfig';
import UrlConfig from '../Config/UrlConfig';
import TimeConfig from '../Config/TimeConfig';
import RatingConfig from '../Config/RatingConfig';
import LinkedTableConfig from '../Config/LinkedTableConfig';
import LookupConfig from '../Config/LookupConfig';

const { Text } = Typography;
const { Option } = Select;

const EditColumnModal = ({
  visible,
  onCancel,
  onSubmit,
  editingColumn,
  setEditingColumn,
  columns,
  loading,
  currentTableId = null,
  currentDatabaseId = null
}) => {
  if (!editingColumn) return null;

  // Debug log to check column data
  console.log('🔍 EditColumnModal received editingColumn:', editingColumn);
  console.log('🔍 Lookup config:', editingColumn.lookupConfig);

  return (
    <Modal
      title="Chỉnh sửa cột"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <form onSubmit={onSubmit}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Tên trường</Text>
            <Input
              value={editingColumn.name}
              onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
              placeholder="Tên trường (Tùy chọn)"
            />
          </div>
          <div>
            <Text strong>Loại trường</Text>
            <Select
              value={editingColumn.dataType}
              onChange={(value) => {
                // Auto-generate column name based on data type if name is empty or default
                const getDefaultColumnName = (dataType) => {
                  switch (dataType) {
                    case 'text': return 'Text';
                    case 'number': return 'Number';
                    case 'date': return 'Date';
                    case 'email': return 'Email';
                    case 'url': return 'URL';
                    case 'phone': return 'Phone';
                    case 'checkbox': return 'Checkbox';
                    case 'single_select': return 'Single Select';
                    case 'multi_select': return 'Multi Select';
                    case 'currency': return 'Currency';
                    case 'percent': return 'Percent';
                    case 'rating': return 'Rating';
                    case 'time': return 'Time';
                    case 'formula': return 'Formula';
                    case 'linked_table': return 'Linked Table';
                    case 'lookup': return 'Lookup';
                    case 'json': return 'JSON';
                    default: return 'New Column';
                  }
                };

                const shouldUpdateName = !editingColumn.name || editingColumn.name === 'New Column' || editingColumn.name === '';
                let newName = shouldUpdateName ? getDefaultColumnName(value) : editingColumn.name;
                
                // Check if column name already exists and add number suffix
                if (shouldUpdateName) {
                  let counter = 1;
                  let originalName = newName;
                  while (columns.some(col => col.name === newName && col._id !== editingColumn._id)) {
                    newName = `${originalName} ${counter}`;
                    counter++;
                  }
                }

                setEditingColumn({ 
                  ...editingColumn, 
                  dataType: value,
                  name: newName
                });
              }}
              style={{ width: '100%' }}
            >
              <Option value="text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontSizeOutlined style={{ color: '#1890ff' }} />
                  <span>Text</span>
                </div>
              </Option>
              <Option value="number">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <NumberOutlined style={{ color: '#52c41a' }} />
                  <span>Number</span>
                </div>
              </Option>
              <Option value="date">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarOutlined style={{ color: '#fa8c16' }} />
                  <span>Date</span>
                </div>
              </Option>
              <Option value="year">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  <span>Year</span>
                </div>
              </Option>

              <Option value="checkbox">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquareOutlined style={{ color: '#52c41a' }} />
                  <span>Checkbox</span>
                </div>
              </Option>
              <Option value="single_select">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DownOutlined style={{ color: '#1890ff' }} />
                  <span>Single select</span>
                </div>
              </Option>
              <Option value="multi_select">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquareOutlined style={{ color: '#722ed1' }} />
                  <span>Multi select</span>
                </div>
              </Option>
              
              <Option value="formula">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FunctionOutlined style={{ color: '#722ed1' }} />
                  <span>Formula</span>
                </div>
              </Option>
              <Option value="currency">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarOutlined style={{ color: '#52c41a' }} />
                  <span>Tiền tệ</span>
                </div>
              </Option>
              <Option value="percent">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PercentageOutlined style={{ color: '#fa541c' }} />
                  <span>Phần trăm</span>
                </div>
              </Option>
              <Option value="phone">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneOutlined style={{ color: '#13c2c2' }} />
                  <span>Số điện thoại</span>
                </div>
              </Option>
              <Option value="time">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FieldTimeOutlined style={{ color: '#fa8c16' }} />
                  <span>Thời gian</span>
                </div>
              </Option>
              <Option value="rating">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <span>Đánh giá</span>
                </div>
              </Option>
              
              <Option value="email">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MailOutlined style={{ color: '#1890ff' }} />
                  <span>Email</span>
                </div>
              </Option>
              
              <Option value="url">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LinkOutlined style={{ color: '#1890ff' }} />
                  <span>URL</span>
                </div>
              </Option>
              
              <Option value="linked_table">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LinkOutlined style={{ color: '#722ed1' }} />
                  <span>Linked Table</span>
                </div>
              </Option>
              
              <Option value="lookup">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SearchOutlined style={{ color: '#13c2c2' }} />
                  <span>Lookup</span>
                </div>
              </Option>
              
              <Option value="json">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CodeOutlined style={{ color: '#722ed1' }} />
                  <span>JSON</span>
                </div>
              </Option>
            </Select>
          </div>

          {/* Checkbox Configuration */}
          {editingColumn.dataType === 'checkbox' && (
            <div style={{ 
              backgroundColor: '#fafafa', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #f0f0f0'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Icon</Text>
                  <Select
                    value={editingColumn.checkboxConfig.icon}
                    onChange={(value) => setEditingColumn({
                      ...editingColumn,
                      checkboxConfig: { ...editingColumn.checkboxConfig, icon: value }
                    })}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    <Option value="check-circle">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>Check Circle</span>
                      </div>
                    </Option>
                    <Option value="border">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BorderOutlined style={{ color: '#666' }} />
                        <span>Border</span>
                      </div>
                    </Option>
                  </Select>
                </div>

                <div>
                  <Text strong>Colour</Text>
                  <Select
                    value={editingColumn.checkboxConfig.color}
                    onChange={(value) => setEditingColumn({
                      ...editingColumn,
                      checkboxConfig: { ...editingColumn.checkboxConfig, color: value }
                    })}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    <Option value="#52c41a">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: '#52c41a', 
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px #d9d9d9'
                        }} />
                        <span>Green</span>
                      </div>
                    </Option>
                    <Option value="#1890ff">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: '#1890ff', 
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px #d9d9d9'
                        }} />
                        <span>Blue</span>
                      </div>
                    </Option>
                    <Option value="#fa8c16">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: '#fa8c16', 
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px #d9d9d9'
                        }} />
                        <span>Orange</span>
                      </div>
                    </Option>
                    <Option value="#f5222d">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: '#f5222d', 
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px #d9d9d9'
                        }} />
                        <span>Red</span>
                      </div>
                    </Option>
                    <Option value="#722ed1">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          backgroundColor: '#722ed1', 
                          borderRadius: '50%',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 1px #d9d9d9'
                        }} />
                        <span>Purple</span>
                      </div>
                    </Option>
                  </Select>
                </div>

                <div>
                  <Text strong>Giá trị mặc định</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Radio.Group
                      value={editingColumn.checkboxConfig.defaultValue}
                      onChange={(e) => setEditingColumn({
                        ...editingColumn,
                        checkboxConfig: { ...editingColumn.checkboxConfig, defaultValue: e.target.value }
                      })}
                    >
                      <Radio value={false}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BorderOutlined style={{ color: '#666' }} />
                          <span>Unchecked</span>
                        </div>
                      </Radio>
                      <Radio value={true}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircleOutlined style={{ color: editingColumn.checkboxConfig.color }} />
                          <span>Checked</span>
                        </div>
                      </Radio>
                    </Radio.Group>
                  </div>
                </div>
              </Space>
            </div>
          )}

          {/* Single Select Configuration */}
          {editingColumn.dataType === 'single_select' && (
            <SingleSelectConfig
              config={editingColumn.singleSelectConfig}
              onChange={(config) => setEditingColumn({
                ...editingColumn,
                singleSelectConfig: config
              })}
            />
          )}

          {/* Multi Select Configuration */}
          {editingColumn.dataType === 'multi_select' && (
            <MultiSelectConfig
              config={editingColumn.multiSelectConfig}
              onChange={(config) => setEditingColumn({
                ...editingColumn,
                multiSelectConfig: config
              })}
            />
          )}

          {/* Date Configuration */}
          {editingColumn.dataType === 'date' && (
            <DateConfig
              config={editingColumn.dateConfig}
              onChange={(config) => setEditingColumn({
                ...editingColumn,
                dateConfig: config
              })}
            />
          )}

          {/* Currency Configuration */}
          {editingColumn.dataType === 'currency' && (
            <CurrencyConfig
              config={{
                ...(editingColumn.currencyConfig || {}),
                defaultValue: editingColumn.defaultValue !== undefined ? editingColumn.defaultValue : 0
              }}
              onChange={(config) => {
                console.log('Edit CurrencyConfig onChange:', config);
                const { defaultValue, ...currencyConfig } = config;
                setEditingColumn({
                  ...editingColumn,
                  currencyConfig: currencyConfig,
                  defaultValue: defaultValue !== undefined ? defaultValue : 0
                });
              }}
            />
          )}

          {/* Percent Configuration */}
          {editingColumn.dataType === 'percent' && (
            <PercentConfig
              percentConfig={editingColumn.percentConfig}
              onPercentConfigChange={(percentConfig) => setEditingColumn({ ...editingColumn, percentConfig })}
            />
          )}

          {/* URL Configuration */}
          {editingColumn.dataType === 'url' && (
            <UrlConfig
              config={editingColumn.urlConfig || {
                protocol: 'https'
              }}
              onChange={(config) => setEditingColumn({
                ...editingColumn,
                urlConfig: config
              })}
            />
          )}

          {/* Time Configuration */}
          {editingColumn.dataType === 'time' && (
            <TimeConfig
              timeConfig={editingColumn.timeConfig || { format: '24' }}
              setTimeConfig={(timeConfig) => setEditingColumn({ ...editingColumn, timeConfig })}
            />
          )}

          {/* Rating Configuration */}
          {editingColumn.dataType === 'rating' && (
            <RatingConfig
              ratingConfig={editingColumn.ratingConfig || { maxStars: 5, icon: 'star', color: '#faad14', defaultValue: 0 }}
              setRatingConfig={(ratingConfig) => setEditingColumn({ ...editingColumn, ratingConfig })}
            />
          )}

          {/* Linked Table Configuration */}
          {editingColumn.dataType === 'linked_table' && (
            <LinkedTableConfig
              config={editingColumn.linkedTableConfig}
              onChange={(config) => setEditingColumn({
                ...editingColumn,
                linkedTableConfig: config
              })}
              currentTableId={currentTableId}
              currentDatabaseId={currentDatabaseId}
            />
          )}

          {/* Lookup Configuration */}
          {editingColumn.dataType === 'lookup' && (
            <LookupConfig
              config={editingColumn.lookupConfig}
              onChange={(config) => setEditingColumn({
                ...editingColumn,
                lookupConfig: config
              })}
              currentTableId={currentTableId}
              currentDatabaseId={currentDatabaseId}
            />
          )}

          {/* Formula Configuration */}
          {editingColumn.dataType === 'formula' && (
            <FormulaConfig
              formulaConfig={editingColumn.formulaConfig}
              onFormulaConfigChange={(formulaConfig) => setEditingColumn({ ...editingColumn, formulaConfig })}
              availableColumns={columns}
              onValidationChange={(isValid, errors) => {
                // Handle validation state if needed
              }}
            />
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button type="link" size="small" style={{ padding: 0 }}>
              + Thêm mô tả
            </Button>
            <Button type="link" size="small" style={{ padding: 0 }}>
              Hiển thị thêm <PlusOutlined />
            </Button>
          </div>

          <Row justify="end">
            <Space>
              <Button onClick={onCancel}>
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                Lưu trường
              </Button>
            </Space>
          </Row>
        </Space>
      </form>
    </Modal>
  );
};

export default EditColumnModal;
