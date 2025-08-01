import { useNavigate } from "react-router-dom";
import Header from "./Header";
import FooterWrapper from "./FooterWrapper";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./core/Auth";
import { useQuery } from "@tanstack/react-query";
import instance from "../utils/axiosInstance";
import { Tag, Table, Space, Button, Tooltip, Switch, Pagination } from "antd";
import { AppstoreOutlined, TableOutlined, LoadingOutlined } from "@ant-design/icons";

const MyService = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [accessToken, setAccessToken] = useState(null);
  const [isCardView, setIsCardView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [currentPageServices, setCurrentPageServices] = useState(1);
  const [pageSizeServices, setPageSizeServices] = useState(6);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

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

  // API call riêng cho danh sách dịch vụ có link
  const { data: servicesWithLinksData, isLoading: isLoadingServicesWithLinks } = useQuery({
    queryKey: ["servicesWithLinks", currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser?._id}/services`, {
        params: {
          page: 1,
          limit: 1000, // Lấy tất cả để lọc client-side
        },
      });
      return response?.data;
    },
    enabled: !!currentUser?._id,
  });

  // Hàm sinh state base64
  function generateState(userId, name, serviceId) {
    const obj = { userId, name, serviceId };
    return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  }
  // Hàm thêm/thay thế state vào url
  function appendStateToUrl(url, stateValue) {
    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('state', stateValue);
      return urlObj.toString();
    } catch {
      return url;
    }
  }

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
        const stateObj = {
          userId: currentUser?._id || "",
          name: currentUser?.name || "",
          serviceId: service?._id || ""
        };
        const state = generateState(stateObj.userId, stateObj.name, stateObj.serviceId);
        const urlWithState = appendStateToUrl(authorizedLink.url, state);
        window.location.href = urlWithState;
        } else {
          console.error('No authorized link found for service');
        }
    } catch (error) {
      console.error('Error making webhook request:', error);
    }
  };

  const handleUpdateLinks = async (record) => {
    setUpdatingServiceId(record._id);
    
    try {
      // Gọi POST tới tất cả các link_update
      if (record.link_update && record.link_update.length > 0) {
        await Promise.all(
          record.link_update.map(link => {
            if (link.url) {
              // Gửi POST, không cần chờ kết quả
              // Use proper headers and error handling
              return fetch(link.url, { 
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                mode: 'cors' // Explicitly set CORS mode
              }).catch(error => {
                console.error('Error calling update link:', error.message);
                return null; // Don't throw, just log
              });
            }
            return null;
          })
        );
      }
    } catch (error) {
      console.error('Error updating links:', error);
    } finally {
      // Dừng loading sau 15 giây
      setTimeout(() => {
        setUpdatingServiceId(null);
      }, 15000);
    }
  };

  const columns = [
    {
      title: "Dịch vụ",
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
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "approved"
              ? "green"
              : "green"
          }
        >
          {status === "approved"
            ? "Đã xác nhận"
            : "Đã xác nhận"}
        </Tag>
      ),
    },
    {
      title: "Kết quả",
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
      title: "Thời gian",
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
          onClick={() => handleUpdateLinks(record)}
          loading={updatingServiceId === record._id}
          icon={updatingServiceId === record._id ? <LoadingOutlined /> : null}
        >
          {updatingServiceId === record._id ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
      ),
    },
  ];

  const deployedColumns = [
    {
      title: "Dịch vụ",
      dataIndex: "service",
      key: "service",
      render: (service) => (
        <div className="flex items-center gap-2">
          <img
            src={service.image || "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"}
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
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Kết nối",
      key: "connect",
      width: 120,
      render: (_, record) => {
        const links = record.service?.authorizedLinks || [];
        const hasLink = links.length > 0;
        return (
          <Tooltip title={hasLink ? 'Kết nối dịch vụ' : 'Chưa có link kết nối'}>
            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                if (hasLink) {
                  const stateObj = {
                    userId: currentUser?._id || "",
                    name: currentUser?.name || "",
                    serviceId: record.service._id || ""
                  };
                  const state = generateState(stateObj.userId, stateObj.name, stateObj.serviceId);
                  const urlWithState = appendStateToUrl(links[0].url, state);
                  window.location.href = urlWithState;
                }
              }}
              disabled={!hasLink}
            >
              Kết nối <span style={{ marginLeft: 4 }}>→</span>
            </Button>
          </Tooltip>
        );
      }
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
  const userServicesRaw = userData?.data?.services || [];
  const userServices = userServicesRaw.filter(service => service.status === "approved");
  const totalServices = userData?.data?.totalServices || 0;

  // Lọc ra các dịch vụ có link kết quả cho danh sách dịch vụ (từ API riêng)
  const allServices = servicesWithLinksData?.data?.services || [];
  const servicesWithLinks = allServices.filter(service => 
    service.link && service.link.length > 0
  );

  if (isLoading || isLoadingServicesWithLinks) {
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
        <FooterWrapper />
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
                  pageSizeOptions={['3', '6', '9', '18']}
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
              columns={deployedColumns}
              dataSource={userServices}
              rowKey={(record, idx) => `${record._id}_${idx}`}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: totalServices,
                showSizeChanger: true,
                pageSizeOptions: ['3', '6', '9', '18'],
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
          {!servicesWithLinks || servicesWithLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Chưa có dịch vụ nào có kết quả</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={servicesWithLinks}
              rowKey={(record, idx) => `${record._id}_${idx}`}
              pagination={{
                current: currentPageServices,
                pageSize: pageSizeServices,
                total: servicesWithLinks.length,
                showSizeChanger: true,
                pageSizeOptions: ['3', '6', '9', '18'],
                showTotal: (total) => `Tổng số ${total} dịch vụ có kết quả`,
              }}
              onChange={(pagination) => {
                setCurrentPageServices(pagination.current);
                setPageSizeServices(pagination.pageSize);
              }}
            />
          )}
        </section>
      </div>
      <FooterWrapper/>
    </div>
  );
};

export default MyService;