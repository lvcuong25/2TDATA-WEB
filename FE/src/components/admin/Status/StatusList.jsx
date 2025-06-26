import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Space, Table, Button, Popconfirm, Tag, Modal, Input, Form, Descriptions, Avatar, Select, Row, Col, Badge } from "antd";
import { toast } from "react-toastify";
import { CheckOutlined, CloseOutlined, PlusOutlined, DeleteOutlined, EditOutlined, LinkOutlined, SearchOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";
import LinkFieldArray from '../shared/LinkFieldArray';

const StatusList = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [form] = Form.useForm();
  const [links, setLinks] = useState([]);
  const [linkUpdates, setLinkUpdates] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (isModalOpen && selectedService) {
      const initialLinks = selectedService.link?.length ? selectedService.link : [];
      setLinks(initialLinks);
      
      const initialLinkUpdates = selectedService.link_update?.length ? selectedService.link_update : [];
      setLinkUpdates(initialLinkUpdates);

      form.resetFields();
      
      const formValues = {};
      initialLinks.forEach((link, index) => {
        formValues[`link_url_${index}`] = link.url || '';
        formValues[`link_title_${index}`] = link.title || '';
        formValues[`link_description_${index}`] = link.description || '';
      });
      initialLinkUpdates.forEach((link, index) => {
        formValues[`link_update_url_${index}`] = link.url || '';
        formValues[`link_update_title_${index}`] = link.title || '';
        formValues[`link_update_description_${index}`] = link.description || '';
      });
      form.setFieldsValue(formValues);

    } else if (!isModalOpen) {
      setSelectedService(null);
      setIsEditMode(false);
      form.resetFields();
      setLinks([]);
      setLinkUpdates([]);
    }
  }, [isModalOpen, selectedService, form]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["PENDING_SERVICES", debouncedSearchText, statusFilter, pagination.current, pagination.pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchText) params.append('search', debouncedSearchText);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.current);
      params.append('limit', pagination.pageSize);
      const { data } = await instance.get(`/requests/pending?${params.toString()}`);
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => instance.put(`/requests/${id}/approve`, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_SERVICES"]);
      toast.success("Đã xác nhận dịch vụ thành công!");
    },
    onError: (error) => {
      toast.error("Không thể xác nhận dịch vụ: " + error.message);
    },
  });

  const updateLinksMutation = useMutation({
    mutationFn: (data) => instance.put(`/requests/${data.id}/links`, { 
      links: data.links,
      link_update: data.link_update
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_SERVICES"]);
      toast.success("Đã cập nhật link thành công!");
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error("Không thể cập nhật link: " + (error.response?.data?.message || error.message));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => instance.put(`/requests/${id}/approve`, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_SERVICES"]);
      toast.success("Đã từ chối dịch vụ!");
    },
    onError: (error) => {
      toast.error("Không thể từ chối dịch vụ: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_SERVICES"]);
      toast.success("Đã xóa dịch vụ thành công!");
    },
    onError: (error) => {
      toast.error("Không thể xóa dịch vụ: " + error.message);
    },
  });

  const handleApprove = (record) => {
    setSelectedService(record);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = async (record) => {
    try {
      const { data } = await instance.get(`/requests/${record._id}`);
      setSelectedService({ ...record, ...data.data });
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Không thể lấy thông tin dịch vụ: " + error.message);
    }
  };

  const handleReject = (id) => {
    rejectMutation.mutate(id);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleModalOk = async () => {
    try {
      await form.validateFields();
      
      const validLinks = links.filter(link => link.url && link.url.trim() !== '' && link.title && link.title.trim() !== '');
      const validLinkUpdates = linkUpdates.filter(link => link.url && link.url.trim() !== '' && link.title && link.title.trim() !== '');

      if (isEditMode) {
        updateLinksMutation.mutate({ 
          id: selectedService._id, 
          links: validLinks,
          link_update: validLinkUpdates
        });
      } else {
        await approveMutation.mutateAsync(selectedService._id);
        
        updateLinksMutation.mutate({ 
          id: selectedService._id, 
          links: validLinks,
          link_update: validLinkUpdates
        });
      }
    } catch (error) {
      console.error('Validation failed:', error);
      toast.error("Vui lòng điền đầy đủ thông tin các link!");
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
    },
    {
      title: "Mã",
      dataIndex: "_id",
      key: "_id",
      ellipsis: true,
      width: 80
    },
    {
      title: "Người dùng",
      dataIndex: "user",
      key: "user",
      render: (user) => (
        <div>
          <div className="font-medium">{user?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      dataIndex: "service",
      key: "service",
      render: (service) => {
        return (
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
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={
          status === 'approved' ? 'green' : 
          status === 'rejected' ? 'red' : 
          'orange'
        }>
          {status === 'approved' ? 'Đã xác nhận' : 
           status === 'rejected' ? 'Bị từ chối' : 
           'Đang chờ'}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'waiting' && (
            <>
              <Popconfirm
                title="Xác nhận dịch vụ này?"
                onConfirm={() => handleApprove(record)}
                okText="Có"
                cancelText="Không"
              >
                <Button 
                  icon={<CheckOutlined />} 
                  type="primary"
                  className="bg-green-500 hover:bg-green-600"
                />
              </Popconfirm>
              <Popconfirm
                title="Từ chối dịch vụ này?"
                onConfirm={() => handleReject(record._id)}
                okText="Có"
                cancelText="Không"
              >
                <Button 
                  icon={<CloseOutlined />} 
                  danger
                />
              </Popconfirm>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="primary"
              className="bg-blue-500 hover:bg-blue-600"
            >
            </Button>
          )}
          {record.status !== 'waiting' && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa dịch vụ này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button 
                icon={<DeleteOutlined />} 
                danger
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (error) return <div className="p-4">Error: {error.message}</div>;
  
  return (
    <div>
      <h2 className="ant-space css-dev-only-do-not-override-1uq9j6g ant-space-horizontal ant-space-align-center ant-space-gap-row-small ant-space-gap-col-small font-semibold text-lg rounded-md bg-[#E9E9E9] w-full p-4 my-8">
        Danh sách yêu cầu dịch vụ
      </h2>
      
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <Input
              placeholder="Tìm kiếm theo tên/email người dùng hoặc tên/slug dịch vụ"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-96"
              allowClear
            />
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              value={statusFilter}
              onChange={handleStatusChange}
              className="w-40"
              options={[
                { value: 'waiting', label: 'Đang chờ' },
                { value: 'approved', label: 'Đã xác nhận' },
                { value: 'rejected', label: 'Bị từ chối' }
              ]}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data?.docs}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            ...pagination,
            total: data?.data?.totalDocs,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: "max-content" }}
        />
      </div>

      <Modal
        title={isEditMode ? "Chỉnh sửa dịch vụ" : "Xác nhận dịch vụ"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={isEditMode ? "Cập nhật" : "Xác nhận và Cập nhật link"}
        cancelText="Hủy"
        confirmLoading={approveMutation.isPending || updateLinksMutation.isPending}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {selectedService && selectedService.user && (
            <Descriptions title="Thông tin người dùng" bordered column={1} size="small" className="mb-4">
              <Descriptions.Item label="Tên">{selectedService.user?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedService.user?.email || 'N/A'}</Descriptions.Item>
              {selectedService.user?.phone && <Descriptions.Item label="Điện thoại">{selectedService.user.phone}</Descriptions.Item>}
              {selectedService.user?.address && <Descriptions.Item label="Địa chỉ">{selectedService.user.address}</Descriptions.Item>}
              {selectedService.user?.avatar && (
                <Descriptions.Item label="Avatar">
                  <Avatar src={selectedService.user.avatar} size="large" />
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
          
          <LinkFieldArray 
            title="Danh sách link chính"
            links={links}
            onLinksChange={setLinks}
            form={form}
            fieldNamePrefix="link"
          />

          <LinkFieldArray 
            title="Danh sách link cập nhật"
            links={linkUpdates}
            onLinksChange={setLinkUpdates}
            form={form}
            fieldNamePrefix="link_update"
          />
        </Form>
      </Modal>
    </div>
  );
};

export default StatusList;