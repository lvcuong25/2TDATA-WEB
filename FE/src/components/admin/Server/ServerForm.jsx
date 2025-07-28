import React from 'react';
import { Form, Input, Button, Select, Row, Col, Card, Divider } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { UserOutlined, TeamOutlined, InfoCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from '../../../api/axiosConfig';

const { Option } = Select;

const statusOptions = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
  { value: 'maintenance', label: 'Bảo trì' },
];

const ServerForm = ({ initialValues = {}, onSubmit, loading, users = [] }) => {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      ...initialValues,
      userLimits: initialValues.userLimits || {}
    }
  });

  const watchedUserLimits = watch('userLimits');
  const watchedUsers = watch('users');
  const watchedSelectedSite = watch('selectedSite');

  // Fetch sites for filtering
  const { data: sitesData } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await axios.get('/sites', { params: { limit: 100 } });
      return res.data.data || [];
    },
  });

  // Filter users by selected site
  const filteredUsers = watchedSelectedSite 
    ? users.filter(user => user.site_id?._id === watchedSelectedSite || user.site_id === watchedSelectedSite)
    : users;

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Row gutter={24}>
        {/* Left Column */}
        <Col span={12}>
          {/* Basic Information */}
          <Card title="Thông tin cơ bản" className="mb-4">
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
          </Card>

          {/* User Limits */}
          <Card 
            title={
              <span>
                <TeamOutlined className="mr-2" />
                Giới hạn người dùng
              </span>
            } 
            className="mb-4"
            extra={
              <div className="text-sm text-gray-500 flex items-center">
                <InfoCircleOutlined className="mr-1" />
                Tùy chọn
              </div>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Số lượng tối thiểu"
                  validateStatus={errors.userLimits?.min ? 'error' : ''}
                  help={errors.userLimits?.min?.message}
                >
                  <Controller
                    name="userLimits.min"
                    control={control}
                    rules={{
                      min: { value: 0, message: 'Số lượng tối thiểu phải >= 0' },
                      validate: (value) => {
                        const max = watchedUserLimits?.max;
                        if (value && max && parseInt(value) > parseInt(max)) {
                          return 'Số lượng tối thiểu không thể lớn hơn số lượng tối đa';
                        }
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        type="number"
                        min="0"
                        placeholder="VD: 1" 
                        suffix={<UserOutlined />}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  label="Số lượng tối đa"
                  validateStatus={errors.userLimits?.max ? 'error' : ''}
                  help={errors.userLimits?.max?.message}
                >
                  <Controller
                    name="userLimits.max"
                    control={control}
                    rules={{
                      min: { value: 1, message: 'Số lượng tối đa phải >= 1' },
                      validate: (value) => {
                        const min = watchedUserLimits?.min;
                        if (value && min && parseInt(value) < parseInt(min)) {
                          return 'Số lượng tối đa không thể nhỏ hơn số lượng tối thiểu';
                        }
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        type="number"
                        min="1"
                        placeholder="VD: 100" 
                        suffix={<UserOutlined />}
                      />
                    )}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            {/* Validation Info */}
            {watchedUserLimits?.min && watchedUserLimits?.max && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Thông tin giới hạn:</div>
                  <div>• Tối thiểu: {watchedUserLimits.min} người dùng</div>
                  <div>• Tối đa: {watchedUserLimits.max} người dùng</div>
                </div>
              </div>
            )}
          </Card>
        </Col>

        {/* Right Column */}
        <Col span={12}>
          {/* User Assignment */}
          <Card 
            title={
              <span>
                <UserOutlined className="mr-2" />
                Gán người dùng
              </span>
            }
            className="mb-4"
          >
            {/* Site Selection */}
            <Form.Item
              label={
                <span>
                  <GlobalOutlined className="mr-1" />
                  Chọn site
                </span>
              }
            >
              <Controller
                name="selectedSite"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Chọn site để lọc người dùng (tùy chọn)"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {sitesData?.map(site => (
                      <Option key={site._id} value={site._id}>
                        {site.name}
                        {site.domains && site.domains.length > 0 && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({site.domains[0]})
                          </span>
                        )}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label="Người dùng"
              validateStatus={errors.users ? 'error' : ''}
              help={errors.users?.message}
            >
              <Controller
                name="users"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value || value.length === 0) return true;
                    
                    const max = watchedUserLimits?.max;
                    if (max && value.length > parseInt(max)) {
                      return `Số lượng người dùng (${value.length}) vượt quá giới hạn tối đa (${max})`;
                    }
                    return true;
                  }
                }}
                render={({ field }) => (
                  <Select
                    mode="multiple"
                    placeholder={
                      watchedSelectedSite 
                        ? `Chọn người dùng từ site đã chọn (${filteredUsers.length} người dùng)`
                        : "Chọn người dùng (có thể bỏ trống hoặc chọn nhiều)"
                    }
                    allowClear
                    value={Array.isArray(field.value) ? field.value : field.value ? [field.value] : []}
                    onChange={val => field.onChange(Array.isArray(val) ? val : [val])}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {filteredUsers.map(user => (
                      <Option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                        {user.site_id?.name && (
                          <span className="text-gray-500 text-sm ml-2">
                            - {user.site_id.name}
                          </span>
                        )}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>
            
            {/* User Count Info */}
            {watchedUsers && watchedUsers.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Thông tin người dùng:</div>
                  <div>• Đã chọn: {watchedUsers.length} người dùng</div>
                  {watchedUserLimits?.max && (
                    <div>• Còn lại: {Math.max(0, watchedUserLimits.max - watchedUsers.length)} slot</div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Description */}
          <Card title="Mô tả" className="mb-4">
            <Form.Item
              validateStatus={errors.description ? 'error' : ''}
              help={errors.description?.message}
            >
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Input.TextArea {...field} rows={6} placeholder="Nhập mô tả (tuỳ chọn)" />
                )}
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} className="bg-blue-500 hover:bg-blue-600">
          Lưu
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ServerForm; 