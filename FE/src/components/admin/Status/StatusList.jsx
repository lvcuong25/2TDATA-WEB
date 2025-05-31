import React from 'react';
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Space, Table, Button, Popconfirm, Tag } from "antd";
import { toast } from "react-toastify";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";

const StatusList = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["PENDING_SERVICES"],
    queryFn: async () => {
      const { data } = await instance.get(`/requests/pending`);
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

  const handleApprove = (id) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id) => {
    rejectMutation.mutate(id);
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Mã",
      dataIndex: "_id",
      key: "_id",
      ellipsis: true,
    },
    {
      title: "Người dùng",
      dataIndex: "user",
      key: "user",
      render: (user) => (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      title: "Dịch vụ",
      dataIndex: "service",
      key: "service",
      render: (service) => (
        <div className="flex items-center gap-2">
          <img
            src={service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
            alt={service.name}
            className="w-10 h-10 object-cover rounded"
          />
          <div>
            <div className="font-medium">{service.name}</div>
            <div className="text-sm text-gray-500">{service.slug}</div>
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
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'waiting' && (
            <>
              <Popconfirm
                title="Xác nhận dịch vụ này?"
                onConfirm={() => handleApprove(record._id)}
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
        <Table
          columns={columns}
          dataSource={data?.data?.docs}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default StatusList;
