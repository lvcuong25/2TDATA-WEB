import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./core/Auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import instance from "../utils/axiosInstance";
import { Tag, Table, Space, Card, Button, Tooltip, Modal, Form, Input, message, Popconfirm } from "antd";
import { LinkOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from "@ant-design/icons";

const MyService = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [accessToken, setAccessToken] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingInfo, setEditingInfo] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
  }, []);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["myServices", currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser._id}`);
      console.log(response.data);
      return response.data;
    },
    enabled: !!currentUser?._id,
  });

  const handleServiceClick = async (service) => {
    try {
      if (!accessToken || !currentUser?._id) {
        console.error('Missing access token or user ID');
        return;
      }

      // Make the webhook request
      const response = await instance.post('https://auto.hcw.com.vn/webhook/e42a9c6d-e5c0-4c11-bfa9-56aa519e8d7c', {
        userId: currentUser._id,
        accessToken: accessToken
      });

      if (response.status !== 200) {
        throw new Error('Webhook request failed');
      }

      // Find the first authorized link
      const authorizedLink = service.service.authorizedLinks?.[0];
      if (authorizedLink) {
        window.location.href = authorizedLink.url;
      } else {
        console.log("No authorized link found for this service.", service);
      }
    } catch (error) {
      console.error('Error making webhook request:', error);
    }
  };

  const columns = [
    {
      title: "Service",
      dataIndex: "service",
      key: "service",
      render: (service) => (
        <div className="flex items-center gap-2">
          <img
            src={
              service.image ||
              "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
            }
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "approved"
              ? "green"
              : status === "waiting"
              ? "orange"
              : "red"
          }
        >
          {status === "approved"
            ? "Đã xác nhận"
            : status === "waiting"
            ? "Đang chờ"
            : "Bị từ chối"}
        </Tag>
      ),
    },
    {
      title: "Links Kết quả",
      dataIndex: "link",
      key: "resultLinks",
      render: (links) => {
        return links && links.length > 0 ? (
          <Space direction="vertical">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Tooltip title={link.description || "Không có mô tả"}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {link.title}
                  </a>
                </Tooltip>
              </div>
            ))}
          </Space>
        ) : (
          "Chưa có link kết quả"
        );
      },
    },
    {
      title: "Registered At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  // Find if there is an authorized link for conditional rendering
  const findAuthorizedLink = (userService) => {
    return userService.service.authorizedLinks?.[0];
  };

  // Add information mutation
  const addInfoMutation = useMutation({
    mutationFn: async (values) => {
      const response = await instance.post('/user/information', {
        ...values,
        userId: currentUser._id
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Thêm thông tin thành công');
      queryClient.invalidateQueries(["myServices", currentUser?._id]);
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      message.error('Thêm thông tin thất bại: ' + error.message);
    }
  });

  // Update information mutation
  const updateInfoMutation = useMutation({
    mutationFn: async ({ id: infoId, values }) => {
      const response = await instance.put(`/user/information/${infoId}`, {
          ...values,
          userId: currentUser._id
      });
      return response.data;
  },
    onSuccess: () => {
      message.success('Cập nhật thông tin thành công');
      queryClient.invalidateQueries(["myServices", currentUser?._id]);
      setIsModalVisible(false);
      form.resetFields();
      setEditingInfo(null);
    },
    onError: (error) => {
      message.error('Cập nhật thông tin thất bại: ' + error.message);
    }
  });

  // Delete information mutation
  const deleteInfoMutation = useMutation({
    mutationFn: (infoId) => instance.delete(`/user/information/${infoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["myServices", currentUser?._id]);
      message.success("Thông tin đã được xóa thành công!");
    },
    onError: (error) => {
      message.error("Không thể xóa thông tin: " + error.message);
    }
  });

  const handleAddInfo = () => {
    setEditingInfo(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditInfo = (info) => {
    setEditingInfo(info);
    form.setFieldsValue({
      code: info.code,
      title: info.title,
      description: info.description
    });
    setIsModalVisible(true);
  };

  const handleDeleteInfo = (infoId) => {
    deleteInfoMutation.mutate(infoId);
  };

  const handleModalOk = () => {
    form.validateFields().then(values => {
      console.log('Submitting values:', values);
      if (editingInfo) {
        updateInfoMutation.mutate({ id: editingInfo._id, values });
      } else {
        addInfoMutation.mutate(values);
      }
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const infoColumns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      ellipsis: true,
      width:450,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 150,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 200,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text?.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEditInfo(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa thông tin này?"
            onConfirm={() => handleDeleteInfo(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button 
              type="primary" 
              danger
              icon={<DeleteOutlined />} 
              loading={deleteInfoMutation.isPending && deleteInfoMutation.variables === record._id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!userData || !userData.data || !userData.data.service) {
    return (
      <div>
        <Header />
        <div className="container mx-auto pt-[100px] py-12">
          <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8 text-center">
            <h2 className="text-2xl font-bold mb-8">Dịch vụ của tôi</h2>
            <p className="text-gray-600 mb-4">Không thể tải dữ liệu dịch vụ.</p>
          </section>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto pt-[100px] py-12">
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Dịch vụ đang triển khai
          </h2>

          {!userData.data.service || userData.data.service.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bạn chưa đăng ký dịch vụ nào</p>
              <button
                onClick={() => navigate("/service")}
                className="bg-red-500 text-white px-8 py-2 rounded-full hover:bg-red-600 transition"
              >
                Đăng ký dịch vụ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.data.service
                .filter(userService => userService.status !== "rejected")
                .map((userService) => {
                const authorizedLink = findAuthorizedLink(userService);
                return (
                  <div
                    key={userService._id}
                    className={`bg-white rounded-2xl p-6 flex flex-col items-center shadow ${
                      userService.status === "approved" && authorizedLink
                        ? "cursor-pointer hover:shadow-lg transition"
                        : ""
                    }`}
                    onClick={() =>
                      userService.status === "approved" &&
                      authorizedLink &&
                      handleServiceClick(userService)
                    }
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                      <img
                        src={
                          userService.service.image ||
                          "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
                        }
                        alt={userService.service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-semibold mb-2 capitalize">
                      {userService.service.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Ngày đăng ký:{" "}
                      {new Date(userService.createdAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(userService);
                      }}
                      className="bg-blue-500 text-white rounded-full px-8 py-2 font-semibold flex items-center gap-2 hover:bg-blue-600 transition"
                    >
                      Kết nối<span>→</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Danh sách dịch vụ
          </h2>
          {!userData.data.service || userData.data.service.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bạn chưa đăng ký dịch vụ nào</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={userData.data.service.filter(service => service.status !== "rejected")}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </section>

        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Thông tin của tôi</h2>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddInfo}
            >
              Thêm thông tin
            </Button>
          </div>
          
          <Table
            columns={infoColumns}
            dataSource={userData?.data?.information || []}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </section>
      </div>

      <Modal
        title={editingInfo ? "Thông tin" : "Thêm thông tin mới"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingInfo(null);
        }}
        confirmLoading={addInfoMutation.isPending || updateInfoMutation.isPending}
        width={800}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="code"
            label="Mã"
            rules={[{ required: true, message: 'Vui lòng nhập mã!' }]}
          >
            <Input 
              style={{ fontSize: '16px' }} 
              suffix={
                editingInfo ? (
                    <Button
                        type="text"
                        icon={isCopied ? null : <CopyOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            const codeValue = form.getFieldValue('code');
                            if (codeValue) {
                                navigator.clipboard.writeText(codeValue);
                                setIsCopied(true);
                                setTimeout(() => {
                                    setIsCopied(false);
                                }, 2000);
                            }
                        }}
                    >
                        {isCopied ? 'Đã sao chép' : null}
                    </Button>
                ) : null
              }
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input style={{ fontSize: '16px' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={6} style={{ fontSize: '16px' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Footer />
    </div>
  );
};

export default MyService;
