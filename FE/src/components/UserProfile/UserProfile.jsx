import React, { useState, useContext } from 'react';
import { Card, Avatar, Descriptions, Button, Divider, message, Row, Col, Tag, Spin, Form, Input, Modal } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, CloseOutlined, MailOutlined, CalendarOutlined, PhoneOutlined } from '@ant-design/icons';
import { AuthContext } from '../core/Auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import instance from '../../utils/axiosInstance';

const UserProfile = () => {
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  console.log(currentUser)
  const [isEditing, setIsEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch user services data
  const { data: userServicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["userServices", currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser?._id}/services`, {
        params: {
          page: 1,
          limit: 100, // Get all services for profile view
        },
      });
      return response?.data;
    },
    enabled: !!currentUser?._id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values) => {
      const response = await instance.patch('/user', values);
      return response.data;
    },
    onSuccess: (data) => {
      message.success('Cập nhật thông tin thành công!');
      setCurrentUser(data.data); // Update AuthContext
      setIsModalVisible(false);
      form.resetFields();
      // Invalidate and refetch user services
      queryClient.invalidateQueries(["userServices"]);
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
    },
  });

  const userServices = userServicesData?.data?.services || [];

  const handleEdit = () => {
    setIsModalVisible(true);
    // Set form values
    form.setFieldsValue({
      name: currentUser.name || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      updateProfileMutation.mutate(values);
    } catch (error) {
      console.error('Form validation error:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thông tin cá nhân</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <Row gutter={[24, 24]}>
        {/* Profile Card */}
        <Col xs={24} lg={16}>
          <Card className="shadow-sm">
            <div className="flex items-center mb-6">
              <Avatar 
                size={80} 
                icon={<UserOutlined />} 
                className="bg-blue-600 text-white text-2xl font-bold"
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <div className="ml-6 flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {currentUser.name || 'Chưa có tên'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                </p>
                <div className="mt-2">
                  <Tag color={currentUser.role === 'admin' ? 'red' : 'blue'}>
                    {currentUser.role === 'admin' ? 'Admin' : 'User'}
                  </Tag>
                </div>
              </div>
              <div>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={handleEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Chỉnh sửa
                </Button>
              </div>
            </div>

            <Divider />

            <Descriptions 
              title="Thông tin chi tiết" 
              bordered 
              column={1}
              className="mt-6"
            >
              <Descriptions.Item 
                label={
                  <span className="flex items-center">
                    <UserOutlined className="mr-2" />
                    Họ và tên
                  </span>
                }
              >
                {currentUser.name || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item 
                label={
                  <span className="flex items-center">
                    <MailOutlined className="mr-2" />
                    Email
                  </span>
                }
              >
                {currentUser.email || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item 
                label={
                  <span className="flex items-center">
                    <PhoneOutlined className="mr-2" />
                    Số điện thoại
                  </span>
                }
              >
                {currentUser.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item 
                label={
                  <span className="flex items-center">
                    <CalendarOutlined className="mr-2" />
                    Ngày tạo tài khoản
                  </span>
                }
              >
                {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Stats Card */}
        <Col xs={24} lg={8}>
          <Card className="shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thống kê tài khoản
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Dịch vụ đang sử dụng</p>
                  <div className="text-2xl font-bold text-blue-900">
                    {servicesLoading ? (
                      <Spin size="small" />
                    ) : (
                      userServices.length
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-600 font-medium">Trạng thái tài khoản</p>
                  <p className="text-lg font-semibold text-green-900">Hoạt động</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Vai trò</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">👤</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Services Section */}
     

      {/* Edit Profile Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <EditOutlined className="mr-2 text-blue-600" />
            <span>Chỉnh sửa thông tin cá nhân</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel} disabled={updateProfileMutation.isPending}>
            Hủy bỏ
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handleSave}
            loading={updateProfileMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Gợi ý:</strong> Hãy cập nhật thông tin chính xác để chúng tôi có thể liên hệ với bạn dễ dàng hơn.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label={
              <span className="flex items-center font-medium">
                <UserOutlined className="mr-2 text-blue-600" />
                Họ và tên
              </span>
            }
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên của bạn!' },
              { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
              { max: 50, message: 'Họ và tên không được quá 50 ký tự!' }
            ]}
            extra="Nhập họ và tên đầy đủ của bạn (VD: Nguyễn Văn A)"
          >
            <Input 
              placeholder="Nhập họ và tên của bạn" 
              size="large"
              prefix={<UserOutlined className="text-gray-400" />}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="flex items-center font-medium">
                <MailOutlined className="mr-2 text-blue-600" />
                Email
              </span>
            }
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập địa chỉ email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
            extra="Email sẽ được sử dụng để đăng nhập và nhận thông báo"
          >
            <Input 
              placeholder="Nhập địa chỉ email của bạn" 
              size="large"
              prefix={<MailOutlined className="text-gray-400" />}
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="flex items-center font-medium">
                <PhoneOutlined className="mr-2 text-blue-600" />
                Số điện thoại
              </span>
            }
            name="phone"
            rules={[
              { pattern: /^[0-9+\-\s()]*$/, message: 'Số điện thoại không hợp lệ!' },
              { min: 10, message: 'Số điện thoại phải có ít nhất 10 số!' }
            ]}
            extra="Số điện thoại giúp chúng tôi liên hệ với bạn khi cần thiết (VD: 0123456789)"
          >
            <Input 
              placeholder="Nhập số điện thoại (tùy chọn)" 
              size="large"
              prefix={<PhoneOutlined className="text-gray-400" />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
