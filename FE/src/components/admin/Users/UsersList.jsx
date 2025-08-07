import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Space, Table, Button, Popconfirm, Tag, Input } from "antd";
import { toast } from "react-toastify";
import { EditOutlined, DeleteOutlined, UserOutlined, UndoOutlined, SearchOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";

const UsersList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["USERS", currentPage, pageSize, searchValue],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        ...(searchValue && { name: searchValue })
      });
      const { data } = await instance.get(`/user?${params}`);
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/user/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["USERS"]);
      toast.success("Người dùng đã được vô hiệu hóa thành công!");
    },
    onError: (error) => {
      toast.error("Không thể vô hiệu hóa người dùng: " + error.message);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => instance.delete(`/user/restore/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["USERS"]);
      toast.success("Người dùng đã được khôi phục thành công!");
    },
    onError: (error) => {
      toast.error("Không thể khôi phục người dùng: " + error.message);
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleRestore = (id) => {
    restoreMutation.mutate(id);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page when searching
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
      width: 100,
      ellipsis: {
        showTitle: false,
      },
    },
    {
      title: "Ảnh",
      dataIndex: "avatar",
      key: "avatar",
      width: 50,
      render: (avatar) => (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <UserOutlined className="text-2xl text-gray-400" />
          )}
        </div>
      ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
      ellipsis: {
        showTitle: false,
      },
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      width: 100,
      key: "phone",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role) => {
        const roleConfig = {
          super_admin: { label: "Super Admin", color: "red" },
          site_admin: { label: "Site Admin", color: "orange" },
          site_moderator: { label: "Site Moderator", color: "blue" },
          member: { label: "Member", color: "green" },
          admin: { label: "Admin", color: "purple" }, // legacy support
        };
        
        const config = roleConfig[role] || { label: role || "User", color: "default" };
        
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Site",
      dataIndex: "site_id",
      key: "site_id",
      width: 150,
      render: (site) => {
        if (!site) return <Tag color="default">N/A</Tag>;
        return (
          <Tag color="blue">
            {site.name || 'Unknown'}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      width: 120,
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Hoạt động" : "Vô hiệu hóa"}
        </Tag>
      ),
    },
    {
      title: "Dịch vụ",
      dataIndex: "service",
      key: "service",
      width: 200,
      render: (services) => (
        <Space wrap size={[4, 4]}>
          {services?.map((serviceItem) => (
            <Tag key={serviceItem?._id} color="purple">
              {serviceItem?.service?.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Link to={`/admin/users/edit/${record._id}`}>
            <Button icon={<EditOutlined />} size="small" />
          </Link>
          {record.active ? (
            <Popconfirm
              title="Bạn có chắc chắn muốn vô hiệu hóa người dùng này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button 
                icon={<DeleteOutlined />} 
                danger
                type="primary"
                size="small"
              />
            </Popconfirm>
          ) : (
            <Popconfirm
              title="Bạn có chắc chắn muốn khôi phục người dùng này?"
              onConfirm={() => handleRestore(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button 
                icon={<UndoOutlined />} 
                type="primary"
                size="small"
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
      <style>{`
        .ant-pagination-item {
          margin: 0 6px !important;
        }
        .ant-pagination-prev,
        .ant-pagination-next {
          margin: 0 10px !important;
        }
        .ant-pagination-jump-prev,
        .ant-pagination-jump-next {
          margin: 0 6px !important;
        }
        .ant-table-pagination {
          margin-top: 20px !important;
          padding-left: 20px !important;
        }
      `}</style>
      <h2 className="ant-space css-dev-only-do-not-override-1uq9j6g ant-space-horizontal ant-space-align-center ant-space-gap-row-small ant-space-gap-col-small font-semibold text-lg rounded-md bg-[#E9E9E9] w-full p-4 my-8">
        Danh sách người dùng
      </h2>
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <Input
              placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc mã"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-96"
              allowClear
            />
          </div>
          <Link
            to="/admin/users/add"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Thêm người dùng
          </Link>
        </div>
        <Table
          columns={columns}
          dataSource={data?.docs}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.totalDocs,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: (total) => `Tổng số ${total} người dùng`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 900 }}
          size="small"
        />
      </div>
    </div>
  );
};

export default UsersList;   