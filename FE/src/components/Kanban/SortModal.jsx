import React from 'react';
import { Modal, Form, Select, Radio, Button, Space, Typography, Tag, Divider } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined, ClearOutlined } from '@ant-design/icons';
import { getDataTypeIcon } from '../../pages/DatabaseManagement/Utils/dataTypeUtils';

const { Option } = Select;
const { Text } = Typography;

const SortModal = ({ 
  open, 
  onCancel, 
  onApply, 
  onClear,
  columns = [], 
  currentSort = null 
}) => {
  const [form] = Form.useForm();

  // Initialize form with current sort values
  React.useEffect(() => {
    if (open && currentSort) {
      form.setFieldsValue({
        field: currentSort.field,
        direction: currentSort.direction,
        type: currentSort.type
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, currentSort, form]);

  const handleApply = async () => {
    try {
      const values = await form.validateFields();
      onApply(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  // Get sort type options based on column data type
  const getSortTypeOptions = (dataType) => {
    const options = [
      { value: 'auto', label: 'Auto-detect', description: 'Automatically determine sort type' }
    ];

    switch (dataType) {
      case 'text':
      case 'long_text':
      case 'email':
      case 'url':
      case 'phone':
        options.push(
          { value: 'text', label: 'Text', description: 'Alphabetical sorting' },
          { value: 'number', label: 'Number', description: 'Numeric sorting (if values are numbers)' }
        );
        break;
      case 'number':
      case 'currency':
      case 'percent':
      case 'rating':
        options.push({ value: 'number', label: 'Number', description: 'Numeric sorting' });
        break;
      case 'date':
      case 'datetime':
        options.push({ value: 'date', label: 'Date', description: 'Chronological sorting' });
        break;
      case 'checkbox':
        options.push({ value: 'checkbox', label: 'Checkbox', description: 'Boolean sorting (false first)' });
        break;
      default:
        options.push({ value: 'text', label: 'Text', description: 'Alphabetical sorting' });
    }

    return options;
  };

  const selectedColumn = form.getFieldValue('field');
  const selectedColumnData = columns.find(col => col.name === selectedColumn);
  const sortTypeOptions = getSortTypeOptions(selectedColumnData?.dataType);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <SortAscendingOutlined className="text-blue-500" />
          <span>Sort Records</span>
          {currentSort && (
            <Tag color="blue" className="ml-2">
              {currentSort.field} ({currentSort.direction})
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="clear" icon={<ClearOutlined />} onClick={handleClear}>
          Clear Sort
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="apply" 
          type="primary" 
          onClick={handleApply}
          icon={<SortAscendingOutlined />}
        >
          Apply Sort
        </Button>
      ]}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item 
          name="field" 
          label="Sort by Field" 
          rules={[{ required: true, message: 'Please select a field to sort by' }]}
        >
          <Select 
            placeholder="Select field to sort by"
            showSearch
            optionFilterProp="children"
          >
            {columns.map(column => (
              <Option key={column.name} value={column.name}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {getDataTypeIcon(column.dataType)}
                  </div>
                  <span>{column.name}</span>
                  <Text type="secondary" className="text-xs">
                    ({column.dataType})
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="direction" 
          label="Sort Direction"
          initialValue="asc"
        >
          <Radio.Group>
            <Radio.Button value="asc">
              <SortAscendingOutlined /> Ascending (A-Z, 1-9, oldest first)
            </Radio.Button>
            <Radio.Button value="desc">
              <SortDescendingOutlined /> Descending (Z-A, 9-1, newest first)
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {selectedColumn && (
          <Form.Item 
            name="type" 
            label="Sort Type"
            initialValue="auto"
          >
            <Select placeholder="Select sort type">
              {sortTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Divider />

        <div className="bg-gray-50 p-3 rounded">
          <Text strong className="text-sm text-gray-700">Sort Preview</Text>
          <div className="mt-2">
            {selectedColumn ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Records will be sorted by</span>
                <Tag color="blue">{selectedColumn}</Tag>
                <span className="text-gray-600">in</span>
                <Tag color={form.getFieldValue('direction') === 'desc' ? 'red' : 'green'}>
                  {form.getFieldValue('direction') === 'desc' ? 'Descending' : 'Ascending'}
                </Tag>
                <span className="text-gray-600">order</span>
              </div>
            ) : (
              <Text type="secondary" className="text-sm">
                Select a field to see sort preview
              </Text>
            )}
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default SortModal;
