import React, { useContext, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Tag, Input, Tooltip, Pagination, Space, Modal, Checkbox, Card, Spin, message, Row, Col, Avatar, Badge, Divider } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, AppstoreOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import instance from '../../utils/axiosInstance-cookie-only';
import { AuthContext } from '../core/Auth';

const ServiceOrganization = () => {
  // ===== Lấy thông tin user hiện tại =====
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
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
  const [serviceSearchText, setServiceSearchText] = useState('');

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
            src={service?.image && service.image.trim() !== ""
              ? service.image
              : 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
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
    setServiceSearchText('');
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
      setServiceSearchText('');
      // Refetch lại danh sách dịch vụ tổ chức
      queryClient.invalidateQueries(['organization', currentUser?._id]);
    } catch {
      toast.error('Không thể thêm dịch vụ');
    }
  };

  // Filter services based on search text
  const filteredServices = allServices.filter(service =>
    service.name?.toLowerCase().includes(serviceSearchText.toLowerCase()) ||
    service.slug?.toLowerCase().includes(serviceSearchText.toLowerCase()) ||
    service.description?.toLowerCase().includes(serviceSearchText.toLowerCase())
  );

  // ===== Render UI =====
  if (orgLoading) return <div className="p-4">Đang tải thông tin tổ chức...</div>;

  // Lấy danh sách dịch vụ đúng từ org
  const orgServicesRaw = org?.data?.services || org?.services || [];
  const orgServices = orgServicesRaw.filter(service => service.status === 'approved');
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
                  src={service?.image && service.image.trim() !== ""
              ? service.image
              : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"}
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
      
      {/* Modal thêm nhiều dịch vụ với giao diện đẹp */}
      <Modal
        open={isAddModalOpen}
        onOk={handleAddServices}
        onCancel={() => {
          setIsAddModalOpen(false);
          setSelectedServiceIds([]);
          setServiceSearchText('');
        }}
        okText="Thêm dịch vụ"
        cancelText="Hủy"
        okButtonProps={{ 
          disabled: !selectedServiceIds.length,
          className: 'bg-blue-600 hover:bg-blue-700'
        }}
        width={1400}
        destroyOnClose
        title={
          <div className="flex items-center gap-3">
            <AppstoreOutlined className="text-blue-600 text-xl" />
            <span className="text-lg font-semibold">Chọn dịch vụ để thêm vào tổ chức</span>
          </div>
        }
        bodyStyle={{ padding: '24px' }}
      >
        {loadingAllServices ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spin size="large" />
            <div className="mt-4 text-gray-600">Đang tải danh sách dịch vụ...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header với search và counter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm dịch vụ theo tên, slug hoặc mô tả..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={serviceSearchText}
                  onChange={(e) => setServiceSearchText(e.target.value)}
                  allowClear
                  size="large"
                  className="max-w-md"
                />
              </div>
                                            <div className="flex items-center gap-4">
                 <div className="relative">
                   <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium">
                     Đã chọn: {selectedServiceIds.length} dịch vụ
                   </div>
                   {selectedServiceIds.length > 0 && (
                     <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                       {selectedServiceIds.length}
                     </div>
                   )}
                 </div>
                 {selectedServiceIds.length > 0 && (
                   <Button 
                     type="text" 
                     size="small"
                     onClick={() => setSelectedServiceIds([])}
                     className="text-red-500 hover:text-red-700"
                   >
                     Bỏ chọn tất cả
                   </Button>
                 )}
               </div>
            </div>

            <Divider />

            {/* Grid dịch vụ */}
            {filteredServices.length === 0 ? (
              <div className="text-center py-16">
                <AppstoreOutlined className="text-6xl text-gray-300 mb-4" />
                <div className="text-xl font-medium text-gray-500 mb-2">
                  {serviceSearchText ? 'Không tìm thấy dịch vụ phù hợp' : 'Không có dịch vụ nào'}
                </div>
                <div className="text-gray-400">
                  {serviceSearchText ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng liên hệ admin để thêm dịch vụ'}
                </div>
              </div>
            ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-h-[50vh] overflow-y-auto pr-2">
                {filteredServices.map(service => {
                  const isSelected = selectedServiceIds.includes(service._id);
                  const hasLinks = service.authorizedLinks && service.authorizedLinks.length > 0;
                  
                  return (
                    <Card
                      key={service._id}
                      className={`
                        cursor-pointer transition-all duration-300 transform hover:scale-105
                        ${isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }
                      `}
                      onClick={() => {
                        setSelectedServiceIds(ids => 
                          isSelected 
                            ? ids.filter(id => id !== service._id) 
                            : [...ids, service._id]
                        );
                      }}
                      bodyStyle={{ padding: '20px' }}
                      hoverable
                    >
                      {/* Service Image */}
                      <div className="relative mb-4">
                        <img
                          src={service.image && service.image.trim() !== ""
              ? service.image
              : 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
                          alt={service.name}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        

                      </div>

                                               {/* Service Info */}
                       <div className="space-y-3">
                         <div>
                           <h3 className="font-semibold text-lg text-gray-800 mb-1 line-clamp-1">
                             {service.name}
                           </h3>
                         </div>

                         {service.description && (
                           <div className="text-sm text-gray-600 leading-relaxed overflow-hidden" style={{
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             textOverflow: 'ellipsis'
                           }}>
                             {service.description}
                           </div>
                         )}

                         {/* Status */}
                         <div className="flex items-center justify-end">
                           {isSelected && (
                             <Checkbox
                               checked={isSelected}
                               onChange={(e) => {
                                 e.stopPropagation();
                                 setSelectedServiceIds(ids => 
                                   isSelected 
                                     ? ids.filter(id => id !== service._id) 
                                     : [...ids, service._id]
                                 );
                               }}
                             />
                           )}
                         </div>
                       </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Footer info */}
            <Divider />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <InfoCircleOutlined />
              <span>
                Tìm thấy {filteredServices.length} dịch vụ 
                {serviceSearchText && ` phù hợp với "${serviceSearchText}"`}
              </span>
            </div>
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
            const response = await instance.put(`/organization/services/${serviceId}/links`, { links: newLinks });
            
            // Hiển thị thông báo thành công
            message.success(response.data?.message || 'Cập nhật chia sẻ thành công!');
            
            // Hiển thị thông báo iframe nếu có
            if (response.data?.iframeResults && response.data.iframeResults.length > 0) {
              const iframeMessages = response.data.iframeResults
                .filter(result => result.success)
                .map(result => {
                  if (result.action === 'add') {
                    return `✅ Đã thêm ${result.usersAffected} người vào iframe: ${result.url}`;
                  } else if (result.action === 'remove') {
                    return `🗑️ Đã gỡ ${result.usersAffected} người khỏi iframe: ${result.url}`;
                  }
                  return result.message;
                });
              
              if (iframeMessages.length > 0) {
                iframeMessages.forEach((msg, index) => {
                  setTimeout(() => {
                    message.info(msg, 4);
                  }, (index + 1) * 1000); // Hiển thị từng message với delay
                });
              }
            }
            
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