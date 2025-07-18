import React from 'react';
import { Form, Input, Button, Select } from 'antd';
import { useForm, Controller } from 'react-hook-form';

const { Option } = Select;

const statusOptions = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
  { value: 'maintenance', label: 'Bảo trì' },
];

const ServerForm = ({ initialValues = {}, onSubmit, loading, users = [] }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialValues
  });

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Form.Item
        label="Người dùng"
        validateStatus={errors.users ? 'error' : ''}
        help={errors.users?.message}
      >
        <Controller
          name="users"
          control={control}
          render={({ field }) => (
            <Select
              mode="multiple"
              placeholder="Chọn người dùng (có thể bỏ trống hoặc chọn nhiều)"
              allowClear
              value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
              onChange={val => field.onChange(Array.isArray(val) ? val : [val])}
            >
              {users.map(user => (
                <Option key={user._id} value={user._id}>{user.name} ({user.email})</Option>
              ))}
            </Select>
          )}
        />
      </Form.Item>
      <Form.Item
        label="Link server"
        required
        validateStatus={errors.link ? 'error' : ''}
        help={errors.link?.message}
      >
        <Controller
          name="link"
          control={control}
          rules={{ required: 'Vui lòng nhập link server!' }}
          render={({ field }) => (
            <Input {...field} placeholder="Nhập link server" />
          )}
        />
      </Form.Item>
      <Form.Item
        label="API Code"
        required
        validateStatus={errors.apiCode ? 'error' : ''}
        help={errors.apiCode?.message}
      >
        <Controller
          name="apiCode"
          control={control}
          rules={{ required: 'Vui lòng nhập API code!' }}
          render={({ field }) => (
            <Input {...field} placeholder="Nhập API code" />
          )}
        />
      </Form.Item>
      <Form.Item
        label="Mô tả"
        validateStatus={errors.description ? 'error' : ''}
        help={errors.description?.message}
      >
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input.TextArea {...field} rows={4} placeholder="Nhập mô tả (tuỳ chọn)" />
          )}
        />
      </Form.Item>
      <Form.Item
        label="Trạng thái"
        required
        validateStatus={errors.status ? 'error' : ''}
        help={errors.status?.message}
      >
        <Controller
          name="status"
          control={control}
          rules={{ required: 'Vui lòng chọn trạng thái!' }}
          render={({ field }) => (
            <Select {...field} placeholder="Chọn trạng thái">
              {statusOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          )}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} className="bg-blue-500">
          Lưu
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ServerForm; 