import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Space, Table, Button, Popconfirm, message, Input, Modal } from "antd";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";

const UserInfoList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch user info list
  const { data, isLoading } = useQuery({
    queryKey: ["USER_INFO", currentPage, pageSize],
    queryFn: async () => {
      const { data } = await instance.get(`/userInfo?page=${currentPage}&limit=${pageSize}`);
      return data.data;
    },
  });

  const handleRowClick = (record) => {
    setSelectedUser(record);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/userInfo/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["USER_INFO"]);
      message.success("Xóa thông tin thành công!");
      setSelectedUser(null);
      setIsModalVisible(false);
    },
    onError: (error) => {
      message.error("Không thể xóa thông tin: " + error.message);
    },
  });

  const handleDelete = (id) => {
    handleModalClose();
    deleteMutation.mutate(id);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const filteredData = data?.userInfos?.filter((item) => {
    const searchLower = searchText.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.email.toLowerCase().includes(searchLower) ||
      item.phoneNumber.includes(searchText)
    );
  });

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
          <span onClick={(e) => e.stopPropagation()}>
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
              </Button>
            </Popconfirm>
          </span>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách thông tin đăng ký</h1>
        <Input
          placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
          prefix={<SearchOutlined />}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="_id"
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredData?.length || 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bản ghi`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="Chi tiết thông tin đăng ký"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Tên:</p>
              <p>{selectedUser.name}</p>
            </div>
            <div>
              <p className="font-semibold">Email:</p>
              <p>{selectedUser.email}</p>
            </div>
            <div>
              <p className="font-semibold">Số điện thoại:</p>
              <p>{selectedUser.phoneNumber}</p>
            </div>
            <div>
              <p className="font-semibold">Ngày đăng ký:</p>
              <p>{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserInfoList; 