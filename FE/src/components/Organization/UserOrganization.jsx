import React, { useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Avatar, Table, Button, Form, Select, Tag, Popconfirm, Typography, Divider, Input, Modal, Descriptions, Row, Col } from 'antd';
import { DeleteOutlined, EditOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, PictureOutlined, NumberOutlined } from '@ant-design/icons';
import { AuthContext } from '../core/Auth';
import instance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';


const { Title, Text } = Typography;

const UserOrganization = () => {
  const { currentUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [pendingRoleChange, setPendingRoleChange] = useState({ userId: null, newRole: null });
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(5);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  // Lấy thông tin tổ chức của user
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const res = await instance.get(`organization/user/${currentUser._id}`);
      return res;
    },
    enabled: !!currentUser?._id,
    retry: false,
  });

  // Lấy danh sách user để thêm thành viên
  const { data: userData, isLoading: loadingUsers } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await instance.get(`/user?limit=1000`);
      return data.docs || data.data?.docs || [];
    },
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (values) => instance.post(`/organization/${org?.data?._id}/members`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization', currentUser?._id]);
      form.resetFields();
      toast.success('Thêm thành viên thành công!');
    },
  });
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => instance.put(`/organization/${org?.data?._id}/members/${userId}`, { role }),
    onSuccess: () => queryClient.invalidateQueries(['organization', currentUser?._id]),
  });
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => instance.delete(`/organization/${org?.data?._id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization', currentUser?._id]);
      toast.success('Xóa thành viên thành công!');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Xóa thành viên thất bại!');
    }
  });
  const updateOrgMutation = useMutation({
    mutationFn: (values) => instance.put(`/organization/${org?.data?._id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(['organization', currentUser?._id]);
      setEditModalOpen(false);
      toast.success('Cập nhật thông tin tổ chức thành công!');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Cập nhật thất bại!')
  });

  useEffect(() => {
    // Tính tổng số trang mới
    const totalMembers = org?.data?.members?.length || 0;
    const totalPages = Math.ceil(totalMembers / memberPageSize) || 1;
    if (memberPage > totalPages) {
      setMemberPage(totalPages);
    }
  }, [org?.data?.members?.length, memberPage, memberPageSize]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><span>Đang tải...</span></div>;
  if (!org) return <div className="text-center text-gray-500">Bạn chưa thuộc tổ chức nào.</div>;
  const orgData = org.data || org;
  const myRole = orgData.members?.find(m => m.user._id === currentUser._id)?.role;
  const isOwnerOrManager = myRole === 'owner' || myRole === 'manager';
  const isOwner = myRole === 'owner';

  const handleAddMember = (values) => addMemberMutation.mutate(values);
  const handleRoleChange = (userId, role) => updateMemberRoleMutation.mutate({ userId, role });
  const handleRemoveMember = (userId) => removeMemberMutation.mutate(userId);

  const handleRoleSelect = (userId, newRole) => {
    setPendingRoleChange({ userId, newRole });
  };

  const confirmRoleChange = () => {
    handleRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
    setPendingRoleChange({ userId: null, newRole: null });
    toast.success('Đã đổi vai trò thành công!');
  };

  const cancelRoleChange = () => {
    setPendingRoleChange({ userId: null, newRole: null });
  };

  const pagedMembers = (orgData.members || []).slice(
    (memberPage - 1) * memberPageSize,
    memberPage * memberPageSize
  );

  const memberColumns = [
    { title: 'Tên thành viên', dataIndex: ['user', 'name'], key: 'name', render: (text, record) => text || record.user?.email },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        if (role === 'owner') return <Tag color="gold">Owner</Tag>;
        if (!(isOwnerOrManager)) return <Tag color={role === 'manager' ? 'blue' : 'default'}>{role.charAt(0).toUpperCase() + role.slice(1)}</Tag>;
        return (
          <Popconfirm
            title={`Bạn có chắc chắn muốn đổi vai trò thành ${pendingRoleChange.newRole}?`}
            open={pendingRoleChange.userId === record.user._id}
            onConfirm={confirmRoleChange}
            onCancel={cancelRoleChange}
            okText="Đổi"
            cancelText="Hủy"
          >
            <Select
              value={role}
              style={{ width: 120 }}
              onChange={newRole => handleRoleSelect(record.user._id, newRole)}
              loading={updateMemberRoleMutation.isLoading}
            >
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="member">Member</Select.Option>
            </Select>
          </Popconfirm>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => {
        if (record.role === 'owner' || !isOwnerOrManager) return null;
        return (
          <Popconfirm title="Xóa thành viên này?" onConfirm={() => handleRemoveMember(record.user._id)} okText="Xóa" cancelText="Hủy">
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        );
      },
    },
  ];

  const handleEditOrg = () => {
    editForm.setFieldsValue({
      name: orgData.name,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      identifier: orgData.identifier,
      taxCode: orgData.taxCode,
      logo: orgData.logo,
    });
    setEditModalOpen(true);
  };

  const handleUpdateOrg = (values) => {
    updateOrgMutation.mutate(values);
  };

  return (
    <Card className="shadow-sm mb-6">
      <div className="flex items-center mb-6">
        <Avatar 
          size={80} 
          src={orgData.logo}
          className="bg-blue-600 text-white text-2xl font-bold"
        >
          {orgData.name ? orgData.name.charAt(0).toUpperCase() : 'O'}
        </Avatar>
        <div className="ml-6 flex-1">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {orgData.name || 'Chưa có tên tổ chức'}
          </h2>
        </div>
        {isOwner && (
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={handleEditOrg}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Chỉnh sửa
          </Button>
        )}
      </div>
      <Descriptions 
        title="Thông tin tổ chức" 
        bordered 
        column={1}
        className="mt-6"
      >
        <Descriptions.Item 
          label={<span className="flex items-center"><IdcardOutlined className="mr-2" />Mã định danh</span>}
        >
          {orgData.identifier || 'Chưa cập nhật'}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<span className="flex items-center"><NumberOutlined className="mr-2" />Mã số thuế</span>}
        >
          {orgData.taxCode || 'Chưa cập nhật'}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<span className="flex items-center"><MailOutlined className="mr-2" />Email</span>}
        >
          {orgData.email || 'Chưa cập nhật'}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<span className="flex items-center"><PhoneOutlined className="mr-2" />Số điện thoại</span>}
        >
          {orgData.phone || 'Chưa cập nhật'}
        </Descriptions.Item>
        <Descriptions.Item 
          label={<span className="flex items-center"><HomeOutlined className="mr-2" />Địa chỉ</span>}
        >
          {orgData.address || 'Chưa cập nhật'}
        </Descriptions.Item>
      </Descriptions>
      {isOwnerOrManager && (
        <Form form={form} onFinish={handleAddMember} layout="inline" style={{ marginBottom: 16 }} className='mt-10'>
          <Form.Item name="userId" rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}> 
            <Select
              showSearch
              placeholder="Tìm và chọn người dùng để thêm"
              loading={loadingUsers}
              style={{ width: 300 }}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {userData?.filter(user => !orgData.members.some(m => m.user._id === user._id))
                .map(user => (
                  <Select.Option key={user._id} value={user._id} label={`${user.name} (${user.email})`}>
                    {user.name} ({user.email})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" initialValue="member">
            <Select style={{ width: 120 }}>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="member">Member</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={addMemberMutation.isLoading}>Thêm</Button>
          </Form.Item>
        </Form>
      )}
      <Table className='pt-5'
        columns={memberColumns}
        dataSource={pagedMembers}
        rowKey={record => record?.user?._id}
        pagination={{
          current: memberPage,
          pageSize: memberPageSize,
          total: orgData.members?.length || 0,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 15, 20, 50, 100],
          onChange: (page, pageSize) => {
            setMemberPage(page);
            setMemberPageSize(pageSize);
          }
        }}
      />
      <Modal
        title={
          <div className="flex items-center">
            <EditOutlined className="mr-2 text-blue-600" />
            <span className="text-lg font-semibold">Chỉnh sửa thông tin tổ chức</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnClose
        width={800}
      >
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Gợi ý:</strong> Hãy cập nhật thông tin chính xác để tổ chức của bạn được xác thực và liên hệ dễ dàng hơn.
          </p>
        </div>
        <Form form={editForm} layout="vertical" onFinish={handleUpdateOrg} className="mt-4">
          <Row gutter={24}>
            <Col xs={24} md={12} className="min-w-[320px]">
              <Form.Item
                name="name"
                label={<span className="flex items-center text-lg font-medium"><IdcardOutlined className="mr-2 text-blue-600" />Tên tổ chức</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức!' }]}
                extra="Nhập tên đầy đủ của tổ chức"
                className="mb-6"
              >
                <Input placeholder="Tên tổ chức" size="large" className="py-3 text-base" />
              </Form.Item>
              <Form.Item
                name="email"
                label={<span className="flex items-center text-lg font-medium"><MailOutlined className="mr-2 text-blue-600" />Email</span>}
                rules={[{ type: 'email', message: 'Email không đúng định dạng!' }]}
                extra="Email liên hệ của tổ chức"
                className="mb-6"
              >
                <Input placeholder="Email" size="large" className="py-3 text-base" />
              </Form.Item>
              <Form.Item
                name="phone"
                label={<span className="flex items-center text-lg font-medium"><PhoneOutlined className="mr-2 text-blue-600" />Số điện thoại</span>}
                extra="Số điện thoại liên hệ"
                className="mb-6"
              >
                <Input placeholder="Số điện thoại" size="large" className="py-3 text-base" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} className="min-w-[320px]">
              <Form.Item
                name="address"
                label={<span className="flex items-center text-lg font-medium"><HomeOutlined className="mr-2 text-blue-600" />Địa chỉ</span>}
                extra="Địa chỉ trụ sở tổ chức"
                className="mb-6"
              >
                <Input placeholder="Địa chỉ" size="large" className="py-3 text-base" />
              </Form.Item>
              <Form.Item
                name="identifier"
                label={<span className="flex items-center text-lg font-medium"><NumberOutlined className="mr-2 text-blue-600" />Mã định danh</span>}
                extra="Mã định danh tổ chức (nếu có)"
                className="mb-6"
              >
                <Input placeholder="Mã định danh" size="large" className="py-3 text-base" />
              </Form.Item>
              <Form.Item
                name="taxCode"
                label={<span className="flex items-center text-lg font-medium"><NumberOutlined className="mr-2 text-blue-600" />Mã số thuế</span>}
                extra="Mã số thuế tổ chức (nếu có)"
                className="mb-6"
              >
                <Input placeholder="Mã số thuế" size="large" className="py-3 text-base" />
              </Form.Item>
              <Form.Item
                name="logo"
                label={<span className="flex items-center text-lg font-medium"><PictureOutlined className="mr-2 text-blue-600" />Logo (URL)</span>}
                extra="Link ảnh logo tổ chức (nếu có)"
                className="mb-6"
              >
                <Input placeholder="Logo (URL)" size="large" className="py-3 text-base" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="text-right">
            <Button onClick={() => setEditModalOpen(false)} style={{ marginRight: 8 }}>
              Hủy bỏ
            </Button>
            <Button type="primary" htmlType="submit" loading={updateOrgMutation.isLoading} className="bg-blue-600 hover:bg-blue-700">
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserOrganization;
