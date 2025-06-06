import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Space, Table, Button, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";

const UserInfoList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch user info list
  const { data, isLoading } = useQuery({
    queryKey: ["USER_INFO", currentPage, pageSize],
    queryFn: async () => {
      const { data } = await instance.get(`/userInfo?page=${currentPage}&limit=${pageSize}`);
      return data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/userInfo/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["USER_INFO"]);
      message.success("Xóa thông tin thành công!");
    },
    onError: (error) => {
      message.error("Không thể xóa thông tin: " + error.message);
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Danh sách thông tin đăng ký</h1>
      <Table
        columns={columns}
        dataSource={data?.userInfos}
        rowKey="_id"
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: data?.pagination?.total,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bản ghi`,
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default UserInfoList; 