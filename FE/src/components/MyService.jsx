import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./core/Auth";
import { useQuery } from "@tanstack/react-query";
import instance from "../utils/axiosInstance";
import { Tag, Table, Space, Button, Tooltip, Switch, Pagination } from "antd";
import { AppstoreOutlined, TableOutlined } from "@ant-design/icons";

const MyService = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [accessToken, setAccessToken] = useState(null);
  const [isCardView, setIsCardView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
  }, []);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["myServices", currentUser?._id, currentPage, pageSize],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser?._id}/services`, {
        params: {
          page: currentPage,
          limit: pageSize,
        },
      });
      return response?.data;
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
        userId: currentUser?._id,
        accessToken: accessToken
      });

      if (response?.status !== 200) {
        throw new Error('Webhook request failed');
      }

      // Find the first authorized link
      const authorizedLink = service?.service?.authorizedLinks?.[0];
      if (authorizedLink) {
        window.location.href = authorizedLink?.url;
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
              : "red"
          }
        >
          {status === "approved"
            ? "Đã xác nhận"
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
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => {
            if (record.link_update && record.link_update.length > 0) {
              record.link_update.forEach((link) => {
                if (link.url) {
                  window.open(link.url, "_blank", "noopener,noreferrer");
                }
              });
            }
          }}
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  // Find if there is an authorized link for conditional rendering
  const findAuthorizedLink = (userService) => {
    return userService?.service?.authorizedLinks?.[0];
  };

  // Pagination handler
  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // LẤY DỮ LIỆU PHÂN TRANG ĐÚNG TỪ API MỚI
  const userServices = userData?.data?.services || [];
  const totalServices = userData?.data?.totalServices || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!userData || !userData?.data || !userData?.data?.services) {
    return (
      <div>
        <Header/>
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
      <Header/>   
      <div className="container mx-auto pt-[100px] py-12">
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-center">
              Dịch vụ đang triển khai
            </h2>
            <div className="flex items-center gap-2">
              <AppstoreOutlined className={isCardView ? "text-blue-500" : "text-gray-400"} />
              <Switch
                checked={!isCardView}
                onChange={(checked) => setIsCardView(!checked)}
                checkedChildren={<TableOutlined />}
                unCheckedChildren={<AppstoreOutlined />}
              />
              <TableOutlined className={!isCardView ? "text-blue-500" : "text-gray-400"} />
            </div>
          </div>

          {!userServices || userServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bạn chưa đăng ký dịch vụ nào</p>
              <button
                onClick={() => navigate("/service")}
                className="bg-red-500 text-white px-8 py-2 rounded-full hover:bg-red-600 transition"
              >
                Đăng ký dịch vụ
              </button>
            </div>
          ) : isCardView ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userServices.map((userService, idx) => {
                  const authorizedLink = findAuthorizedLink(userService);
                  return (
                    <div
                      key={`${userService._id}_${idx}`}
                      className={`bg-white rounded-2xl p-6 flex flex-col items-center shadow ${
                        userService?.status === "approved" && authorizedLink
                          ? "cursor-pointer hover:shadow-lg transition"
                          : ""
                      }`}
                      onClick={() =>
                        userService?.status === "approved" &&
                        authorizedLink &&
                        handleServiceClick(userService)
                      }
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                        <img
                          src={
                            userService?.service?.image ||
                            "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
                          }
                          alt={userService?.service?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-semibold mb-2 capitalize">
                        {userService?.service?.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Ngày đăng ký: {new Date(userService?.createdAt).toLocaleDateString("vi-VN")}
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
              <div className="flex justify-center mt-8">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalServices}
                  showSizeChanger
                  pageSizeOptions={['3', '6', '10', '20']}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    setPageSize(size);
                  }}
                  showTotal={total => `Tổng số ${total} dịch vụ`}
                />
              </div>
            </>
          ) : (
            <Table
              columns={columns}
              dataSource={userServices}
              rowKey={(record, idx) => `${record._id}_${idx}`}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalServices,
                showSizeChanger: true,
                pageSizeOptions: ['3', '6', '10', '20'],
                showTotal: (total) => `Tổng số ${total} dịch vụ`,
              }}
              onChange={handleTableChange}
            />
          )}
        </section>

        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Danh sách dịch vụ
          </h2>
          {!userServices || userServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bạn chưa đăng ký dịch vụ nào</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={userServices}
              rowKey={(record, idx) => `${record._id}_${idx}`}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalServices,
                showSizeChanger: true,
                pageSizeOptions: ['3', '6', '10', '20'],
                showTotal: (total) => `Tổng số ${total} dịch vụ`,
              }}
              onChange={handleTableChange}
            />
          )}
        </section>
      </div>
      <Footer/>
    </div>
  );
};

export default MyService;