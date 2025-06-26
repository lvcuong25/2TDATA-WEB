import React, { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Space, Table, Button, Popconfirm, Tag, Input } from "antd";
import { toast } from "react-toastify";
import { EditOutlined, DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";

const ServiceList = () => {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, error } = useQuery({
    queryKey: ["SERVICES", searchValue],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchValue && { name: searchValue })
      });
      const { data } = await instance.get(`/service?${params}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/service/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["SERVICES"]);
      toast.success("Dịch vụ đã được xóa thành công!");
    },
    onError: (error) => {
      toast.error("Không thể xóa dịch vụ: " + error.message);
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
          src={image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
          alt={record.name}
          className="w-10 h-10 object-cover rounded"
        />
      ),
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      key: "slug",
      ellipsis: true,
      render: (slug) => (
        <a
          href={`/service/slug/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {slug}
        </a>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Hoạt động" : "Vô hiệu hóa"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/admin/services/edit/${record._id}`}>
            <Button icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa dịch vụ này?"
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
        Danh sách dịch vụ
      </h2>
      <div className="">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <Input
              placeholder="Tìm kiếm theo tên, slug hoặc mã"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-96"
              allowClear
            />
          </div>
          <Link
            to="/admin/services/add"
            className="px-4 py-2 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Thêm dịch vụ
          </Link>
        </div>
        <Table
          columns={columns}
          dataSource={data?.data?.docs || []}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: data?.data?.limit || 10,
            total: data?.data?.totalDocs,
            current: data?.data?.page,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            }
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default ServiceList;
