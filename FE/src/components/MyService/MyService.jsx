import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch, Pagination } from "antd";
import { AppstoreOutlined, TableOutlined } from "@ant-design/icons";
import Header from "../Header";
import FooterWrapper from "../FooterWrapper";

// Custom hooks
import { useMyServicesData, useActiveServices, useRealtimePolling } from "./hooks/useMyServicesData";

// Components
import ServiceCard from "./components/ServiceCard";
import ServiceTable from "./components/ServiceTable";
import AutoUpdateModal from "./modals/AutoUpdateModal";
import DateRangeModal from "./modals/DateRangeModal";

const MyService = () => {
  const navigate = useNavigate();
  
  // State management
  const [isCardView, setIsCardView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [currentPageServices, setCurrentPageServices] = useState(1);
  const [pageSizeServices, setPageSizeServices] = useState(6);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  
  // Modal states
  const [autoUpdateModalVisible, setAutoUpdateModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectedServiceForDateRange, setSelectedServiceForDateRange] = useState(null);

  // Custom hooks
  const { userData, servicesWithLinksData, isLoading, currentUser, queryClient } = useMyServicesData(currentPage, pageSize);
  const activeServices = useActiveServices(userData);
  const isRealtimeUpdating = useRealtimePolling(currentUser, queryClient, activeServices);

  // Clean up hash fragment on mount
  useEffect(() => {
    console.log('Current user:', currentUser);
    
    if (window.location.hash && window.location.hash === '#_=_') {
      window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }, [currentUser]);

  // Data processing
  const userServicesRaw = userData?.data?.services || [];
  const userServices = userServicesRaw.filter(service => service.status === "approved");
  const totalServices = userData?.data?.totalServices || 0;

  const allServices = servicesWithLinksData?.data?.services || [];
  const servicesWithLinks = allServices.filter(service => 
    service.link && service.link.length > 0
  );

  // Event handlers
  const handleServiceClickWithDateRange = (service) => {
    setSelectedServiceForDateRange(service);
    setDateRangeModalVisible(true);
  };

  const handleOpenAutoUpdateModal = (service) => {
    setSelectedService(service);
    setAutoUpdateModalVisible(true);
  };

  const handleSaveAutoUpdateSuccess = async () => {
      await queryClient.invalidateQueries({ queryKey: ["myServices", currentUser?._id] });
      await queryClient.invalidateQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
      await queryClient.refetchQueries({ queryKey: ["myServices", currentUser?._id] });
      await queryClient.refetchQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const handleServicesTableChange = (pagination) => {
    setCurrentPageServices(pagination.current);
    setPageSizeServices(pagination.pageSize);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Error state
  if (!userData || !userData?.data || !userData?.data?.services) {
    return (
      <div>
        <Header/>
        <div className="container mx-auto py-12">
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
      <div className="container mx-auto py-12">
        {/* Deployed Services Section */}
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-center">
                Dịch vụ đang triển khai
              </h2>
            </div>
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
                {userServices.map((userService, idx) => (
                  <ServiceCard
                      key={`${userService._id}_${idx}`}
                    userService={userService}
                    idx={idx}
                    onConnectWithDateRange={handleServiceClickWithDateRange}
                  />
                ))}
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
            <ServiceTable
              services={userServices}
              columns="deployed"
              currentPage={currentPage}
              pageSize={pageSize}
              total={totalServices}
              onPageChange={handleTableChange}
              onConnectWithDateRange={handleServiceClickWithDateRange}
            />
          )}
        </section>

        {/* Services with Results Section */}
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Danh sách dịch vụ
          </h2>
          {!servicesWithLinks || servicesWithLinks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Chưa có dịch vụ nào có kết quả</p>
            </div>
          ) : (
            <ServiceTable
              services={servicesWithLinks}
              columns="full"
              currentPage={currentPageServices}
              pageSize={pageSizeServices}
              total={servicesWithLinks.length}
              onPageChange={handleServicesTableChange}
              onOpenAutoUpdateModal={handleOpenAutoUpdateModal}
              updatingServiceId={updatingServiceId}
            />
          )}
        </section>
      </div>
      <FooterWrapper/>

      {/* Modals */}
      <AutoUpdateModal
        visible={autoUpdateModalVisible}
        onClose={() => setAutoUpdateModalVisible(false)}
        selectedService={selectedService}
        onSaveSuccess={handleSaveAutoUpdateSuccess}
      />

      <DateRangeModal
        visible={dateRangeModalVisible}
        onClose={() => setDateRangeModalVisible(false)}
        selectedService={selectedServiceForDateRange}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MyService;
