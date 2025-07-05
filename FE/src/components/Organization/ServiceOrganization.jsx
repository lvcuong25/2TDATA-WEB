import React, { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Input, Tooltip, Pagination, Space, Modal, Checkbox, Card, Spin, message, Row, Col, Avatar } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import instance from '../../utils/axiosInstance';
import { AuthContext } from '../core/Auth';

const ServiceOrganization = () => {
  // ===== Lấy thông tin user hiện tại =====
  const { currentUser } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [loadingAllServices, setLoadingAllServices] = useState(false);
  const [shareModal, setShareModal] = useState({ open: false, link: null, record: null });
  const [selectedShareUsers, setSelectedShareUsers] = useState([]);

  // ===== Lấy thông tin tổ chức của user =====
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const res = await instance.get(`organization/user/${currentUser._id}`);
      return res;
    },
  });

  // ===== Định nghĩa cột cho bảng dịch vụ =====
  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
      render: (service) => (
        <div className="flex items-center gap-2">
          <img
            src={service?.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
            alt={service?.name || 'Service image'}
            className="w-10 h-10 object-cover rounded"
          />
          <div>
            <div className="font-medium">{service?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{service?.slug || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Kết nối',
      key: 'connect',
      width: 120,
      render: (_, record) => {
        const links = record.service?.authorizedLinks || [];
        const hasLink = links.length > 0;
        return (
          <Button
            type="primary"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              if (hasLink) {
                window.open(links[0].url, '_blank');
              } else {
                toast.info('Dịch vụ này chưa có link kết nối.');
              }
            }}
          >
            Kết nối <span style={{ marginLeft: 4 }}>→</span>
          </Button>
        );
      },
    },
  ];

  // State và hàm cập nhật link cho bảng kết quả (giống MyService.jsx)
  const handleUpdateLinks = async (record) => {
    setUpdatingServiceId(record._id);
    try {
      if (record.link_update && record.link_update.length > 0) {
        await Promise.all(
          record.link_update.map(link => {
            if (link.url) {
              return fetch(link.url, { method: 'POST' });
            }
            return null;
          })
        );
      }
    } catch (error) {
      console.error('Error updating links:', error);
    } finally {
      setTimeout(() => {
        setUpdatingServiceId(null);
      }, 15000);
    }
  };

  // Fetch all services when open modal
  const handleOpenAddModal = async () => {
    setIsAddModalOpen(true);
    if (allServices.length === 0) {
      setLoadingAllServices(true);
      try {
        const { data } = await instance.get('/service?limit=1000');
        setAllServices(data.docs || data.data?.docs || []);
      } catch {
        toast.error('Không thể tải danh sách dịch vụ');
      } finally {
        setLoadingAllServices(false);
      }
    }
  };

  // Gửi API thêm nhiều dịch vụ
  const handleAddServices = async () => {
    if (!selectedServiceIds.length) return;
    try {
      await instance.post(`/organization/${org?.data?._id}/services`, {
        serviceId: selectedServiceIds
      });
      toast.success('Đã thêm dịch vụ thành công!');
      setIsAddModalOpen(false);
      setSelectedServiceIds([]);
      // Refetch lại danh sách dịch vụ tổ chức
      queryClient.invalidateQueries(['organization', currentUser?._id]);
    } catch {
      toast.error('Không thể thêm dịch vụ');
    }
  };

  // ===== Render UI =====
  if (orgLoading) return <div className="p-4">Đang tải thông tin tổ chức...</div>;

  // Lấy danh sách dịch vụ đúng từ org
  const orgServices = org?.data?.services || org?.services || [];
  const paginatedServices = orgServices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const members = (org?.data?.members || org?.members || []);
  const uniqueMembers = Array.from(
    new Map(members.map(m => [m.user._id, m])).values()
  );
  // Lọc bỏ owner/manager
  const shareableMembers = uniqueMembers.filter(m => m.role !== 'owner' && m.role !== 'manager');
  const memberOptions = shareableMembers.map(m => ({
    label: m.user.name || m.user.email,
    value: m.user._id
  }));

  // Lọc link cho member ở FE (bổ sung bảo mật phía client)
  const isOwnerOrManager = ["owner", "manager"].includes(currentUser?.role) || org?.data?.manager?._id === currentUser?._id;
  const filteredOrgServices = isOwnerOrManager
    ? orgServices.filter(s => s.link && s.link.length > 0)
    : orgServices.map(service => ({
        ...service,
        link: Array.isArray(service.link)
          ? service.link.filter(l => l.visible !== false && (Array.isArray(l.visibleFor) && l.visibleFor.includes(currentUser._id)))
          : service.link
      })).filter(s => s.link && s.link.length > 0);

  return (
    <div>
      {/* Tiêu đề, nút, search full width */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <span className="text-xl font-semibold text-gray-800 block">
          Danh sách dịch vụ của tổ chức
        </span>
        <div className="flex gap-2 flex-1 md:flex-none">
        <Input
          placeholder="Tìm kiếm theo tên/slug dịch vụ"
          prefix={<SearchOutlined />}
          value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-96"
          allowClear
        />
          <Button type="primary" className="bg-blue-600 min-w-[120px]" onClick={handleOpenAddModal}>
            Thêm dịch vụ
          </Button>
        </div>
      </div>
      {/* 2 bảng trong 1 khung lớn chia 2 grid */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Bảng dịch vụ bên trái */}
          <div className="md:col-span-2 min-w-0 rounded-lg border p-4 flex flex-col h-full bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Bảng dịch vụ</h3>
      <Table
        columns={columns}
              dataSource={paginatedServices}
        rowKey="_id"
              loading={orgLoading}
              pagination={false}
        scroll={{ x: 'max-content' }}
      />
            <div className="flex justify-end mt-2">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={orgServices.length}
                showSizeChanger
                pageSizeOptions={['10', '20', '50', '100']}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} mục`}
              />
            </div>
          </div>
          {/* Bảng kết quả bên phải */}
          <div className="md:col-span-3 min-w-0 rounded-lg border p-4 flex flex-col h-full bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Bảng kết quả</h3>
      <Table
        columns={[
          {
            title: "Dịch vụ",
            dataIndex: "service",
            key: "service",
            render: (service) => (
              <div className="flex items-center gap-2">
                <img
                  src={service?.image || "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"}
                  alt={service?.name}
                  className="w-10 h-10 object-cover rounded"
                />
                <div>
                  <div className="font-medium">{service?.name}</div>
                  <div className="text-sm text-gray-500">{service?.slug}</div>
                </div>
              </div>
            ),
          },
          {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => (
              <Tag color={
                status === "approved" ? "green" :
                status === "rejected" ? "red" : "orange"
              }>
                {status === "approved" ? "Đã xác nhận" :
                 status === "rejected" ? "Bị từ chối" : "Đang chờ"}
              </Tag>
            ),
          },
          {
            title: "Kết quả",
            dataIndex: "link",
            key: "resultLinks",
            render: (links, record) => {
              const members = org?.data?.members || org?.members || [];
              const isOwnerOrManager = ["owner", "manager"].includes(currentUser?.role) || org?.data?.manager?._id === currentUser?._id;
              return links && links.length > 0 ? (
                <Space direction="vertical">
                  {links.map((link, idx) => {
                    let sharedNames = "Tất cả thành viên";
                    if (link.visibleFor && Array.isArray(link.visibleFor) && link.visibleFor.length > 0) {
                      const sharedMembers = members.filter(m => link.visibleFor.includes(m.user._id));
                      sharedNames = sharedMembers.length > 0
                        ? sharedMembers.map(m => m.user.name || m.user.email).join(", ")
                        : "Không ai";
                    }
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Tooltip title={link.description || "Không có mô tả"}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {link.title}
                            </a>
                          </Tooltip>
                          {isOwnerOrManager && (
                            <Button size="small" onClick={() => {
                              setShareModal({ open: true, link, record });
                              setSelectedShareUsers(link.visibleFor || []);
                            }}>Chỉnh chia sẻ</Button>
                          )}
                        </div>
                        {isOwnerOrManager && (
                          <div className="text-xs text-gray-500 ml-2">
                            <b>Chia sẻ cho:</b> {sharedNames}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Space>
              ) : (
                "Chưa có link kết quả"
              );
            },
          },
          {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleDateString("vi-VN"),
          },
                {
                  title: "Thao tác",
                  key: "action",
                  render: (_, record) => (
                    <Button
                      type="primary"
                      onClick={() => handleUpdateLinks(record)}
                      loading={updatingServiceId === record._id}
                    >
                      {updatingServiceId === record._id ? "Đang cập nhật..." : "Cập nhật"}
                    </Button>
                  ),
                },
              ]}
              dataSource={filteredOrgServices}
        rowKey={record => record._id}
        className="mt-10"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} dịch vụ có kết quả`,
        }}
      />
          </div>
        </div>
      </div>
      {/* Modal thêm nhiều dịch vụ dạng card */}
      <Modal
        open={isAddModalOpen}
        onOk={handleAddServices}
        onCancel={() => setIsAddModalOpen(false)}
        okText="Thêm dịch vụ"
        cancelText="Hủy"
        okButtonProps={{ disabled: !selectedServiceIds.length }}
        width={900}
        destroyOnClose
        title="Chọn dịch vụ để thêm vào tổ chức"
      >
        {loadingAllServices ? (
          <div className="text-center py-8"><Spin /> Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {allServices.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">Không có dịch vụ nào</div>
            ) : (
              allServices.map(s => {
                  const checked = selectedServiceIds.includes(s._id);
                  return (
                  <Card
                      key={s._id}
                    className={`cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col items-center ${checked ? 'border-blue-500 ring-2 ring-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}
                      onClick={() => {
                        setSelectedServiceIds(ids => checked ? ids.filter(id => id !== s._id) : [...ids, s._id]);
                      }}
                    bordered
                    >
                      <img
                        src={s.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
                        alt={s.name}
                        className="w-20 h-20 object-cover rounded mb-2 border"
                      />
                      <div className="font-semibold text-base text-center mb-1">{s.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{s.slug}</div>
                      <div className="text-xs text-gray-700 mb-2 line-clamp-2 text-center" style={{ minHeight: 32 }}>{s.description || 'Không có mô tả'}</div>
                    <Checkbox
                        checked={checked}
                        onChange={e => {
                          e.stopPropagation();
                          setSelectedServiceIds(ids => checked ? ids.filter(id => id !== s._id) : [...ids, s._id]);
                        }}
                        className="mt-2"
                      />
                      <span className="text-xs mt-1">{checked ? 'Đã chọn' : 'Chọn'}</span>
                  </Card>
                  );
                })
            )}
          </div>
        )}
      </Modal>
      {/* Modal chỉnh chia sẻ link */}
      <Modal
        open={shareModal.open}
        onCancel={() => setShareModal({ open: false, link: null, record: null })}
        onOk={async () => {
          // Gọi API cập nhật visibleFor cho link này
          try {
            const serviceId = shareModal.record?._id;
            // Lấy danh sách link mới
            const newLinks = (shareModal.record?.link || []).map(l =>
              l.url === shareModal.link.url ? { ...l, visibleFor: selectedShareUsers } : l
            );
            await instance.put(`/organization/services/${serviceId}/links`, { links: newLinks });
            message.success('Cập nhật chia sẻ thành công!');
            setShareModal({ open: false, link: null, record: null });
            queryClient.invalidateQueries(['organization', currentUser?._id]);
          } catch {
            message.error('Cập nhật chia sẻ thất bại!');
          }
        }}
        title="Chỉnh chia sẻ link cho thành viên"
        okText="Lưu chia sẻ"
        cancelText="Hủy"
        width={900}
      >
        <div style={{ marginBottom: 12 }}>
          <Row gutter={[16, 16]}>
            {memberOptions.map(opt => (
              <Col xs={24} sm={12} md={8} lg={8} key={opt.value}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 56,
                  background: '#fafbfc',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: '0 12px',
                  margin: 0,
                  boxSizing: 'border-box',
                  width: '100%'
                }}>
                  <Checkbox
                    checked={selectedShareUsers.includes(opt.value)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedShareUsers(prev => [...prev, opt.value]);
                      } else {
                        setSelectedShareUsers(prev => prev.filter(id => id !== opt.value));
                      }
                    }}
                    style={{ fontSize: 16, marginRight: 12, marginLeft: 0 }}
                  />
                  <Avatar size={32} src={shareableMembers.find(m => m.user._id === opt.value)?.user.avatar} style={{ marginRight: 12 }}>
                    {(opt.label || '').charAt(0).toUpperCase()}
                  </Avatar>
                  <span style={{ fontWeight: 500, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                </div>
              </Col>
            ))}
          </Row>
        </div>
        <div className="text-xs text-gray-500 mt-2">Không chọn ai thì không thành viên nào được xem link (chỉ owner/manager thấy).</div>
      </Modal>
    </div>
  );
};

export default ServiceOrganization;