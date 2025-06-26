import React, { useContext } from 'react';
import { Form, Input, Button, Card, Divider } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import instance from '../../utils/axiosInstance';
import { AuthContext } from '../core/Auth';
import { toast } from 'react-toastify';

const ChangePassword = () => {
  const [form] = Form.useForm();
  const { removeCurrentUser } = useContext(AuthContext);

  const { mutate, isPending } = useMutation({
    mutationFn: async (values) => {
      // The leading slash is important for axios instance base URL
      const { data } = await instance.post('/auth/change-password', values);
      return data;
    },
    onSuccess: () => {
      toast.success('Mật khẩu đã được thay đổi thành công!');
      removeCurrentUser();
      form.resetFields();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi mật khẩu!';
      toast.error(errorMessage);
    },
  });

  const onFinish = (data) => {
mutate(data)
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đổi mật khẩu</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Cập nhật mật khẩu để bảo vệ tài khoản của bạn
        </p>
      </div>

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="oldPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Nhập mật khẩu hiện tại"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Divider />

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Nhập mật khẩu mới"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon" />}
              placeholder="Nhập lại mật khẩu mới"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="large"
            >
              {isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Lưu ý về mật khẩu:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Mật khẩu phải có ít nhất 6 ký tự</li>
          <li>• Nên chứa chữ hoa, chữ thường và số</li>
          <li>• Không nên sử dụng thông tin cá nhân</li>
          <li>• Nên thay đổi mật khẩu định kỳ</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword; 