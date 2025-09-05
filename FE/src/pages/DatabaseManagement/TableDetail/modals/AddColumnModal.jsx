import React from 'react';
import { Modal, Input, Select, Space, Typography, Button, Checkbox, Radio } from 'antd';
import SingleSelectConfig from '../../SingleSelectConfig';
import MultiSelectConfig from '../../MultiSelectConfig';
import DateConfig from '../../DateConfig';
import FormulaConfig from '../../FormulaConfig';
import CurrencyConfig from '../../CurrencyConfig';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const AddColumnModal = ({
  visible,
  onCancel,
  onSubmit,
  newColumn,
  setNewColumn,
  columns = []
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

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
        default:
          autoName = value;
      }
    }

    setNewColumn({
      ...newColumn,
      dataType: value,
      name: autoName || newColumn.name
    });
  };

  const checkboxIcons = [
    { value: 'check-circle', icon: <CheckCircleOutlined />, label: 'Check Circle' },
    { value: 'close-circle', icon: <CloseCircleOutlined />, label: 'Close Circle' },
    { value: 'check-square', icon: <CheckSquareOutlined />, label: 'Check Square' },
    { value: 'border', icon: <BorderOutlined />, label: 'Border' },
    { value: 'minus-circle', icon: <MinusCircleOutlined />, label: 'Minus Circle' }
  ];

  return (
    <Modal
      title="Thêm cột mới"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <form onSubmit={handleSubmit}>
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
              <Option value="text">Text</Option>
              <Option value="number">Number</Option>
              <Option value="date">Date</Option>
              <Option value="checkbox">Checkbox</Option>
              <Option value="single_select">Single Select</Option>
              <Option value="multi_select">Multi Select</Option>
              <Option value="formula">Formula</Option>
              <Option value="currency">Currency</Option>
            </Select>
          </div>

          {/* Checkbox configuration */}
          {newColumn.dataType === 'checkbox' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Cấu hình Checkbox</Text>
              <div>
                <Text>Biểu tượng:</Text>
                <Radio.Group
                  value={newColumn.checkboxConfig?.icon}
                  onChange={(e) =>
                    setNewColumn({
                      ...newColumn,
                      checkboxConfig: {
                        ...newColumn.checkboxConfig,
                        icon: e.target.value
                      }
                    })
                  }
                  style={{ marginTop: 8 }}
                >
                  <Space direction="vertical">
                    {checkboxIcons.map(({ value, icon, label }) => (
                      <Radio key={value} value={value}>
                        <Space>
                          {icon}
                          <span>{label}</span>
                        </Space>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>
              <div>
                <Text>Màu sắc:</Text>
                <Input
                  type="color"
                  value={newColumn.checkboxConfig?.color}
                  onChange={(e) =>
                    setNewColumn({
                      ...newColumn,
                      checkboxConfig: {
                        ...newColumn.checkboxConfig,
                        color: e.target.value
                      }
                    })
                  }
                  style={{ width: 100, marginLeft: 10 }}
                />
              </div>
              <div>
                <Checkbox
                  checked={newColumn.checkboxConfig?.defaultValue}
                  onChange={(e) =>
                    setNewColumn({
                      ...newColumn,
                      checkboxConfig: {
                        ...newColumn.checkboxConfig,
                        defaultValue: e.target.checked
                      }
                    })
                  }
                >
                  Giá trị mặc định (Checked)
                </Checkbox>
              </div>
            </Space>
          )}

          {/* Single Select configuration */}
          {newColumn.dataType === 'single_select' && (
            <SingleSelectConfig
              value={newColumn.singleSelectConfig}
              onChange={(config) =>
                setNewColumn({
                  ...newColumn,
                  singleSelectConfig: config
                })
              }
            />
          )}

          {/* Multi Select configuration */}
          {newColumn.dataType === 'multi_select' && (
            <MultiSelectConfig
              value={newColumn.multiSelectConfig}
              onChange={(config) =>
                setNewColumn({
                  ...newColumn,
                  multiSelectConfig: config
                })
              }
            />
          )}

          {/* Date configuration */}
          {newColumn.dataType === 'date' && (
            <DateConfig
              value={newColumn.dateConfig}
              onChange={(config) =>
                setNewColumn({
                  ...newColumn,
                  dateConfig: config
                })
              }
            />
          )}

          {/* Formula configuration */}
          {newColumn.dataType === 'formula' && (
            <FormulaConfig
              value={newColumn.formulaConfig}
              onChange={(config) =>
                setNewColumn({
                  ...newColumn,
                  formulaConfig: config
                })
              }
              columns={columns}
            />
          )}

          {/* Currency configuration */}
          {newColumn.dataType === 'currency' && (
            <CurrencyConfig
              value={newColumn.currencyConfig}
              onChange={(config) =>
                setNewColumn({
                  ...newColumn,
                  currencyConfig: config
                })
              }
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              Thêm cột
            </Button>
          </Space>
        </Space>
      </form>
    </Modal>
  );
};

export default AddColumnModal;
