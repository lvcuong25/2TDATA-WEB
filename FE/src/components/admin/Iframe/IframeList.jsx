import React, { useState, useContext, useEffect } from 'react';
import { Link } from "react-router-dom";
import instance from '../../../utils/axiosInstance-cookie-only';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Pagination, Select, Alert, Row, Col, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, LockOutlined, LinkOutlined, UserOutlined, GlobalOutlined, AppstoreOutlined, TeamOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { AuthContext } from '../../core/Auth';

const IframeList = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIframe, setEditingIframe] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSite, setSelectedSite] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const queryClient = useQueryClient();
  
  // Get current user context
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isSuperAdmin = authContext?.isSuperAdmin || false;
  const isSiteAdmin = currentUser?.role === 'site_admin';

  // Kiểm tra quyền truy cập
  const hasAccess = isSuperAdmin || isSiteAdmin;

  // Fetch iframe data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["IFRAME", currentPage, pageSize, searchValue],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(searchValue && { search: searchValue })
      });
      const { data } = await instance.get(`/iframe?${params}`);
      return data;
    },
    enabled: !!currentUser && hasAccess, // Only fetch if user is authenticated and has access
  });

  // Fetch user data for viewers select with site filtering
  const { data: userData, isLoading: loadingUsers } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const params = { limit: 1000 };
      const { data } = await instance.get(`/user`, { params });
      return data.docs || data.data?.docs || [];
    },
    enabled: !!currentUser && hasAccess, // Only fetch if user is authenticated and has access
  });

  // Fetch sites for super admin
  const { data: sitesData } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await instance.get("/sites");
      return data.docs || data.data || data;
    },
    enabled: isSuperAdmin,
  });

  // Create iframe mutation
  const createMutation = useMutation({
    mutationFn: (values) => instance.post('/iframe', values),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Thêm iframe thành công!');
      setIsModalVisible(false);
      setSelectedSite(null);
      form.resetFields();
    },
    onError: (error) => {
      // Kiểm tra lỗi access denied
      if (error?.response?.status === 403) {
        toast.error('Bạn không có quyền tạo iframe. Chỉ site admin và super admin mới có quyền này.');
      } else if (
        error?.response?.data?.message?.includes('duplicate key') ||
        error?.response?.data?.message?.includes('E11000') ||
        error?.response?.data?.message?.includes('domain')
      ) {
        toast.error('Tên miền đã tồn tại, vui lòng chọn tên khác!');
      } else {
        toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    },
  });

  // Update iframe mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => instance.put(`/iframe/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Cập nhật iframe thành công!');
      setIsModalVisible(false);
      setSelectedSite(null);
      form.resetFields();
      setEditingIframe(null);
    },
    onError: (error) => {
      // Kiểm tra lỗi access denied
      if (error?.response?.status === 403) {
        toast.error('Bạn không có quyền sửa iframe. Chỉ site admin và super admin mới có quyền này.');
      } else if (
        error?.response?.data?.message?.includes('duplicate key') ||
        error?.response?.data?.message?.includes('E11000') ||
        error?.response?.data?.message?.includes('domain')
      ) {
        toast.error('Tên miền đã tồn tại, vui lòng chọn tên khác!');
      } else {
        toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    },
  });

  // Delete iframe mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/iframe/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Xóa iframe thành công!');
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        toast.error('Bạn không có quyền xóa iframe. Chỉ site admin và super admin mới có quyền này.');
      } else {
        toast.error('Có lỗi xảy ra khi xóa: ' + (error.response?.data?.message || error.message));
      }
    },
  });

  const handleAdd = () => {
    setEditingIframe(null);
    setSelectedSite(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingIframe(record);
    const siteId = record.site_id?._id || record.site_id;
    setSelectedSite(siteId);
    form.setFieldsValue({
      ...record,
      viewers: record.viewers?.map(u => typeof u === 'string' ? u : u._id),
      site_id: siteId
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = (values) => {
    if (editingIframe) {
      updateMutation.mutate({ id: editingIframe._id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleSiteChange = (value) => {
    setSelectedSite(value);
    // Clear viewers when site changes
    form.setFieldsValue({ viewers: undefined });
  };

  // Filter users by selected site
  const filteredUsers = React.useMemo(() => {
    if (!userData) return [];
    
    if (selectedSite) {
      return userData.filter(user => {
        const userSiteId = user.site_id?._id || user.site_id;
        const matches = userSiteId?.toString() === selectedSite?.toString();
        console.log('Filtering user:', user.name, 'Site ID:', userSiteId, 'Selected:', selectedSite, 'Match:', matches);
        return matches;
      });
    }
    
    return userData;
  }, [userData, selectedSite]);

  // Debug effect
  useEffect(() => {
    if (selectedSite && userData) {
      console.log('Debug: Selected site changed to:', selectedSite);
      console.log('Debug: Total users:', userData.length);
      console.log('Debug: Filtered users:', filteredUsers?.length);
      console.log('Debug: Sample user data:', userData[0]);
    }
  }, [selectedSite, userData, filteredUsers]);

  // Hiển thị thông báo không có quyền truy cập
  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert
          message="Không có quyền truy cập"
          description="Chỉ site admin và super admin mới có quyền truy cập quản lý iframe. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <div className="text-center py-10">
          <LockOutlined className="text-5xl text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quyền truy cập bị từ chối</h3>
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập vào trang quản lý iframe.</p>
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi access denied từ API
  if (error?.response?.status === 403) {
    return (
      <div className="p-6">
        <Alert
          message="Không có quyền truy cập"
          description={error.response?.data?.message || "Chỉ site admin và super admin mới có quyền truy cập quản lý iframe."}
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <div className="text-center py-10">
          <LockOutlined className="text-5xl text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quyền truy cập bị từ chối</h3>
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập vào trang quản lý iframe.</p>
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title) => (
        <div className="flex items-center">
          <AppstoreOutlined className="mr-2 text-blue-500" />
          <span className="font-medium">{title}</span>
        </div>
      ),
    },
    {
      title: 'Site',
      dataIndex: 'site_id',
      key: 'site_id',
      width: 120,
      render: (siteId) => {
        const site = sitesData?.find(s => s._id === siteId);
        return site ? (
          <div className="flex items-center">
            <GlobalOutlined className="mr-1 text-green-500" />
            <span>{site.name}</span>
          </div>
        ) : "N/A";
      },
      hidden: !isSuperAdmin,
    },
    {
      title: 'Tên miền',
      dataIndex: 'domain',
      key: 'domain',
      ellipsis: true,
      render: (domain, record) => {
        // Get the site for this iframe
        const site = sitesData?.find(s => s._id === record.site_id);
        const siteDomain = site?.domains?.[0]; // Use first domain from site
        
        // Use site domain if available, otherwise fallback to current origin
        const baseUrl = siteDomain ? `https://${siteDomain}` : window.location.origin;
        const fullUrl = `${baseUrl}/${domain}`;
        
        return domain ? (
          <div className="flex items-center gap-2">
            <LinkOutlined className="text-blue-500" />
            <Link
              to={`/${domain}`}
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer truncate max-w-xs block"
              title={fullUrl}
            >
              {fullUrl}
            </Link>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(fullUrl);
                toast.success('Đã copy domain!');
              }}
              title="Copy domain"
            />
          </div>
        ) : (
          <span className="text-gray-400">Chưa đặt</span>
        );
      },
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url) => (
        <div className="flex items-center">
          <LinkOutlined className="mr-1 text-purple-500" />
          <span className="truncate max-w-xs" title={url}>
            {url || 'Chưa đặt'}
          </span>
        </div>
      ),
    },
    {
      title: 'Người xem',
      dataIndex: 'viewers',
      key: 'viewers',
      render: (viewers) => {
        if (!viewers || viewers.length === 0) {
          return (
            <div className="flex items-center text-gray-400">
              <UserOutlined className="mr-1" />
              <span>Không có</span>
            </div>
          );
        }
        return (
          <div className="flex items-center">
            <TeamOutlined className="mr-1 text-green-500" />
            <span className="truncate max-w-xs" title={viewers.map(viewer => 
              typeof viewer === 'string' ? viewer : viewer.name || viewer.email
            ).join(', ')}>
              {viewers.map(viewer => 
                typeof viewer === 'string' ? viewer : viewer.name || viewer.email
              ).join(', ')}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            title="Sửa iframe"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa iframe này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
              title="Xóa iframe"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Iframe</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Thêm Iframe
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Tìm kiếm iframe..."
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
        columns={columns.filter(col => !col.hidden)}
        dataSource={data?.docs || []}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
        className="bg-white rounded-lg shadow-sm"
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
              `${range[0]}-${range[1]} của ${total} iframe`
            }
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center">
            <AppstoreOutlined className="mr-2 text-blue-500" />
            <span>{editingIframe ? "Sửa Iframe" : "Thêm Iframe"}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedSite(null);
        }}
        footer={null}
        width={800}
        bodyStyle={{ padding: 16 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            {/* Left Column - Basic Information */}
            <Col span={12}>
              <Card title="Thông tin cơ bản" className="mb-3">
                <Form.Item
                  name="title"
                  label={
                    <span>
                      <AppstoreOutlined className="mr-1" />
                      Tiêu đề
                    </span>
                  }
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                  help="Nhập tiêu đề cho iframe"
                >
                  <Input placeholder="Tiêu đề iframe" />
                </Form.Item>

                <Form.Item
                  name="domain"
                  label={
                    <span>
                      <LinkOutlined className="mr-1" />
                      Tên miền
                    </span>
                  }
                  rules={[{ required: true, message: 'Vui lòng nhập tên miền!' }]}
                  help="Nhập tên miền cho iframe (ví dụ: example)"
                >
                  <Input placeholder="example" />
                </Form.Item>

                <Form.Item
                  name="url"
                  label={
                    <span>
                      <LinkOutlined className="mr-1" />
                      URL
                    </span>
                  }
                  rules={[{ required: true, message: 'Vui lòng nhập URL!' }]}
                  help="Nhập URL đầy đủ của iframe"
                >
                  <Input placeholder="https://example.com" />
                </Form.Item>
              </Card>
            </Col>

            {/* Right Column - Site & Permissions */}
            <Col span={12}>
              <Card title="Phân quyền & Site" className="mb-3">
                {isSuperAdmin && (
                  <Form.Item
                    name="site_id"
                    label={
                      <span>
                        <GlobalOutlined className="mr-1" />
                        Site
                      </span>
                    }
                    help="Chọn site cho iframe (tùy chọn)"
                  >
                    <Select
                      placeholder="Chọn site"
                      allowClear
                      loading={!sitesData}
                      onChange={handleSiteChange}
                      value={selectedSite}
                      showSearch
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
                )}

                <Form.Item
                  name="viewers"
                  label={
                    <span>
                      <TeamOutlined className="mr-1" />
                      Người xem
                    </span>
                  }
                  help={selectedSite ? "Chọn người xem từ site đã chọn" : "Chọn người xem iframe"}
                >
                  <Select
                    mode="multiple"
                    placeholder={
                      selectedSite 
                        ? `Chọn người xem từ site này (${filteredUsers?.length || 0} người dùng)`
                        : "Chọn người xem"
                    }
                    allowClear
                    loading={loadingUsers}
                    notFoundContent={filteredUsers?.length === 0 ? "Không có người dùng nào trong site này" : "Không tìm thấy"}
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
            </Col>
          </Row>

          <div className="flex justify-end mt-3">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={createMutation.isPending || updateMutation.isPending}
                size="large"
              >
                {editingIframe ? 'Cập nhật' : 'Thêm'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default IframeList;
