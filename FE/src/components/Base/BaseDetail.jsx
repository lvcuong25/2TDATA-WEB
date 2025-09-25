import {
  DeleteOutlined,
  EditOutlined,
  HomeOutlined,
  IdcardOutlined,
  MailOutlined,
  NumberOutlined,
  PhoneOutlined,
  PictureOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Table,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useSite } from "../../context/SiteContext";
import instance from "../../utils/axiosInstance-cookie-only";
import { useAuth } from "../core/Auth";
import BaseNavigation from "./BaseNavigation";

const BaseDetail = () => {
  const { currentUser, currentOrganization, roleForOrg } = useAuth();
  const { currentSite } = useSite();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [pendingRoleChange, setPendingRoleChange] = useState({
    userId: null,
    newRole: null,
  });
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(5);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const databaseId = useParams().databaseId;

  const { data: _baseDetailData, isLoading } = useQuery({
    queryKey: ["baseDetail", databaseId],
    queryFn: async () => {
      if (!databaseId) return null;
      const res = await instance.get(`/database/databases/${databaseId}`);
      return res;
    },
    retry: false,
  });

  const baseDetailData = _baseDetailData?.data?.data;

  // Lấy danh sách users chưa thuộc tổ chức nào
  const { data: availableUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["availableUsers", currentSite?._id],
    queryFn: async () => {
      if (!currentSite?._id) return [];
      const { data } = await instance.get(
        `/organization/available-users?siteId=${currentSite._id}`
      );
      return data || [];
    },
    enabled: !!currentSite?._id,
  });

    const { data: roles, isLoading: loadingRoles } = useQuery({
    queryKey: ["roles", currentSite?._id],
    queryFn: async () => {
      if (!currentSite?._id) return [];
      const { data } = await instance.get(
        `/organization/available-users?siteId=${currentSite._id}`
      );
      return data || [];
    },
    enabled: !!currentSite?._id,
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (values) =>
      instance.post(
        `/organization/${baseDetailData?.data?._id}/members`,
        values
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["organization", currentUser?._id]);
      queryClient.invalidateQueries(["availableUsers", currentSite?._id]);
      form.resetFields();
      toast.success("Thêm thành viên thành công!");
    },
  });
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ userId, role }) =>
      instance.put(
        `/organization/${baseDetailData?.data?._id}/members/${userId}`,
        {
          role,
        }
      ),
    onSuccess: () =>
      queryClient.invalidateQueries(["organization", currentUser?._id]),
  });
  const removeMemberMutation = useMutation({
    mutationFn: (userId) =>
      instance.delete(
        `/organization/${baseDetailData?.data?._id}/members/${userId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries(["organization", currentUser?._id]);
      queryClient.invalidateQueries(["availableUsers", currentSite?._id]);
      toast.success("Xóa thành viên thành công!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || "Xóa thành viên thất bại!");
    },
  });
  const updateOrgMutation = useMutation({
    mutationFn: (values) =>
      instance.put(`/organization/${baseDetailData?.data?._id}`, values),
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
    const totalMembers = baseDetailData?.members?.length || 0;
    const totalPages = Math.ceil(totalMembers / memberPageSize) || 1;
    if (memberPage > totalPages) {
      setMemberPage(totalPages);
    }
  }, [baseDetailData?.members?.length, memberPage, memberPageSize]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <span>Đang tải...</span>
      </div>
    );
  if (!baseDetailData)
    return (
      <div className="text-center text-gray-500">
        Bạn chưa thuộc tổ chức nào.
      </div>
    );
  const isOwnerOrManager = roleForOrg === "owner" || roleForOrg === "manager";

  const handleAddMember = (values) => addMemberMutation.mutate(values);
  const handleRoleChange = (userId, role) =>
    updateMemberRoleMutation.mutate({ userId, role });
  const handleRemoveMember = (userId) => removeMemberMutation.mutate(userId);

  const handleRoleSelect = (userId, newRole) => {
    setPendingRoleChange({ userId, newRole });
  };

  const confirmRoleChange = () => {
    handleRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
    setPendingRoleChange({ userId: null, newRole: null });
    toast.success("Đã đổi vai trò thành công!");
  };

  const cancelRoleChange = () => {
    setPendingRoleChange({ userId: null, newRole: null });
  };

  const memberColumns = [
    {
      title: "Tên thành viên",
      key: "name",
      render: (text, record) => {
        return <div>{record.user?.name}</div>;
      },
    },
    {
      title: "Email",
      key: "email",
      render: (text, record) => <div>{record.user?.email}</div>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role, record) => {
        console.log("🚀 ~ role:", role);
        return <div>{role.name}</div>;
        // if (role === "owner") return <Tag color="gold">Owner</Tag>;
        // if (!isOwnerOrManager)
        //   return (
        //     <Tag color={role === "manager" ? "blue" : "default"}>
        //       {role.charAt(0).toUpperCase() + role.slice(1)}
        //     </Tag>
        //   );
        // return (
        //   <Popconfirm
        //     title={`Bạn có chắc chắn muốn đổi vai trò thành ${pendingRoleChange.newRole}?`}
        //     open={pendingRoleChange.userId === record.user._id}
        //     onConfirm={confirmRoleChange}
        //     onCancel={cancelRoleChange}
        //     okText="Đổi"
        //     cancelText="Hủy"
        //   >
        //     <Select
        //       value={role}
        //       style={{ width: 120 }}
        //       onChange={(newRole) => handleRoleSelect(record.user._id, newRole)}
        //       loading={updateMemberRoleMutation.isLoading}
        //     >
        //       <Select.Option value="manager">Manager</Select.Option>
        //       <Select.Option value="member">Member</Select.Option>
        //     </Select>
        //   </Popconfirm>
        // );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        if (record.role === "owner" || !isOwnerOrManager) return null;
        return (
          <Popconfirm
            title="Xóa thành viên này?"
            onConfirm={() => handleRemoveMember(record.user._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
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
    <div>
      <BaseNavigation />
      <Card 
        className="shadow-sm mb-6"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Base Information</span>
            <Button 
              type="primary" 
              icon={<SettingOutlined />}
              onClick={() => navigate(`/profile/base/${databaseId}/management`)}
            >
              Manage Base
            </Button>
          </div>
        }
      >
      <Descriptions title="Thông tin base" bordered column={1} className="mt-6">
        <Descriptions.Item
          label={
            <span className="flex items-center">
              <IdcardOutlined className="mr-2" />
              Tên
            </span>
          }
        >
          {baseDetailData.name || "Chưa cập nhật"}
        </Descriptions.Item>
      </Descriptions>
      {isOwnerOrManager && (
        <Form
          form={form}
          onFinish={handleAddMember}
          layout="inline"
          style={{ marginBottom: 16 }}
          className="mt-10"
        >
          <Form.Item
            name="userId"
            rules={[{ required: true, message: "Vui lòng chọn người dùng" }]}
          >
            <Select
              showSearch
              placeholder="Tìm và chọn người dùng để thêm"
              loading={loadingUsers}
              style={{ width: 300 }}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {availableUsers?.map((user) => (
                <Select.Option
                  key={user._id}
                  value={user._id}
                  label={`${user.name} (${user.email})`}
                >
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="role" initialValue="member">
            <Select style={{ width: 120 }}>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="member">Member</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={addMemberMutation.isLoading}
            >
              Thêm
            </Button>
          </Form.Item>
        </Form>
      )}
      <Table
        className="pt-5"
        columns={memberColumns}
        dataSource={baseDetailData?.members ?? []}
        rowKey={(record) => record?.user?._id}
        pagination={{
          current: memberPage,
          pageSize: 1000,
          total: baseDetailData?.members?.length || 0,
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
    </div>
  );
};

export default BaseDetail;
