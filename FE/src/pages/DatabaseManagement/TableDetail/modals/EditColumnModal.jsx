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

const EditColumnModal = ({
  visible,
  onCancel,
  onSubmit,
  editingColumn,
  setEditingColumn,
  columns = []
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const checkboxIcons = [
    { value: 'check-circle', icon: <CheckCircleOutlined />, label: 'Check Circle' },
    { value: 'close-circle', icon: <CloseCircleOutlined />, label: 'Close Circle' },
    { value: 'check-square', icon: <CheckSquareOutlined />, label: 'Check Square' },
    { value: 'border', icon: <BorderOutlined />, label: 'Border' },
    { value: 'minus-circle', icon: <MinusCircleOutlined />, label: 'Minus Circle' }
  ];

  if (!editingColumn) return null;

  return (
    <Modal
      title="Chỉnh sửa cột"
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
              value={editingColumn.name}
              onChange={(e) => setEditingColumn({ ...editingColumn, name: e.target.value })}
              placeholder="Nhập tên cột"
            />
          </div>
          <div>
            <Text strong>Loại dữ liệu</Text>
            <Select
              value={editingColumn.dataType}
              onChange={(value) => setEditingColumn({ ...editingColumn, dataType: value })}
              style={{ width: '100%' }}
              disabled
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
          {editingColumn.dataType === 'checkbox' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Cấu hình Checkbox</Text>
              <div>
                <Text>Biểu tượng:</Text>
                <Radio.Group
                  value={editingColumn.checkboxConfig?.icon}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      checkboxConfig: {
                        ...editingColumn.checkboxConfig,
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
                  value={editingColumn.checkboxConfig?.color}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      checkboxConfig: {
                        ...editingColumn.checkboxConfig,
                        color: e.target.value
                      }
                    })
                  }
                  style={{ width: 100, marginLeft: 10 }}
                />
              </div>
              <div>
                <Checkbox
                  checked={editingColumn.checkboxConfig?.defaultValue}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      checkboxConfig: {
                        ...editingColumn.checkboxConfig,
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
          {editingColumn.dataType === 'single_select' && (
            <SingleSelectConfig
              value={editingColumn.singleSelectConfig}
              onChange={(config) =>
                setEditingColumn({
                  ...editingColumn,
                  singleSelectConfig: config
                })
              }
            />
          )}

          {/* Multi Select configuration */}
          {editingColumn.dataType === 'multi_select' && (
            <MultiSelectConfig
              value={editingColumn.multiSelectConfig}
              onChange={(config) =>
                setEditingColumn({
                  ...editingColumn,
                  multiSelectConfig: config
                })
              }
            />
          )}

          {/* Date configuration */}
          {editingColumn.dataType === 'date' && (
            <DateConfig
              value={editingColumn.dateConfig}
              onChange={(config) =>
                setEditingColumn({
                  ...editingColumn,
                  dateConfig: config
                })
              }
            />
          )}

          {/* Formula configuration */}
          {editingColumn.dataType === 'formula' && (
            <FormulaConfig
              value={editingColumn.formulaConfig}
              onChange={(config) =>
                setEditingColumn({
                  ...editingColumn,
                  formulaConfig: config
                })
              }
              columns={columns.filter(col => col._id !== editingColumn._id)}
            />
          )}

          {/* Currency configuration */}
          {editingColumn.dataType === 'currency' && (
            <CurrencyConfig
              value={editingColumn.currencyConfig}
              onChange={(config) =>
                setEditingColumn({
                  ...editingColumn,
                  currencyConfig: config
                })
              }
            />
          )}

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              Cập nhật
            </Button>
          </Space>
        </Space>
      </form>
    </Modal>
  );
};

export default EditColumnModal;
