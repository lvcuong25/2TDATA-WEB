import React, { useState, useContext } from 'react';
import instance from '../../../utils/axiosInstance-cookie-only';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Pagination, Select, Switch, Tag, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, TeamOutlined, AppstoreOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, NumberOutlined, PictureOutlined, GlobalOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { uploadFileCloudinary } from '../libs/uploadImageCloud';
import { AuthContext } from '../../core/Auth';

const OrganizationList = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [logoUrl, setLogoUrl] = useState('');
  const [searchValue, setSearchValue] = useState("");
  const queryClient = useQueryClient();
  
  // Get current user context
  const { currentUser } = useContext(AuthContext);
  
  // Watch form values for filtering
  const [selectedSite, setSelectedSite] = useState(null);

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

  // Fetch sites for filtering
  const { data: sitesData } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data } = await instance.get('/sites', { params: { limit: 100 } });
      return data.data || [];
    },
  });

  // Filter users by selected site
  const filteredUsers = selectedSite 
    ? userData?.filter(user => {
        const userSiteId = user.site_id?._id || user.site_id;
        return userSiteId === selectedSite;
      })
    : userData;

  // Filter users by organization's site for member management
  const getFilteredUsersForMember = (orgSiteId) => {
    if (!orgSiteId) return userData;
    
    return userData?.filter(user => {
      const userSiteId = user.site_id?._id || user.site_id;
      return userSiteId === orgSiteId;
    });
  };

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

  // Logo upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadFileCloudinary,
    onSuccess: (data) => {
      setLogoUrl(data.url);
      setCloudinaryPublicId(data.public_id);
      form.setFieldsValue({ logo: data.url });
      toast.success('Tải logo tổ chức thành công!');
    },
    onError: (error) => {
      console.error("Error uploading image:", error);
      toast.error("Không thể tải logo lên");
    },
  });

  // State to store Cloudinary public_id for deletion
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState('');

  const handleAdd = () => {
    setEditingOrg(null);
    setLogoUrl('');
    setCloudinaryPublicId('');
    setSelectedSite(null);
    setIsModalVisible(true);
    // Reset form sau khi modal đã mở
    setTimeout(() => {
      form.resetFields();
    }, 100);
  };

  const handleEdit = (record) => {
    setEditingOrg(record);
    form.setFieldsValue({
      ...record,
      manager: typeof record.manager === 'object' ? record.manager?._id : record.manager,
      selectedSite: record.site_id?._id || record.site_id,
    });
    setLogoUrl(record.logo || '');
    setCloudinaryPublicId(record.logo_public_id || ''); // Load existing public_id
    setSelectedSite(record.site_id?._id || record.site_id); // Set selected site for editing
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (values) => {
    // Lọc bỏ selectedSite khỏi dữ liệu gửi lên backend
    const { selectedSite, ...otherValues } = values;
    
    const submitValues = { 
      ...otherValues, 
      logo: logoUrl,
      logo_public_id: cloudinaryPublicId, // Gửi public_id để backend lưu trữ
      site_id: selectedSite || currentUser?.site_id // Sử dụng selectedSite hoặc currentUser's site
    };
    
    console.log('Form values:', values);
    console.log('Selected site:', selectedSite);
    console.log('Current user site:', currentUser?.site_id);
    console.log('Submitting values:', submitValues); // Debug log
    
    // Kiểm tra xem có manager không
    if (!submitValues.manager) {
      toast.error('Vui lòng chọn người quản lý!');
      return;
    }
    
    if (editingOrg) {
      updateMutation.mutate({ id: editingOrg._id, values: submitValues });
    } else {
      createMutation.mutate(submitValues);
    }
  };

  const handleLogoChange = async ({ target }) => {
    if (target?.files?.length > 0) {
      const file = target?.files[0];
      setLogoUrl(URL.createObjectURL(file));
      uploadMutation.mutate(file);
    }
  };

  const handleRemoveLogo = async () => {
    // Clear the logo from form and state
    setLogoUrl('');
    form.setFieldsValue({ logo: '' });
    
    // Delete from Cloudinary if we have public_id
    if (cloudinaryPublicId) {
      try {
        // Note: This would require a backend endpoint to handle Cloudinary deletion
        // For now, we'll just clear the local state
        setCloudinaryPublicId('');
        toast.success('Đã xóa logo khỏi form');
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        toast.error('Lỗi khi xóa file khỏi Cloudinary');
      }
    } else {
      toast.success('Đã xóa logo khỏi form');
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
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 64,
      render: (logo) =>
        logo ? (
          <img
            src={logo}
            alt="Logo"
            style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, background: '#f5f5f5' }}
          />
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
    },
    {
      title: 'Tên tổ chức',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Site',
      dataIndex: 'site_id',
      key: 'site_id',
      render: (site) => {
        if (!site) return '---';
        if (typeof site === 'object') {
          const siteName = site.name || '---';
          const domain = site.domains?.[0];
          return (
            <div>
              <div className="font-medium">{siteName}</div>
              {domain && (
                <div className="text-xs text-gray-500">{domain}</div>
              )}
            </div>
          );
        }
        return '---';
      },
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
            if (record?.role === 'owner') return null;
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
        width={1000}
        bodyStyle={{ padding: 16 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={24}>
            {/* Left Column - Basic Information */}
            <Col span={12}>
              <Card title="Thông tin cơ bản" className="mb-3">
                <Form.Item name="name" label="Tên tổ chức" rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức!' }]} help="Nhập tên đầy đủ của tổ chức">
                  <Input placeholder="Tên tổ chức" prefix={<AppstoreOutlined />} />
                </Form.Item>
                
                <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ!' }]} help="Email liên hệ của tổ chức">
                  <Input placeholder="Email liên hệ" prefix={<MailOutlined />} />
                </Form.Item>
                
                <Form.Item name="phone" label="Số điện thoại" help="Số điện thoại liên hệ của tổ chức">
                  <Input placeholder="Số điện thoại liên hệ" prefix={<PhoneOutlined />} />
                </Form.Item>
                
                <Form.Item name="address" label="Địa chỉ" help="Địa chỉ tổ chức">
                  <Input placeholder="Địa chỉ tổ chức" prefix={<HomeOutlined />} />
                </Form.Item>
              </Card>

              <Card title="Thông tin pháp lý" className="mb-3">
                <Form.Item name="identifier" label="Mã định danh"
                  rules={[{ required: true, message: 'Vui lòng nhập mã định danh!' }, { pattern: /^\d{12}$/, message: 'Mã định danh phải gồm đúng 12 số!' }]}
                  help="Mã định danh tổ chức gồm đúng 12 số">
                  <Input placeholder="Ví dụ: 012345678901" maxLength={12} prefix={<IdcardOutlined />} />
                </Form.Item>
                
                <Form.Item name="taxCode" label="Mã số thuế"
                  rules={[{ pattern: /^(\d{10}|\d{13})$/, message: 'Mã số thuế phải gồm 10 hoặc 13 số!' }]}
                  help="Mã số thuế tổ chức gồm 10 hoặc 13 số (nếu có)">
                  <Input placeholder="Ví dụ: 0123456789 hoặc 0123456789012" maxLength={13} prefix={<NumberOutlined />} />
                </Form.Item>
              </Card>
            </Col>

            {/* Right Column - Management & Media */}
            <Col span={12}>
              <Card title="Quản lý & Phân quyền" className="mb-2">
                {/* Site Selection for Manager */}
                <Form.Item name="selectedSite" label={
                  <span>
                    <GlobalOutlined className="mr-1" />
                    Chọn site
                  </span>
                } help="Chọn site để lọc người quản lý (tùy chọn)">
                  <Select
                    placeholder="Chọn site để lọc người quản lý"
                    allowClear
                    showSearch
                    value={selectedSite}
                    onChange={(value) => {
                      setSelectedSite(value);
                      form.setFieldsValue({ selectedSite: value });
                    }}
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {sitesData?.map(site => (
                      <Select.Option key={site._id} value={site._id}>
                        {site.name}
                        {site.domains && site.domains.length > 0 && (
                          <span className="text-gray-500 text-sm ml-2">
                            ({site.domains[0]})
                          </span>
                        )}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Form.Item name="manager" label="Quản lý" rules={[{ required: true, message: 'Vui lòng chọn quản lý!' }]} help="Chọn người quản lý tổ chức">
                  <Select 
                    placeholder={
                      selectedSite 
                        ? `Chọn quản lý từ site đã chọn (${filteredUsers?.length || 0} người dùng)`
                        : <><TeamOutlined /> Chọn quản lý</>
                    } 
                    loading={loadingUsers} 
                    showSearch 
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  >
                    {filteredUsers?.map(user => (
                      <Select.Option key={user._id} value={user._id} label={user.name || user.email}>
                        {user.name || user.email}
                        {user.site_id?.name && (
                          <span className="text-gray-500 text-sm ml-2">
                            - {user.site_id.name}
                          </span>
                        )}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>

              <Card title="Logo & Trạng thái">
                <Form.Item name="logo" label="Logo tổ chức">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 mb-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:border-blue-400 transition-colors">
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt="Logo tổ chức" 
                            className="w-full h-full object-contain rounded-lg" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              toast.error('Không thể hiển thị logo');
                            }}
                          />
                        ) : (
                          <PictureOutlined className="text-3xl text-gray-400" />
                        )}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Button 
                          type="primary"
                          icon={<PictureOutlined />}
                          onClick={() => {
                            const fileInput = document?.getElementById('logo-file');
                            if (fileInput) {
                              fileInput.click();
                            }
                          }}
                          loading={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? 'Đang tải...' : 'Tải logo tổ chức'}
                        </Button>
                        {logoUrl && (
                          <Button 
                            type="default"
                            danger
                            onClick={handleRemoveLogo}
                          >
                            Xóa logo
                          </Button>
                        )}
                      </div>
                      <input 
                        type="file" 
                        id="logo-file" 
                        accept="image/jpg, image/jpeg, image/png, image/gif, image/webp" 
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                      {logoUrl && (
                        <div className="flex items-center text-sm text-green-600">
                          <span className="mr-1">✓</span>
                          Logo đã tải thành công
                        </div>
                      )}
                    </div>
                  </div>
                </Form.Item>
                
                {editingOrg && (
                  <Form.Item name="active" label="Trạng thái hoạt động" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                )}
              </Card>
            </Col>
          </Row>

          <div className="flex justify-end mt-3">
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} size="large">
              {editingOrg ? 'Cập nhật' : 'Tạo tổ chức'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal for Member Management */}
      <Modal
          title={
              <div className="flex items-center">
                  <TeamOutlined className="mr-2 text-blue-500" />
                  <span>Quản lý thành viên: {selectedOrg?.name}</span>
              </div>
          }
          open={isMembersModalVisible}
          onCancel={() => setIsMembersModalVisible(false)}
          footer={null}
          width={1000}
          bodyStyle={{ padding: 12 }}
      >
          <Card title="Thêm thành viên mới" className="mb-3" size="small">
              <Form form={addMemberForm} onFinish={handleAddMemberSubmit} layout="inline">
                  {/* Show organization's site info */}
                  <div className="mb-3 p-2 bg-blue-50 rounded border">
                      <div className="text-sm text-gray-600">
                          <GlobalOutlined className="mr-1" />
                          <strong>Site của tổ chức:</strong> {selectedOrg?.site_id?.name || 'N/A'}
                          {selectedOrg?.site_id?.domains?.[0] && (
                              <span className="text-gray-500 ml-2">({selectedOrg.site_id.domains[0]})</span>
                          )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                          Chỉ có thể thêm người dùng từ cùng site với tổ chức
                      </div>
                  </div>
                  
                  <Form.Item name="userId" rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}>
                      <Select
                          showSearch
                          placeholder="Tìm và chọn người dùng từ cùng site"
                          loading={loadingUsers}
                          style={{ width: 300 }}
                          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                      >
                          {(() => {
                              // Get organization's site ID
                              const orgSiteId = selectedOrg?.site_id?._id || selectedOrg?.site_id;
                              
                              // Filter users by organization's site
                              const usersFromOrgSite = getFilteredUsersForMember(orgSiteId);
                              
                              // Filter out users who are already members
                              const availableUsers = usersFromOrgSite?.filter(user => 
                                  !selectedOrgData?.members.some(m => m.user._id === user._id)
                              );
                              
                              return availableUsers?.map(user => (
                                  <Select.Option key={user._id} value={user._id} label={`${user.name} (${user.email})`}>
                                      {user.name} ({user.email})
                                      {user.site_id?.name && (
                                          <span className="text-gray-500 text-sm ml-2">
                                              - {user.site_id.name}
                                          </span>
                                      )}
                                  </Select.Option>
                              ));
                          })()}
                      </Select>
                  </Form.Item>
                  <Form.Item name="role" initialValue="member">
                      <Select style={{ width: 120 }}>
                          <Select.Option value="manager">Manager</Select.Option>
                          <Select.Option value="member">Member</Select.Option>
                      </Select>
                  </Form.Item>
                  <Form.Item>
                      <Button type="primary" htmlType="submit" loading={addMemberMutation.isLoading} icon={<PlusOutlined />}>
                          Thêm thành viên
                      </Button>
                  </Form.Item>
              </Form>
          </Card>

          <Card title="Danh sách thành viên hiện tại" size="small">
              <Table
                  columns={memberColumns}
                  dataSource={selectedOrgData?.members || []}
                  rowKey={(record) => record?.user?._id}
                  loading={isLoadingSelectedOrg}
                  pagination={false}
                  size="middle"
              />
          </Card>
      </Modal>
    </div>
  );
};

export default OrganizationList;
