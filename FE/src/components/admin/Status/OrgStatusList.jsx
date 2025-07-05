import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Space, Table, Button, Popconfirm, Tag, Modal, Input, Form, Descriptions, Avatar, Select } from "antd";
import { toast } from "react-toastify";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";
import LinkFieldArray from '../shared/LinkFieldArray';
import { useNavigate } from "react-router-dom";

const OrgStatusList = () => {
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
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const navigate = useNavigate();

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
    queryKey: ["PENDING_ORG_SERVICES", debouncedSearchText, statusFilter, pagination.current, pagination.pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchText) params.append('search', debouncedSearchText);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', pagination.current);
      params.append('limit', pagination.pageSize);
      const { data } = await instance.get(`/organization/pending?${params.toString()}`);
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => instance.put(`/organization/services/${id}/approve`, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_ORG_SERVICES"]);
      toast.success("Đã xác nhận dịch vụ cho tổ chức thành công!");
    },
    onError: (error) => {
      toast.error("Không thể xác nhận dịch vụ: " + error.message);
    },
  });

  const updateLinksMutation = useMutation({
    mutationFn: (data) => instance.put(`/organization/services/${data.id}/links`, {
      links: data.links,
      link_update: data.link_update
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_ORG_SERVICES"]);
      toast.success("Đã cập nhật link thành công!");
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error("Không thể cập nhật link: " + (error.response?.data?.message || error.message));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => instance.put(`/organization/services/${id}/approve`, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_ORG_SERVICES"]);
      toast.success("Đã từ chối dịch vụ!");
    },
    onError: (error) => {
      toast.error("Không thể từ chối dịch vụ: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/organization/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["PENDING_ORG_SERVICES"]);
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
      const { data } = await instance.get(`/organization/services/${record._id}`);
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
      title: "Tổ chức",
      dataIndex: "organization",
      key: "organization",
      render: (org) => (
        <div>
          <div className="font-medium">{org?.name || 'N/A'}</div>
          <div className="text-sm text-gray-500">{org?.email || 'N/A'}</div>
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
      <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4 mb-6">
        <span className="text-xl font-semibold text-gray-800">
          Danh sách yêu cầu dịch vụ của tổ chức
        </span>
        <Button
          type="default"
          onClick={() => navigate("/admin/status")}
          className="ml-4"
        >
          Quay lại
        </Button>
      </div>
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <Input
              placeholder="Tìm kiếm theo tên tổ chức hoặc tên/slug dịch vụ"
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
        title={isEditMode ? "Chỉnh sửa dịch vụ của tổ chức" : "Xác nhận dịch vụ của tổ chức"}
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
          {selectedService && selectedService.organization && (
            <Descriptions title="Thông tin tổ chức" bordered column={1} size="small" className="mb-4">
              <Descriptions.Item label="Tên tổ chức">{selectedService.organization?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedService.organization?.email || 'N/A'}</Descriptions.Item>
              {selectedService.organization?.phone && <Descriptions.Item label="Điện thoại">{selectedService.organization.phone}</Descriptions.Item>}
              {selectedService.organization?.address && <Descriptions.Item label="Địa chỉ">{selectedService.organization.address}</Descriptions.Item>}
              {selectedService.organization?.logo && (
                <Descriptions.Item label="Logo">
                  <Avatar src={selectedService.organization.logo} size="large" />
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

export default OrgStatusList; 