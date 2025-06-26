import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Space, Table, Button, Popconfirm, Input } from "antd";
import { toast } from "react-toastify";
import { EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";

const BlogList = () => {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["BLOGS", searchValue],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchValue && { name: searchValue })
      });
      const { data } = await instance.get(`/blogs?${params}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["BLOGS"]);
      toast.success("Blog đã được xóa thành công!");
    },
    onError: (error) => {
      toast.error("Không thể xóa blog: " + error.message);
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
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
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      render: (image, record) => (
        <img
          src={image}
          alt={record.title}
          className="w-10 h-10 object-cover rounded"
        />
      ),
    },
    {
      title: "Tên Blog",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/admin/blogs/edit/${record._id}`}>
            <Button icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa blog này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) return <div className="p-4">Error: {error.message}</div>;
  return (
    <div>
      <h2 className="ant-space css-dev-only-do-not-override-1uq9j6g ant-space-horizontal ant-space-align-center ant-space-gap-row-small ant-space-gap-col-small font-semibold text-lg rounded-md bg-[#E9E9E9] w-full p-4 my-8">
        Danh sách blog
      </h2>
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <Input
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-96"
              allowClear
            />
          </div>
          <Link
            to="/admin/blogs/add"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Thêm Blog
          </Link>
        </div>
        <Table
          columns={columns}
          dataSource={data}
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

export default BlogList;
