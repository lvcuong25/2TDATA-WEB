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
  FieldBinaryOutlined,
  NumberOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  DownOutlined,
  FunctionOutlined,
  DollarOutlined,
  MailOutlined,
  LinkOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  BorderOutlined,
  PlusOutlined
} from '@ant-design/icons';
import SingleSelectConfig from '../Config/SingleSelectConfig';
import MultiSelectConfig from '../Config/MultiSelectConfig';
import DateConfig from '../Config/DateConfig';
import FormulaConfig from '../Config/FormulaConfig';
import CurrencyConfig from '../Config/CurrencyConfig';
import UrlConfig from '../Config/UrlConfig';

const { Text } = Typography;
const { Option } = Select;

const AddColumnModal = ({
  visible,
  onCancel,
  onSubmit,
  newColumn,
  setNewColumn,
  columns,
  loading
}) => {
  const handleDataTypeChange = (value) => {
    // Auto-generate column name based on data type if name is empty
    let autoName = '';
    if (!newColumn.name.trim()) {
      switch (value) {
        case 'text':
          autoName = 'Text';
          break;
        case 'number':
          autoName = 'Number';
          break;
        case 'date':
          autoName = 'Date';
          break;
        case 'checkbox':
          autoName = 'Checkbox';
          break;
        case 'single_select':
          autoName = 'Single Select';
          break;
        case 'multi_select':
          autoName = 'Multi Select';
          break;
        case 'formula':
          autoName = 'Formula';
          break;
        case 'currency':
          autoName = 'Currency';
          break;
        case 'email':
          autoName = 'Email';
          break;
        case 'url':
          autoName = 'URL';
          break;
        default:
          autoName = 'New Column';
      }
    }
    setNewColumn({ 
      ...newColumn, 
      dataType: value,
      name: newColumn.name.trim() || autoName,
      // Set default value for currency
      ...(value === 'currency' ? { defaultValue: 0 } : {})
    });
  };

  return (
    <Modal
      title="Thêm cột mới"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <form onSubmit={onSubmit}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Tên cột</Text>
            <Input
              value={newColumn.name}
              onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
              placeholder="Nhập tên cột (tự động tạo theo loại dữ liệu nếu để trống)"
            />
          </div>
          <div>
            <Text strong>Loại dữ liệu</Text>
            <Select
              value={newColumn.dataType}
              onChange={handleDataTypeChange}
              style={{ width: '100%' }}
            >
              <Option value="text">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FieldBinaryOutlined style={{ color: '#1890ff' }} />
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
              
              <Option value="json">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CodeOutlined style={{ color: '#722ed1' }} />
                  <span>JSON</span>
                </div>
              </Option>
            </Select>
          </div>

          {/* Checkbox Configuration */}
          {newColumn.dataType === 'checkbox' && (
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
                    value={newColumn.checkboxConfig.icon}
                    onChange={(value) => setNewColumn({
                      ...newColumn,
                      checkboxConfig: { ...newColumn.checkboxConfig, icon: value }
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
                    value={newColumn.checkboxConfig.color}
                    onChange={(value) => setNewColumn({
                      ...newColumn,
                      checkboxConfig: { ...newColumn.checkboxConfig, color: value }
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
                      value={newColumn.checkboxConfig.defaultValue}
                      onChange={(e) => setNewColumn({
                        ...newColumn,
                        checkboxConfig: { ...newColumn.checkboxConfig, defaultValue: e.target.value }
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
                          <CheckCircleOutlined style={{ color: newColumn.checkboxConfig.color }} />
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
          {newColumn.dataType === 'single_select' && (
            <SingleSelectConfig
              config={newColumn.singleSelectConfig}
              onChange={(config) => setNewColumn({
                ...newColumn,
                singleSelectConfig: config
              })}
            />
          )}

          {/* Multi Select Configuration */}
          {newColumn.dataType === 'multi_select' && (
            <MultiSelectConfig
              config={newColumn.multiSelectConfig}
              onChange={(config) => setNewColumn({
                ...newColumn,
                multiSelectConfig: config
              })}
            />
          )}

          {/* Date Configuration */}
          {newColumn.dataType === 'date' && (
            <DateConfig
              config={newColumn.dateConfig}
              onChange={(config) => setNewColumn({
                ...newColumn,
                dateConfig: config
              })}
            />
          )}

          {/* Currency Configuration */}
          {newColumn.dataType === 'currency' && (
            <CurrencyConfig
              config={{
                ...(newColumn.currencyConfig || {}),
                defaultValue: newColumn.defaultValue !== undefined ? newColumn.defaultValue : 0
              }}
              onChange={(config) => {
                console.log('CurrencyConfig onChange:', config);
                const { defaultValue, ...currencyConfig } = config;
                console.log('Setting defaultValue:', defaultValue);
                setNewColumn({
                  ...newColumn,
                  currencyConfig: currencyConfig,
                  defaultValue: defaultValue !== undefined ? defaultValue : 0
                });
              }}
            />
          )}

          {/* Formula Configuration */}
          {newColumn.dataType === 'formula' && (
            <FormulaConfig
              formulaConfig={newColumn.formulaConfig}
              onFormulaConfigChange={(formulaConfig) => setNewColumn({ ...newColumn, formulaConfig })}
              availableColumns={columns}
              onValidationChange={(isValid, errors) => {
                // Handle validation state if needed
              }}
            />
          )}

          {/* URL Configuration */}
          {newColumn.dataType === 'url' && (
            <UrlConfig
              config={newColumn.urlConfig}
              onChange={(config) => {
                console.log('AddColumnModal: UrlConfig onChange:', {
                  currentUrlConfig: newColumn.urlConfig,
                  newConfig: config
                });
                setNewColumn({
                  ...newColumn,
                  urlConfig: config
                });
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
              + Add description
            </Button>
            <Button type="link" size="small" style={{ padding: 0 }}>
              Show more <PlusOutlined />
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

export default AddColumnModal;
