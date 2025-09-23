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
  Table,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import instance from "../../utils/axiosInstance-cookie-only";
import { useAuth } from "../core/Auth";

const BaseList = () => {
  const { currentUser, currentOrganization, roleForOrg } = useAuth();
  const queryClient = useQueryClient();
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
    queryKey: ["bases", currentOrganization?._id],
    queryFn: async () => {
      if (!currentOrganization?._id) return null;
      const res = await instance.get(`orgs/${currentOrganization?._id}/bases`);
      return res;
    },
    enabled: !!currentOrganization?._id,
    retry: false,
  });

  const baseData = _baseData?.data?.data;
  // Mutations

  const addBaseMutation = useMutation({
    mutationFn: (values) => {
      return instance.post(`/orgs/${currentOrganization?._id}/bases`, values);
    },
    onSuccess: () => {
      form.resetFields();
      refetchBaseData();
      toast.success("Thêm base thành công!");
    },
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
      title: "Tên base",
      key: "name",
      render: (_, record) => (
        <Link to={`/profile/base/${record._id}`}>{record.name}</Link>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        if (record.role === "owner" || !isOwnerOrManager) return null;
        return (
          <Popconfirm title="Xóa thành viên này?" okText="Xóa" cancelText="Hủy">
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        );
      },
    },
  ];

  const handleUpdateOrg = (values) => {
    updateOrgMutation.mutate(values);
  };

  return (
    <Card className="shadow-sm mb-6">
      {isOwnerOrManager && (
        <Form
          form={form}
          onFinish={handleAddMember}
          layout="inline"
          style={{ marginBottom: 16 }}
          className="mt-10"
        >
          <Form.Item name="name">
            <Input placeholder="Nhập tên base" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={addBaseMutation.isLoading}
            >
              Thêm
            </Button>
          </Form.Item>
        </Form>
      )}
      <Table
        className="pt-5"
        columns={baseColumns}
        dataSource={baseData?.items}
        rowKey={(record) => record?._id}
        pagination={{
          current: memberPage,
          pageSize: memberPageSize,
          total: baseData.metadata?.total || 0,
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
