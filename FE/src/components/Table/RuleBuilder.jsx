import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Divider,
  Card,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Collapse
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import ColorPicker from './ColorPicker';
import { getDefaultFormattingOptions } from '../../utils/formattingUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const RuleBuilder = ({ 
  visible, 
  onClose, 
  tableId, 
  databaseId,
  columns = [],
  editingRule = null
}) => {
  const [form] = Form.useForm();
  const [conditions, setConditions] = useState([]);
  const [formatting, setFormatting] = useState(getDefaultFormattingOptions());
  const queryClient = useQueryClient();

  // Create/Update rule mutation
  const saveRuleMutation = useMutation({
    mutationFn: async (ruleData) => {
      if (editingRule) {
        const response = await axiosInstance.put(`/conditional-formatting/rules/${editingRule.id}`, ruleData);
        return response.data;
      } else {
        const response = await axiosInstance.post(`/conditional-formatting/tables/${tableId}/rules`, ruleData);
        return response.data;
      }
    },
    onSuccess: () => {
      message.success(editingRule ? 'Rule updated successfully' : 'Rule created successfully');
      queryClient.invalidateQueries(['conditional-formatting-rules', tableId]);
      onClose();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to save rule');
    }
  });

  useEffect(() => {
    if (editingRule) {
      form.setFieldsValue({
        ruleName: editingRule.ruleName,
        ruleType: editingRule.ruleType,
        columnId: editingRule.columnId || '',
        priority: editingRule.priority,
        targetType: editingRule.targetType,
        targetUserId: editingRule.targetUserId,
        targetRole: editingRule.targetRole
      });
      setConditions(editingRule.conditions || []);
      setFormatting(editingRule.formatting || getDefaultFormattingOptions());
    } else {
      form.resetFields();
      setConditions([]);
      setFormatting(getDefaultFormattingOptions());
    }
  }, [editingRule, form]);

  const handleAddCondition = () => {
    setConditions([...conditions, {
      operator: 'equals',
      value: '',
      field: ''
    }]);
  };

  const handleRemoveCondition = (index) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    setConditions(newConditions);
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value
    };
    setConditions(newConditions);
  };

  const handleFormattingChange = (field, value) => {
    setFormatting({
      ...formatting,
      [field]: value
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (conditions.length === 0) {
        message.error('At least one condition is required');
        return;
      }

      const ruleData = {
        ...values,
        conditions,
        formatting,
        databaseId,
        // Convert empty string to null for columnId
        columnId: values.columnId === '' ? null : values.columnId
      };

      saveRuleMutation.mutate(ruleData);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const getOperatorOptions = (ruleType) => {
    switch (ruleType) {
      case 'cell_value':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
          { value: 'less_than_or_equal', label: 'Less Than or Equal' },
          { value: 'between', label: 'Between' },
          { value: 'not_between', label: 'Not Between' },
          { value: 'is_empty', label: 'Is Empty' },
          { value: 'is_not_empty', label: 'Is Not Empty' }
        ];
      case 'date':
        return [
          { value: 'today', label: 'Today' },
          { value: 'yesterday', label: 'Yesterday' },
          { value: 'tomorrow', label: 'Tomorrow' },
          { value: 'last_7_days', label: 'Last 7 Days' },
          { value: 'next_7_days', label: 'Next 7 Days' },
          { value: 'this_month', label: 'This Month' },
          { value: 'last_month', label: 'Last Month' },
          { value: 'before', label: 'Before' },
          { value: 'after', label: 'After' },
          { value: 'between_dates', label: 'Between Dates' }
        ];
      case 'text_contains':
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'not_contains', label: 'Does Not Contain' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with', label: 'Ends With' },
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'regex', label: 'Regular Expression' },
          { value: 'is_empty', label: 'Is Empty' },
          { value: 'is_not_empty', label: 'Is Not Empty' }
        ];
      default:
        return [];
    }
  };

  const renderValueInput = (condition, index) => {
    const ruleType = form.getFieldValue('ruleType');
    const operator = condition.operator;

    if (['is_empty', 'is_not_empty', 'today', 'yesterday', 'tomorrow', 'last_7_days', 'next_7_days', 'this_month', 'last_month'].includes(operator)) {
      return null; // No value input needed
    }

    if (operator === 'between' || operator === 'not_between') {
      return (
        <Row gutter={8}>
          <Col span={12}>
            <InputNumber
              placeholder="Min value"
              style={{ width: '100%' }}
              value={condition.value?.min}
              onChange={(value) => handleConditionChange(index, 'value', { ...condition.value, min: value })}
            />
          </Col>
          <Col span={12}>
            <InputNumber
              placeholder="Max value"
              style={{ width: '100%' }}
              value={condition.value?.max}
              onChange={(value) => handleConditionChange(index, 'value', { ...condition.value, max: value })}
            />
          </Col>
        </Row>
      );
    }

    if (operator === 'between_dates') {
      return (
        <Row gutter={8}>
          <Col span={12}>
            <DatePicker
              placeholder="Start date"
              style={{ width: '100%' }}
              value={condition.value?.start}
              onChange={(date) => handleConditionChange(index, 'value', { ...condition.value, start: date })}
            />
          </Col>
          <Col span={12}>
            <DatePicker
              placeholder="End date"
              style={{ width: '100%' }}
              value={condition.value?.end}
              onChange={(date) => handleConditionChange(index, 'value', { ...condition.value, end: date })}
            />
          </Col>
        </Row>
      );
    }

    if (['before', 'after'].includes(operator)) {
      return (
        <DatePicker
          placeholder="Select date"
          style={{ width: '100%' }}
          value={condition.value}
          onChange={(date) => handleConditionChange(index, 'value', date)}
        />
      );
    }

    if (ruleType === 'cell_value' && ['greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'].includes(operator)) {
      return (
        <InputNumber
          placeholder="Enter value"
          style={{ width: '100%' }}
          value={condition.value}
          onChange={(value) => handleConditionChange(index, 'value', value)}
        />
      );
    }

    return (
      <Input
        placeholder="Enter value"
        value={condition.value}
        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <span>{editingRule ? 'Edit' : 'Create'} Conditional Formatting Rule</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saveRuleMutation.isPending}
        >
          {editingRule ? 'Update Rule' : 'Create Rule'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          ruleType: 'cell_value',
          priority: 1,
          targetType: 'all_members'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="ruleName"
              label="Rule Name"
              rules={[{ required: true, message: 'Please enter rule name' }]}
            >
              <Input placeholder="Enter rule name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ruleType"
              label="Rule Type"
              rules={[{ required: true, message: 'Please select rule type' }]}
            >
              <Select placeholder="Select rule type">
                <Option value="cell_value">Cell Value</Option>
                <Option value="date">Date</Option>
                <Option value="text_contains">Text Contains</Option>
                <Option value="formula">Formula</Option>
                <Option value="cross_column">Cross Column</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="columnId"
              label="Target Column"
              rules={[{ required: true, message: 'Please select a column' }]}
            >
              <Select placeholder="Select column to apply formatting">
                <Option value="">All Columns</Option>
                {columns.map(column => (
                  <Option key={column._id || column.id} value={column._id || column.id}>
                    {column.name} ({column.dataType || column.type})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please enter priority' }]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="targetType"
              label="Target Type"
              rules={[{ required: true, message: 'Please select target type' }]}
            >
              <Select placeholder="Select target type">
                <Option value="all_members">All Members</Option>
                <Option value="specific_user">Specific User</Option>
                <Option value="specific_role">Specific Role</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider>Conditions</Divider>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddCondition}
            style={{ width: '100%' }}
          >
            Add Condition
          </Button>
        </div>

        {conditions.map((condition, index) => (
          <Card
            key={index}
            size="small"
            style={{ marginBottom: 8 }}
            title={`Condition ${index + 1}`}
            extra={
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveCondition(index)}
              />
            }
          >
            <Row gutter={8}>
              <Col span={6}>
                <Select
                  placeholder="Field"
                  value={condition.field}
                  onChange={(value) => handleConditionChange(index, 'field', value)}
                  style={{ width: '100%' }}
                >
                  {columns.map(column => (
                    <Option key={column._id || column.id} value={column.key || column.name}>
                      {column.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Operator"
                  value={condition.operator}
                  onChange={(value) => handleConditionChange(index, 'operator', value)}
                  style={{ width: '100%' }}
                >
                  {getOperatorOptions(form.getFieldValue('ruleType')).map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={12}>
                {renderValueInput(condition, index)}
              </Col>
            </Row>
          </Card>
        ))}

        <Divider>Formatting</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Background Color</Text>
              <ColorPicker
                value={formatting.backgroundColor}
                onChange={(color) => handleFormattingChange('backgroundColor', color)}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Text Color</Text>
              <ColorPicker
                value={formatting.textColor}
                onChange={(color) => handleFormattingChange('textColor', color)}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Font Weight</Text>
              <Select
                value={formatting.fontWeight}
                onChange={(value) => handleFormattingChange('fontWeight', value)}
                style={{ width: '100%' }}
              >
                <Option value="normal">Normal</Option>
                <Option value="bold">Bold</Option>
                <Option value="lighter">Lighter</Option>
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Font Style</Text>
              <Select
                value={formatting.fontStyle}
                onChange={(value) => handleFormattingChange('fontStyle', value)}
                style={{ width: '100%' }}
              >
                <Option value="normal">Normal</Option>
                <Option value="italic">Italic</Option>
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Text Decoration</Text>
              <Select
                value={formatting.textDecoration}
                onChange={(value) => handleFormattingChange('textDecoration', value)}
                style={{ width: '100%' }}
              >
                <Option value="none">None</Option>
                <Option value="underline">Underline</Option>
                <Option value="line-through">Strikethrough</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Border Color</Text>
              <ColorPicker
                value={formatting.borderColor}
                onChange={(color) => handleFormattingChange('borderColor', color)}
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Border Style</Text>
              <Select
                value={formatting.borderStyle}
                onChange={(value) => handleFormattingChange('borderStyle', value)}
                style={{ width: '100%' }}
              >
                <Option value="solid">Solid</Option>
                <Option value="dashed">Dashed</Option>
                <Option value="dotted">Dotted</Option>
                <Option value="none">None</Option>
              </Select>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default RuleBuilder;
