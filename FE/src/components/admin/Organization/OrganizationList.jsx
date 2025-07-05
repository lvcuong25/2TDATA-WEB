import React, { useState } from 'react';
import instance from '../../../utils/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Pagination, Select, Upload, Switch, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, TeamOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { uploadFileCloudinary } from '../libs/uploadImageCloud';

const OrganizationList = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [logoUrl, setLogoUrl] = useState('');
  const [searchValue, setSearchValue] = useState("");
  const queryClient = useQueryClient();

  // State for member management
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [addMemberForm] = Form.useForm();

  // Fetch organization data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["ORGANIZATION", currentPage, pageSize, searchValue],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(searchValue && { search: searchValue })
      });
      const { data } = await instance.get(`/organization?${params}`);
      return data;
    },
  });

  // Fetch user data for manager select and add member
  const { data: userData, isLoading: loadingUsers } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await instance.get(`/user?limit=1000`);
      return data.docs || data.data?.docs || [];
    },
  });

  // Fetch details of the selected organization for member management
  const { data: selectedOrgData, isLoading: isLoadingSelectedOrg, refetch: refetchSelectedOrg } = useQuery({
    queryKey: ['ORGANIZATION_DETAILS', selectedOrg?._id],
    queryFn: async () => {
      if (!selectedOrg?._id) return null;
      const { data } = await instance.get(`/organization/${selectedOrg._id}`);
      return data;
    },
    enabled: !!selectedOrg,
  });

  // Mutations for main organization CRUD
  const createMutation = useMutation({
    mutationFn: (values) => instance.post('/organization', values),
    onSuccess: () => {
      queryClient.invalidateQueries(["ORGANIZATION"]);
      toast.success('Thêm tổ chức thành công!');
      setIsModalVisible(false);
      form.resetFields();
      setLogoUrl('');
    },
    onError: (error) => toast.error('Lỗi: ' + (error.response?.data?.error || error.message)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => instance.put(`/organization/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(["ORGANIZATION"]);
      toast.success('Cập nhật tổ chức thành công!');
      setIsModalVisible(false);
      setEditingOrg(null);
      form.resetFields();
      setLogoUrl('');
    },
    onError: (error) => toast.error('Lỗi: ' + (error.response?.data?.error || error.message)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/organization/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["ORGANIZATION"]);
      toast.success('Xóa tổ chức thành công!');
    },
    onError: (error) => toast.error('Lỗi: ' + (error.response?.data?.error || error.message)),
  });

  // Mutations for member management
  const addMemberMutation = useMutation({
    mutationFn: ({ orgId, values }) => instance.post(`/organization/${orgId}/members`, values),
    onSuccess: () => {
      toast.success('Thêm thành viên thành công!');
      refetchSelectedOrg();
      addMemberForm.resetFields();
    },
    onError: (error) => toast.error('Lỗi: ' + (error.response?.data?.error || error.message)),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ orgId, userId, role }) => instance.put(`/organization/${orgId}/members/${userId}`, { role }),
    onSuccess: () => {
      toast.success('Cập nhật vai trò thành công!');
      refetchSelectedOrg();
    },
    onError: (error) => toast.error('Lỗi: ' + (error.response?.data?.error || error.message)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ orgId, userId }) => instance.delete(`/organization/${orgId}/members/${userId}`),
    onSuccess: () => {
      toast.success('Xóa thành viên thành công!');
      refetchSelectedOrg();
    },
    onError: (error) => toast.error('Lỗi: ' + (error.response?.data?.error || error.message)),
  });

  const handleAdd = () => {
    setEditingOrg(null);
    form.resetFields();
    setLogoUrl('');
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingOrg(record);
    form.setFieldsValue({
      ...record,
      manager: typeof record.manager === 'object' ? record.manager?._id : record.manager,
    });
    setLogoUrl(record.logo || '');
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (values) => {
    const submitValues = { ...values, logo: logoUrl };
    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg._id, values: submitValues });
    } else {
      createMutation.mutate(submitValues);
    }
  };

  const handleLogoUpload = async (info) => {
    if (info.file.status === 'done' || info.file.status === 'uploading') {
      const file = info.file.originFileObj;
      if (file) {
        const url = await uploadFileCloudinary(file);
        setLogoUrl(url);
        form.setFieldsValue({ logo: url });
        toast.success('Tải logo thành công!');
      }
    }
  };
  
  const handleManageMembers = (record) => {
    setSelectedOrg(record);
    setIsMembersModalVisible(true);
  };

  const handleAddMemberSubmit = (values) => {
    addMemberMutation.mutate({ orgId: selectedOrg._id, values });
  };
  
  const handleRoleChange = (userId, role) => {
    updateMemberRoleMutation.mutate({ orgId: selectedOrg._id, userId, role });
  };

  const handleRemoveMember = (userId) => {
    removeMemberMutation.mutate({ orgId: selectedOrg._id, userId });
  };

  const columns = [
    {
      title: 'Tên tổ chức',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Quản lý',
      dataIndex: 'manager',
      key: 'manager',
      render: (manager) => manager?.name || manager?.email || '---',
    },
    {
        title: 'Mã định danh',
        dataIndex: 'identifier',
        key: 'identifier',
    },
    {
        title: 'Mã số thuế',
        dataIndex: 'taxCode',
        key: 'taxCode',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<TeamOutlined />} onClick={() => handleManageMembers(record)}>
       
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tổ chức này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const memberColumns = [
    { title: 'Tên thành viên', dataIndex: ['user', 'name'], key: 'name', render: (text, record) => text || record.user?.email },
    { title: 'Email', dataIndex: ['user', 'email'], key: 'email' },
    {
        title: 'Vai trò',
        dataIndex: 'role',
        key: 'role',
        render: (role, record) => {
            if (role === 'owner') {
                return <Tag color="gold">Owner</Tag>;
            }
            return (
                <Select
                    value={role}
                    style={{ width: 120 }}
                    onChange={(newRole) => handleRoleChange(record.user._id, newRole)}
                    loading={updateMemberRoleMutation.isLoading}
                >
                    <Select.Option value="manager">Manager</Select.Option>
                    <Select.Option value="member">Member</Select.Option>
                </Select>
            );
        },
    },
    {
        title: 'Thao tác',
        key: 'action',
        render: (_, record) => {
            if (record.role === 'owner') return null;
            return (
                <Popconfirm
                    title="Xóa thành viên này?"
                    onConfirm={() => handleRemoveMember(record.user._id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button danger icon={<DeleteOutlined />} loading={removeMemberMutation.isLoading && removeMemberMutation.variables.userId === record.user._id} />
                </Popconfirm>
            );
        },
    },
  ];

  if (error) {
    return <div>Có lỗi xảy ra: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Tổ chức</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Thêm Tổ chức
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm kiếm..."
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            setCurrentPage(1);
          }}
          allowClear
          style={{ width: 320 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data?.docs || []}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
      />

      {data && (
        <div className="flex justify-center mt-4">
          <Pagination
            current={currentPage}
            total={data.totalDocs}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} tổ chức`
            }
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      )}

      {/* Main Modal for Add/Edit Organization */}
      <Modal
        title={editingOrg ? 'Sửa Tổ chức' : 'Thêm Tổ chức'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Form fields for organization */}
          <Form.Item name="name" label="Tên tổ chức" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="manager" label="Quản lý" rules={[{ required: true }]}>
            <Select 
              placeholder="Chọn quản lý" 
              loading={loadingUsers} 
              showSearch 
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            >
              {userData?.map(user => (<Select.Option key={user._id} value={user._id} label={user.name || user.email}>{user.name || user.email}</Select.Option>))}
            </Select>
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Số điện thoại"><Input /></Form.Item>
          <Form.Item name="address" label="Địa chỉ"><Input /></Form.Item>
          <Form.Item name="identifier" label="Mã định danh"><Input /></Form.Item>
          <Form.Item name="taxCode" label="Mã số thuế"><Input /></Form.Item>
          <Form.Item name="logo" label="Logo">
            <Upload name="logo" listType="picture" showUploadList={false} customRequest={({ file, onSuccess }) => { onSuccess("ok"); handleLogoUpload({ file: { originFileObj: file } }); }}>
              <Button icon={<UploadOutlined />}>Tải logo</Button>
              {logoUrl && <img src={logoUrl} alt="logo" className="w-16 h-16 object-contain mt-2" />}
            </Upload>
          </Form.Item>
          {editingOrg && <Form.Item name="active" label="Trạng thái" valuePropName="checked"><Switch /></Form.Item>}
          <Form.Item><Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>Lưu</Button></Form.Item>
        </Form>
      </Modal>

      {/* Modal for Member Management */}
      <Modal
          title={`Quản lý thành viên: ${selectedOrg?.name}`}
          open={isMembersModalVisible}
          onCancel={() => setIsMembersModalVisible(false)}
          footer={null}
          width={800}
      >
          <Form form={addMemberForm} onFinish={handleAddMemberSubmit} layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item name="userId" rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}>
                  <Select
                      showSearch
                      placeholder="Tìm và chọn người dùng để thêm"
                      loading={loadingUsers}
                      style={{ width: 300 }}
                      filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  >
                      {userData?.filter(user => !selectedOrgData?.members.some(m => m.user._id === user._id))
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

          <Table
              columns={memberColumns}
              dataSource={selectedOrgData?.members || []}
              rowKey={(record) => record?.user?._id}
              loading={isLoadingSelectedOrg}
              pagination={false}
          />
      </Modal>
    </div>
  );
};

export default OrganizationList;
