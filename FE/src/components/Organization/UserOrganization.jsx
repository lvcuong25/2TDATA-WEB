import React, { useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Avatar, Table, Button, Form, Select, Tag, Popconfirm, Typography, Divider, Input, Modal, Descriptions, Row, Col } from 'antd';
import { DeleteOutlined, EditOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, PictureOutlined, NumberOutlined } from '@ant-design/icons';
import { AuthContext } from '../core/Auth';
import { useSite } from '../../context/SiteContext';
import instance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

const UserOrganization = () => {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const { currentSite } = useSite();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [pendingRoleChange, setPendingRoleChange] = useState({ userId: null, newRole: null });
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(5);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  // Lấy thông tin tổ chức của user
  const { data: orgData, isLoading, error } = useQuery({
    queryKey: ['userOrganizations', currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const res = await instance.get(`organization/user/${currentUser._id}`);
      return res;
    },
    enabled: !!currentUser?._id,
    retry: false,
  });

  // Xử lý dữ liệu organizations
  const organizations = Array.isArray(orgData?.data) ? orgData.data : (orgData?.data ? [orgData.data] : []);
  const currentOrg = selectedOrgId ? organizations.find(org => org._id === selectedOrgId) : organizations[0];

  // Lấy danh sách users chưa thuộc tổ chức nào
  const { data: availableUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['availableUsers', currentSite?._id],
    queryFn: async () => {
      if (!currentSite?._id) return [];
      const { data } = await instance.get(`/organization/available-users?siteId=${currentSite._id}`);
      return data || [];
    },
    enabled: !!currentSite?._id,
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (values) => instance.post(`/organization/${currentOrg?._id}/members`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(['userOrganizations', currentUser?._id]);
      queryClient.invalidateQueries(['availableUsers', currentSite?._id]);
      form.resetFields();
      toast.success('Thêm thành viên thành công!');
    },
  });
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => instance.put(`/organization/${currentOrg?._id}/members/${userId}`, { role }),
    onSuccess: () => queryClient.invalidateQueries(['userOrganizations', currentUser?._id]),
  });
  const removeMemberMutation = useMutation({
    mutationFn: (userId) => instance.delete(`/organization/${currentOrg?._id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['userOrganizations', currentUser?._id]);
      queryClient.invalidateQueries(['availableUsers', currentSite?._id]);
      toast.success('Xóa thành viên thành công!');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Xóa thành viên thất bại!');
    }
  });
  const updateOrgMutation = useMutation({
    mutationFn: (values) => instance.put(`/organization/${currentOrg?._id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(['userOrganizations', currentUser?._id]);
      setEditModalOpen(false);
      toast.success('Cập nhật thông tin tổ chức thành công!');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Cập nhật thất bại!')
  });

  useEffect(() => {
    // Reset selectedOrgId when organizations change
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0]._id);
    }
  }, [organizations, selectedOrgId]);

  useEffect(() => {
    // Tính tổng số trang mới
    const totalMembers = currentOrg?.members?.length || 0;
    const totalPages = Math.ceil(totalMembers / memberPageSize) || 1;
    if (memberPage > totalPages) {
      setMemberPage(totalPages);
    }
  }, [currentOrg?.members?.length, memberPage, memberPageSize]);

  if (isLoading) return <div className="flex justify-center items-center h-64"><span>Đang tải...</span></div>;
  if (error) return <div className="text-center text-red-500">Lỗi: {error.message}</div>;
  if (!organizations.length) return <div className="text-center text-gray-500">Bạn chưa thuộc tổ chức nào.</div>;
  if (!currentOrg) return <div className="text-center text-gray-500">Không tìm thấy tổ chức được chọn.</div>;
  const myRole = currentOrg.members?.find(m => m.user._id === currentUser._id)?.role;
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

  const pagedMembers = (currentOrg.members || []).slice(
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
      name: currentOrg.name,
      email: currentOrg.email,
      phone: currentOrg.phone,
      address: currentOrg.address,
      identifier: currentOrg.identifier,
      taxCode: currentOrg.taxCode,
      logo: currentOrg.logo,
    });
    setEditModalOpen(true);
  };

  const handleUpdateOrg = (values) => {
    updateOrgMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      {/* Organization Selector for Super Admin */}
      {currentUser?.role === 'super_admin' && organizations.length > 1 && (
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <div className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="text-lg font-semibold text-gray-800">Quản lý tổ chức</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Bạn có quyền truy cập vào nhiều tổ chức. Chọn tổ chức để xem và quản lý:</p>
            <Select
              value={selectedOrgId || currentOrg?._id}
              onChange={setSelectedOrgId}
              style={{ width: '100%', maxWidth: 500 }}
              placeholder="Chọn tổ chức"
              size="large"
            >
              {organizations.map(org => (
                <Select.Option key={org._id} value={org._id}>
                  <div className="flex items-center">
                    <Avatar size={24} src={org.logo} className="mr-2">
                      {org.name ? org.name.charAt(0).toUpperCase() : 'O'}
                    </Avatar>
                    <span className="font-medium">{org.name}</span>
                    {org.site_id?.name && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {org.site_id.name}
                      </span>
                    )}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
        </Card>
      )}
      
      {/* Organization Header */}
      <Card className="shadow-sm">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Avatar 
                size={100} 
                src={currentOrg.logo}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold shadow-lg"
              >
                {currentOrg.name ? currentOrg.name.charAt(0).toUpperCase() : 'O'}
              </Avatar>
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentOrg.name || 'Chưa có tên tổ chức'}
                </h1>
                {currentOrg.site_id?.name && (
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Site: <span className="font-medium ml-1">{currentOrg.site_id.name}</span>
                  </div>
                )}
                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    {currentOrg.members?.length || 0} thành viên
                  </span>
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                    Vai trò: <span className="font-medium ml-1 capitalize">{myRole}</span>
                  </span>
                </div>
              </div>
            </div>
            {isOwner && (
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleEditOrg}
                size="large"
                className="bg-blue-600 hover:bg-blue-700 shadow-md"
              >
                Chỉnh sửa tổ chức
              </Button>
            )}
          </div>
        </div>
      </Card>
      {/* Organization Information */}
      <Card className="shadow-sm">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
            <h2 className="text-xl font-semibold text-gray-800">Thông tin tổ chức</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <IdcardOutlined className="text-blue-500 mr-3 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">Mã định danh</p>
                  <p className="font-medium">{currentOrg.identifier || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <NumberOutlined className="text-blue-500 mr-3 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">Mã số thuế</p>
                  <p className="font-medium">{currentOrg.taxCode || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <MailOutlined className="text-blue-500 mr-3 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{currentOrg.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <PhoneOutlined className="text-blue-500 mr-3 text-lg" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">{currentOrg.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                <HomeOutlined className="text-blue-500 mr-3 text-lg mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Địa chỉ</p>
                  <p className="font-medium">{currentOrg.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {/* Member Management */}
      <Card className="shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-1 h-6 bg-green-500 rounded mr-3"></div>
              <h2 className="text-xl font-semibold text-gray-800">Quản lý thành viên</h2>
            </div>
            <div className="text-sm text-gray-500">
              Tổng: <span className="font-medium text-gray-700">{currentOrg.members?.length || 0}</span> thành viên
            </div>
          </div>
          
          {isOwnerOrManager && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-3">Thêm thành viên mới</h3>
              <Form form={form} onFinish={handleAddMember} layout="inline" className="space-x-3">
                <Form.Item name="userId" rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}> 
                  <Select
                    showSearch
                    placeholder="Tìm và chọn người dùng để thêm"
                    loading={loadingUsers}
                    style={{ width: 300 }}
                    size="large"
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {availableUsers?.map(user => (
                      <Select.Option key={user._id} value={user._id} label={`${user.name} (${user.email})`}>
                        <div className="flex items-center">
                          <Avatar size={20} className="mr-2">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </Avatar>
                          <span>{user.name} ({user.email})</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="role" initialValue="member">
                  <Select style={{ width: 120 }} size="large">
                    <Select.Option value="manager">Manager</Select.Option>
                    <Select.Option value="member">Member</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={addMemberMutation.isLoading}
                    size="large"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Thêm thành viên
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
          
          <Table 
            columns={memberColumns}
            dataSource={pagedMembers}
            rowKey={record => record?.user?._id}
            className="rounded-lg overflow-hidden"
            pagination={{
              current: memberPage,
              pageSize: memberPageSize,
              total: currentOrg.members?.length || 0,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 15, 20, 50, 100],
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thành viên`,
              onChange: (page, pageSize) => {
                setMemberPage(page);
                setMemberPageSize(pageSize);
              }
            }}
          />
        </div>
      </Card>
      <Modal
        title={
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <EditOutlined className="text-blue-600" />
            </div>
            <span className="text-xl font-semibold text-gray-800">Chỉnh sửa thông tin tổ chức</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={900}
        className="top-5"
      >
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-white text-xs">💡</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">Gợi ý</p>
              <p className="text-sm text-blue-700">
                Hãy cập nhật thông tin chính xác để tổ chức của bạn được xác thực và liên hệ dễ dàng hơn.
              </p>
            </div>
          </div>
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
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button 
              onClick={() => setEditModalOpen(false)} 
              size="large"
              className="px-6"
            >
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={updateOrgMutation.isLoading} 
              size="large"
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserOrganization;
