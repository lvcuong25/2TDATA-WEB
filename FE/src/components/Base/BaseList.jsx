import {
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  IdcardOutlined,
  MailOutlined,
  NumberOutlined,
  PhoneOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import instance from "../../utils/axiosInstance-cookie-only";
import { useAuth } from "../core/Auth";

const BaseList = () => {
  const { currentUser, currentOrganization, roleForOrg } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(5);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();

  const {
    data: _baseData,
    isLoading,
    refetch: refetchBaseData,
  } = useQuery({
    queryKey: ["databases"],
    queryFn: async () => {
      const res = await instance.get(`/database/databases`);
      return res;
    },
    retry: false,
  });

  const baseData = _baseData?.data?.data || [];
  // Mutations

  const addBaseMutation = useMutation({
    mutationFn: async (values) => {
      const response = await instance.post(`/database/databases`, values);
      return response.data;
    },
    onSuccess: () => {
      form.resetFields();
      refetchBaseData();
      toast.success("Tạo database thành công!");
    },
    onError: (error) => {
      console.error("Error creating database:", error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          "Không thể tạo database. Vui lòng thử lại!";
      toast.error(errorMessage);
    },
  });

  const deleteDatabaseMutation = useMutation({
    mutationFn: (databaseId) => {
      return instance.delete(`/database/databases/${databaseId}`);
    },
    onSuccess: () => {
      refetchBaseData();
      toast.success("Xóa database thành công!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Xóa database thất bại!"),
  });

  const updateOrgMutation = useMutation({
    mutationFn: (values) => {
      return instance.put(`/organization/${baseData?.data?._id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["organization", currentUser?._id]);
      setEditModalOpen(false);
      toast.success("Cập nhật thông tin tổ chức thành công!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Cập nhật thất bại!"),
  });

  useEffect(() => {
    // Tính tổng số trang mới
    const totalMembers = baseData?.items?.length || 0;
    const totalPages = Math.ceil(totalMembers / memberPageSize) || 1;
    if (memberPage > totalPages) {
      setMemberPage(totalPages);
    }
  }, [baseData?.items?.length, memberPage, memberPageSize]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <span>Đang tải...</span>
      </div>
    );
  if (!baseData)
    return (
      <div className="text-center text-gray-500">
        Bạn chưa thuộc tổ chức nào.
      </div>
    );

  const isOwnerOrManager = roleForOrg === "owner" || roleForOrg === "manager";

  const handleAddMember = (values) => addBaseMutation.mutate(values);

  const baseColumns = [
    {
      title: "Tên database",
      key: "name",
      render: (_, record) => (
        <Link to={`/profile/base/${record._id}`}>{record.name}</Link>
      ),
    },
    {
      title: "Mô tả",
      key: "description",
      render: (_, record) => record.description || "Không có mô tả",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate(`/profile/base/${record._id}/management`)}
          >
            Quản lý
          </Button>
          {isOwnerOrManager && (
            <Popconfirm 
              title="Xóa database này?" 
              okText="Xóa" 
              cancelText="Hủy"
              onConfirm={() => deleteDatabaseMutation.mutate(record._id)}
            >
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
                loading={deleteDatabaseMutation.isLoading}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleUpdateOrg = (values) => {
    updateOrgMutation.mutate(values);
  };

  return (
    <Card className="shadow-sm mb-6">
      {isOwnerOrManager && (
        <Card 
          title="Tạo Database mới" 
          style={{ marginBottom: 16 }}
          className="mt-10"
        >
          <Form
            form={form}
            onFinish={handleAddMember}
            layout="vertical"
            className="max-w-2xl"
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item 
                  name="name"
                  label="Tên Database"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên database!" },
                    { min: 2, message: "Tên database phải có ít nhất 2 ký tự!" }
                  ]}
                >
                  <Input 
                    placeholder="Ví dụ: ShopDB, InventoryDB" 
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item 
                  name="description"
                  label="Mô tả (tùy chọn)"
                >
                  <Input 
                    placeholder="Mô tả về database này..." 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={addBaseMutation.isLoading}
                size="large"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addBaseMutation.isLoading ? 'Đang tạo...' : 'Tạo Database'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
      <Table
        className="pt-5"
        columns={baseColumns}
        dataSource={baseData}
        rowKey={(record) => record?._id}
        pagination={{
          current: memberPage,
          pageSize: memberPageSize,
          total: baseData?.length || 0,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 15, 20, 50, 100],
          onChange: (page, pageSize) => {
            setMemberPage(page);
            setMemberPageSize(pageSize);
          },
        }}
      />
      <Modal
        title={
          <div className="flex items-center">
            <EditOutlined className="mr-2 text-blue-600" />
            <span className="text-lg font-semibold">
              Chỉnh sửa thông tin tổ chức
            </span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        destroyOnHidden
        width={800}
      >
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Gợi ý:</strong> Hãy cập nhật thông tin chính xác để tổ
            chức của bạn được xác thực và liên hệ dễ dàng hơn.
          </p>
        </div>
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateOrg}
          className="mt-4"
        >
          <Row gutter={24}>
            <Col xs={24} md={12} className="min-w-[320px]">
              <Form.Item
                name="name"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <IdcardOutlined className="mr-2 text-blue-600" />
                    Tên tổ chức
                  </span>
                }
                rules={[
                  { required: true, message: "Vui lòng nhập tên tổ chức!" },
                ]}
                extra="Nhập tên đầy đủ của tổ chức"
                className="mb-6"
              >
                <Input
                  placeholder="Tên tổ chức"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <MailOutlined className="mr-2 text-blue-600" />
                    Email
                  </span>
                }
                rules={[
                  { type: "email", message: "Email không đúng định dạng!" },
                ]}
                extra="Email liên hệ của tổ chức"
                className="mb-6"
              >
                <Input
                  placeholder="Email"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
              <Form.Item
                name="phone"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <PhoneOutlined className="mr-2 text-blue-600" />
                    Số điện thoại
                  </span>
                }
                extra="Số điện thoại liên hệ"
                className="mb-6"
              >
                <Input
                  placeholder="Số điện thoại"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} className="min-w-[320px]">
              <Form.Item
                name="address"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <HomeOutlined className="mr-2 text-blue-600" />
                    Địa chỉ
                  </span>
                }
                extra="Địa chỉ trụ sở tổ chức"
                className="mb-6"
              >
                <Input
                  placeholder="Địa chỉ"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
              <Form.Item
                name="identifier"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <NumberOutlined className="mr-2 text-blue-600" />
                    Mã định danh
                  </span>
                }
                extra="Mã định danh tổ chức (nếu có)"
                className="mb-6"
              >
                <Input
                  placeholder="Mã định danh"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
              <Form.Item
                name="taxCode"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <NumberOutlined className="mr-2 text-blue-600" />
                    Mã số thuế
                  </span>
                }
                extra="Mã số thuế tổ chức (nếu có)"
                className="mb-6"
              >
                <Input
                  placeholder="Mã số thuế"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
              <Form.Item
                name="logo"
                label={
                  <span className="flex items-center text-lg font-medium">
                    <PictureOutlined className="mr-2 text-blue-600" />
                    Logo (URL)
                  </span>
                }
                extra="Link ảnh logo tổ chức (nếu có)"
                className="mb-6"
              >
                <Input
                  placeholder="Logo (URL)"
                  size="large"
                  className="py-3 text-base"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item className="text-right">
            <Button
              onClick={() => setEditModalOpen(false)}
              style={{ marginRight: 8 }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateOrgMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BaseList;
