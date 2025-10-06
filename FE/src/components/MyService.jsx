import { useNavigate } from "react-router-dom";
import Header from "./Header";
import FooterWrapper from "./FooterWrapper";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./core/Auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import instance from "../utils/axiosInstance-cookie-only";
import { Tag, Table, Space, Button, Tooltip, Switch, Pagination, Modal, Select, message, InputNumber, Radio, TimePicker, DatePicker } from "antd";
import { AppstoreOutlined, TableOutlined, LoadingOutlined, SettingOutlined, ClockCircleOutlined, CalendarOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
import { 
  createStateObject, 
  encodeState, 
  appendStateToUrl as appendStateToUrlHelper 
} from "../utils/serviceStateHelper";
import dayjs from "dayjs";

const MyService = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext) || {};
  const queryClient = useQueryClient();
  const currentUser = authContext?.currentUser || null;
  const [isCardView, setIsCardView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [currentPageServices, setCurrentPageServices] = useState(1);
  const [pageSizeServices, setPageSizeServices] = useState(6);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);
  const [autoUpdateModalVisible, setAutoUpdateModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [autoUpdateSettings, setAutoUpdateSettings] = useState({
    enabled: false,
    scheduleType: 'daily', // 'daily', 'weekly', 'monthly', 'once'
    scheduleTime: null, // moment object cho thời gian
    scheduleDate: null, // moment object cho ngày (nếu chọn 'once')
    scheduleDays: [], // array các ngày trong tuần (nếu chọn 'weekly')
  });

  // State cho date picker modal
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectedServiceForDateRange, setSelectedServiceForDateRange] = useState(null);
  const [startDate, setStartDate] = useState(null); // Chỉ lưu ngày bắt đầu
  const [activeServices, setActiveServices] = useState(new Set()); // Theo dõi các dịch vụ đang chạy
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false); // Trạng thái cập nhật realtime

  useEffect(() => {
    console.log('Current user:', currentUser);
    
    // Xóa hash fragment nếu có
    if (window.location.hash && window.location.hash === '#_=_') {
      window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }, [currentUser]);


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

  // Cập nhật danh sách dịch vụ đang active
  useEffect(() => {
    if (!userData?.data?.services) return;

    const newActiveServices = new Set();
    userData.data.services.forEach(service => {
      const currentPercent = service.webhookData?.current_percent || service.autoUpdate?.current_percent || 0;
      if (currentPercent > 0 && currentPercent < 100) {
        newActiveServices.add(service._id);
      }
    });

    setActiveServices(newActiveServices);
  }, [userData]);

  // Realtime polling cho tiến độ - sử dụng API hiện có
  useEffect(() => {
    if (!currentUser?._id || activeServices.size === 0) return;

    console.log('🚀 Starting realtime polling for', activeServices.size, 'active services');

    const pollInterval = setInterval(async () => {
      try {
        setIsRealtimeUpdating(true);
        console.log('🔄 Realtime polling: Refreshing data...');
        
        // Refetch dữ liệu services với cache tối ưu
        await queryClient.invalidateQueries({ 
          queryKey: ["myServices", currentUser._id],
          exact: false // Invalidate tất cả queries có chứa key này
        });
        await queryClient.invalidateQueries({ 
          queryKey: ["servicesWithLinks", currentUser._id],
          exact: false
        });
        
        // Delay ngắn để hiển thị loading state
        setTimeout(() => setIsRealtimeUpdating(false), 500);
      } catch (error) {
        console.error('Error in realtime polling:', error);
        setIsRealtimeUpdating(false);
      }
    }, 2000); // Polling mỗi 2 giây cho realtime hơn

    return () => {
      console.log('🛑 Stopping realtime polling');
      clearInterval(pollInterval);
    };
  }, [currentUser?._id, queryClient, activeServices.size]);

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

  // Hàm lấy URL sạch không có hash fragment
  function getCleanUrl() {
    try {
      // Sử dụng URL constructor để xử lý URL tốt hơn
      const url = new URL(window.location.href);
      const cleanUrl = url.origin + url.pathname + url.search;
      console.log('Original URL:', window.location.href);
      console.log('Clean URL:', cleanUrl);
      return cleanUrl;
    } catch (error) {
      // Fallback nếu URL constructor không hoạt động
      const currentUrl = window.location.href;
      const cleanUrl = currentUrl.split('#')[0];
      console.log('Fallback - Original URL:', currentUrl);
      console.log('Fallback - Clean URL:', cleanUrl);
      return cleanUrl;
    }
  }

  // Hàm mở modal chọn ngày bắt đầu
  const handleServiceClickWithDateRange = (service) => {
    setSelectedServiceForDateRange(service);
    setStartDate(null); // Reset start date
    setDateRangeModalVisible(true);
  };

  // Hàm xử lý khi người dùng chọn khoảng thời gian và kết nối
  const handleConnectWithDateRange = async () => {
    const service = selectedServiceForDateRange;
    
    try {
      if (!currentUser?._id) {
        console.error('Missing user ID');
        alert('Vui lòng đăng nhập lại.');
        return;
      }

      // Find the first authorized link
      const authorizedLink = service?.service?.authorizedLinks?.[0];
      if (!authorizedLink) {
        console.error('No authorized link found for service');
        return;
      }

      // Make the webhook request (optional - can be skipped if causing issues)
      try {
        const response = await instance.post('https://auto.hcw.com.vn/webhook/e42a9c6d-e5c0-4c11-bfa9-56aa519e8d7c', {
          userId: currentUser?._id
        });
        console.log('Webhook response:', response?.status);
      } catch (webhookError) {
        console.warn('Webhook request failed, continuing with redirect:', webhookError);
        // Continue with redirect even if webhook fails
      }

      // Tạo state object với dateRange (từ ngày chọn đến hiện tại)
      let dateRangeData = null;
      if (startDate) {
        const endDate = dayjs(); // Tự động lấy thời gian hiện tại
        dateRangeData = {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          startDateISO: startDate.toISOString(),
          endDateISO: endDate.toISOString()
        };
      }

      // Proceed with redirect - Sử dụng helper functions để truyền thông tin dịch vụ chi tiết
      const stateObj = createStateObject(currentUser, service, getCleanUrl(), dateRangeData);
      const encodedState = encodeState(stateObj);
      const urlWithState = appendStateToUrlHelper(authorizedLink.url, encodedState);
      
      console.log('Redirecting to:', urlWithState);
      console.log('State object being passed:', stateObj);
      console.log('Date range data:', dateRangeData);
      
      // Đóng modal và chuyển hướng
      setDateRangeModalVisible(false);
      window.location.href = urlWithState;
      
    } catch (error) {
      console.error('Error in handleConnectWithDateRange:', error);
      // Show user-friendly error message
      alert('Có lỗi xảy ra khi kết nối dịch vụ. Vui lòng thử lại.');
    }
  };

  // Hàm kết nối trực tiếp không cần chọn thời gian (cho backward compatibility)
  const handleServiceClick = async (service) => {
    try {
      if (!currentUser?._id) {
        console.error('Missing user ID');
        alert('Vui lòng đăng nhập lại.');
        return;
      }

      // Find the first authorized link
      const authorizedLink = service?.service?.authorizedLinks?.[0];
      if (!authorizedLink) {
        console.error('No authorized link found for service');
        return;
      }

      // Make the webhook request (optional - can be skipped if causing issues)
      try {
        const response = await instance.post('https://auto.hcw.com.vn/webhook/e42a9c6d-e5c0-4c11-bfa9-56aa519e8d7c', {
          userId: currentUser?._id
        });
        console.log('Webhook response:', response?.status);
      } catch (webhookError) {
        console.warn('Webhook request failed, continuing with redirect:', webhookError);
        // Continue with redirect even if webhook fails
      }

      // Proceed with redirect - Sử dụng helper functions để truyền thông tin dịch vụ chi tiết
      const stateObj = createStateObject(currentUser, service, getCleanUrl());
      const encodedState = encodeState(stateObj);
      const urlWithState = appendStateToUrlHelper(authorizedLink.url, encodedState);
      
      console.log('Redirecting to:', urlWithState);
      console.log('State object being passed:', stateObj);
      window.location.href = urlWithState;
      
    } catch (error) {
      console.error('Error in handleServiceClick:', error);
      // Show user-friendly error message
      alert('Có lỗi xảy ra khi kết nối dịch vụ. Vui lòng thử lại.');
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

      // Cập nhật thời gian cập nhật cuối cùng nếu có auto update
      if (record.autoUpdate?.enabled) {
        try {
          await instance.put(`/requests/${record._id}/update-time`);
        } catch (error) {
          console.error('Error updating last update time:', error);
        }
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

  const handleOpenAutoUpdateModal = (service) => {
    setSelectedService(service);
    
    setAutoUpdateSettings({
      enabled: service.autoUpdate?.enabled || false,
      scheduleType: service.autoUpdate?.scheduleType || 'daily',
      scheduleTime: service.autoUpdate?.scheduleTime ? dayjs(`2000-01-01 ${service.autoUpdate.scheduleTime}`) : null,
      scheduleDate: service.autoUpdate?.scheduleDate ? dayjs(service.autoUpdate.scheduleDate) : null,
      scheduleDays: service.autoUpdate?.scheduleDays || []
    });
    setAutoUpdateModalVisible(true);
  };

  const handleSaveAutoUpdateSettings = async () => {
    if (!selectedService) return;

    try {
      let requestData = {
        enabled: autoUpdateSettings.enabled
      };

      // Chỉ xử lý schedule
      if (autoUpdateSettings.enabled) {
        if (!autoUpdateSettings.scheduleTime) {
          message.error('Vui lòng chọn thời gian cập nhật');
          return;
        }

        requestData.scheduleType = autoUpdateSettings.scheduleType;
        requestData.scheduleTime = autoUpdateSettings.scheduleTime.format('HH:mm');
        
        if (autoUpdateSettings.scheduleType === 'once' && !autoUpdateSettings.scheduleDate) {
          message.error('Vui lòng chọn ngày cập nhật');
          return;
        }
        
        if (autoUpdateSettings.scheduleType === 'once') {
          requestData.scheduleDate = autoUpdateSettings.scheduleDate.format('YYYY-MM-DD');
        }
        
        if (autoUpdateSettings.scheduleType === 'weekly' && autoUpdateSettings.scheduleDays.length === 0) {
          message.error('Vui lòng chọn ít nhất một ngày trong tuần');
          return;
        }
        
        if (autoUpdateSettings.scheduleType === 'weekly') {
          requestData.scheduleDays = autoUpdateSettings.scheduleDays;
        }

        // Tính nextUpdateAt dựa trên schedule
        requestData.nextUpdateAt = calculateNextUpdateTime();
        
        // Xóa thông tin interval cũ
        requestData.clearInterval = true;
        requestData.interval = null;
      } else {
        // Khi tắt, xóa tất cả thông tin
        requestData.clearSchedule = true;
        requestData.clearInterval = true;
        requestData.scheduleType = null;
        requestData.scheduleTime = null;
        requestData.scheduleDate = null;
        requestData.scheduleDays = null;
        requestData.interval = null;
      }

      console.log('🚀 SENDING REQUEST:', requestData);
      console.log('🔍 Request details:', {
        enabled: requestData.enabled,
        interval: requestData.interval,
        scheduleType: requestData.scheduleType,
        scheduleTime: requestData.scheduleTime,
        clearSchedule: requestData.clearSchedule,
        clearInterval: requestData.clearInterval
      });
      const response = await instance.put(`/requests/${selectedService._id}/auto-update`, requestData);
      console.log('📥 RESPONSE:', response.data);

      message.success(response.data.message);
      setAutoUpdateModalVisible(false);
      
      // Refresh data without full page reload
      await queryClient.invalidateQueries({ queryKey: ["myServices", currentUser?._id] });
      await queryClient.invalidateQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
      
      // Force refetch để đảm bảo data được cập nhật
      console.log('🔄 Refreshing data after save...');
      await queryClient.refetchQueries({ queryKey: ["myServices", currentUser?._id] });
      await queryClient.refetchQueries({ queryKey: ["servicesWithLinks", currentUser?._id] });
      console.log('✅ Data refresh completed');
    } catch (error) {
      console.error('Error saving auto update settings:', error);
      message.error('Có lỗi xảy ra khi lưu cài đặt');
    }
  };

  const calculateNextUpdateTime = () => {
    const { scheduleType, scheduleTime, scheduleDate, scheduleDays } = autoUpdateSettings;
    const now = dayjs();
    
    if (scheduleType === 'once') {
      const scheduledDateTime = dayjs(`${scheduleDate.format('YYYY-MM-DD')} ${scheduleTime.format('HH:mm')}`);
      return scheduledDateTime.isAfter(now) ? scheduledDateTime.toISOString() : null;
    }
    
    if (scheduleType === 'daily') {
      const todayScheduled = dayjs(`${now.format('YYYY-MM-DD')} ${scheduleTime.format('HH:mm')}`);
      if (todayScheduled.isAfter(now)) {
        return todayScheduled.toISOString();
      } else {
        return todayScheduled.add(1, 'day').toISOString();
      }
    }
    
    if (scheduleType === 'weekly') {
      const currentDay = now.day(); // 0 = Chủ nhật, 1 = Thứ 2, ...
      const nextDays = scheduleDays.filter(day => day > currentDay);
      
      if (nextDays.length > 0) {
        const nextDay = Math.min(...nextDays);
        const daysToAdd = nextDay - currentDay;
        return dayjs(`${now.format('YYYY-MM-DD')} ${scheduleTime.format('HH:mm')}`).add(daysToAdd, 'days').toISOString();
      } else {
        // Tìm ngày gần nhất trong tuần sau
        const nextWeekDay = Math.min(...scheduleDays);
        const daysToAdd = 7 - currentDay + nextWeekDay;
        return dayjs(`${now.format('YYYY-MM-DD')} ${scheduleTime.format('HH:mm')}`).add(daysToAdd, 'days').toISOString();
      }
    }
    
    return null;
  };

  const formatNextUpdateTime = (nextUpdateAt) => {
    if (!nextUpdateAt) return 'Không có';
    const date = new Date(nextUpdateAt);
    return date.toLocaleString('vi-VN');
  };

  const formatIntervalDisplay = (interval, scheduleType, scheduleTime) => {
    console.log('formatIntervalDisplay called with:', { 
      interval, 
      scheduleType, 
      scheduleTime,
      intervalType: typeof interval,
      scheduleTypeType: typeof scheduleType,
      scheduleTimeType: typeof scheduleTime
    });
    
    // Kiểm tra scheduleType có hợp lệ không (không phải null, undefined, hoặc 'null')
    const hasValidSchedule = scheduleType && 
      scheduleType !== null && 
      scheduleType !== undefined && 
      scheduleType !== 'null' &&
      scheduleType.trim() !== '';
    
    console.log('hasValidSchedule:', hasValidSchedule);
    
    if (hasValidSchedule) {
      console.log('Using scheduleType logic:', scheduleType);
      const timeStr = scheduleTime ? (typeof scheduleTime === 'string' ? scheduleTime : scheduleTime.format('HH:mm')) : '';
      switch (scheduleType) {
        case 'daily':
          return `Hàng ngày lúc ${timeStr}`;
        case 'weekly':
          return `Hàng tuần lúc ${timeStr}`;
        case 'monthly':
          return `Hàng tháng lúc ${timeStr}`;
        case 'once':
          return `Một lần lúc ${timeStr}`;
        default:
          return `Lịch trình lúc ${timeStr}`;
      }
    }
    
    // Nếu không có scheduleType hợp lệ, hiển thị interval
    console.log('Using interval logic:', interval);
    if (interval && interval >= 1440) {
      const days = Math.floor(interval / 1440);
      console.log('Returning days:', days);
      return `${days} ngày`;
    } else if (interval && interval >= 60) {
      const hours = Math.floor(interval / 60);
      console.log('Returning hours:', hours);
      return `${hours} giờ`;
    } else if (interval) {
      console.log('Returning minutes:', interval);
      return `${interval} phút`;
    }
    
    console.log('Returning default: Chưa cài đặt');
    return 'Chưa cài đặt';
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
              service.image && service.image.trim() !== ""
                ? service.image
                : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
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
      title: "Cập nhật tự động",
      key: "autoUpdate",
      render: (_, record) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag color={record.autoUpdate?.enabled ? "green" : "default"}>
              {record.autoUpdate?.enabled ? (() => {
                console.log('🔍 TABLE DEBUG for service:', record.service?.name);
                console.log('📊 Raw data:', {
                  interval: record.autoUpdate.interval,
                  scheduleType: record.autoUpdate.scheduleType,
                  scheduleTime: record.autoUpdate.scheduleTime,
                  enabled: record.autoUpdate.enabled
                });
                console.log('🔍 Full autoUpdate object:', record.autoUpdate);
                
                const displayText = formatIntervalDisplay(
                  record.autoUpdate.interval, 
                  record.autoUpdate.scheduleType, 
                  record.autoUpdate.scheduleTime
                );
                
                console.log('✅ Final display text:', displayText);
                return displayText;
              })() : "Tắt"}
            </Tag>
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => handleOpenAutoUpdateModal(record)}
              title="Cài đặt cập nhật tự động"
            />
          </div>
          {record.autoUpdate?.enabled && (
            <div className="text-xs text-gray-500">
              <ClockCircleOutlined className="mr-1" />
              Tiếp theo: {formatNextUpdateTime(record.autoUpdate.nextUpdateAt)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tiến độ / Thao tác",
      key: "action",
      render: (_, record) => {
        const currentPercent = record.webhookData?.current_percent || record.autoUpdate?.current_percent || 0;
        const isUpdating = updatingServiceId === record._id || record.autoUpdate?.isUpdating;
        const canUpdate = currentPercent >= 100;
        
        return (
          <div className="space-y-2">
            {/* Hiển thị tiến độ */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                Tiến độ
                {currentPercent > 0 && currentPercent < 100 && (
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${
                      currentPercent >= 100 ? 'bg-green-500' : 
                      currentPercent >= 75 ? 'bg-blue-500' : 
                      currentPercent >= 50 ? 'bg-yellow-500' : 
                      currentPercent >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(currentPercent, 100)}%`,
                      transition: 'width 0.5s ease-out'
                    }}
                  ></div>
                  {currentPercent > 0 && currentPercent < 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                  )}
                </div>
                <span className="text-sm font-medium min-w-[3rem] transition-all duration-300">
                  {currentPercent}%
                </span>
              </div>
            </div>
            
            {/* Nút cập nhật - chỉ hiện khi đạt 100% */}
            {canUpdate ? (
              <Button
                type="primary"
                size="small"
                onClick={() => handleUpdateLinks(record)}
                loading={isUpdating}
                icon={isUpdating ? <LoadingOutlined /> : null}
                className="w-full"
              >
                {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            ) : (
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  {currentPercent > 0 ? `Chờ đạt 100% để cập nhật` : 'Chưa có dữ liệu'}
                </div>
              </div>
            )}
          </div>
        );
      },
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
            src={service.image && service.image.trim() !== ""
              ? service.image
              : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"}
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
                  handleServiceClickWithDateRange(record);
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
    const link = userService?.service?.authorizedLinks?.[0];
    console.log('Authorized link for service:', userService?.service?.name, link);
    return link;
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

  // Debug information
  console.log('User services data:', userData);
  console.log('Current user:', currentUser);

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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-center">
                Dịch vụ đang triển khai
              </h2>
              {activeServices.size > 0 && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isRealtimeUpdating ? 'bg-green-500 animate-pulse' : 'bg-green-400'}`}></div>
                  <span className="text-sm text-green-600 font-medium">
                    Realtime ({activeServices.size} dịch vụ)
                  </span>
                </div>
              )}
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
                            userService?.service?.image && userService.service.image.trim() !== ""
                              ? userService.service.image
                              : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
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
                          if (authorizedLink) {
                            handleServiceClickWithDateRange(userService);
                          } else {
                            alert('Dịch vụ này chưa có link kết nối. Vui lòng liên hệ quản trị viên.');
                          }
                        }}
                        className={`rounded-full px-8 py-2 font-semibold flex items-center gap-2 transition ${
                          authorizedLink 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-400 text-white cursor-not-allowed'
                        }`}
                        disabled={!authorizedLink}
                      >
                        {authorizedLink ? 'Kết nối' : 'Chưa có link'} <span>→</span>
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

      {/* Modal cài đặt auto update */}
      <Modal
        title="Cài đặt cập nhật tự động"
        open={autoUpdateModalVisible}
        onOk={handleSaveAutoUpdateSettings}
        onCancel={() => setAutoUpdateModalVisible(false)}
        okText="Lưu"
        cancelText="Hủy"
        width={500}
      >
        {selectedService && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Dịch vụ: {selectedService.service?.name}</h4>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Bật cập nhật tự động
              </label>
              <Switch
                checked={autoUpdateSettings.enabled}
                onChange={(checked) => setAutoUpdateSettings(prev => ({ ...prev, enabled: checked }))}
                checkedChildren="Bật"
                unCheckedChildren="Tắt"
              />
            </div>

            {autoUpdateSettings.enabled && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cài đặt lịch trình cập nhật
                </label>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Loại lịch trình
                    </label>
                    <Select
                      value={autoUpdateSettings.scheduleType}
                      onChange={(value) => setAutoUpdateSettings(prev => ({ ...prev, scheduleType: value }))}
                      style={{ width: '100%' }}
                      options={[
                        { value: 'daily', label: 'Hàng ngày' },
                        { value: 'weekly', label: 'Hàng tuần' },
                        { value: 'monthly', label: 'Hàng tháng' },
                        { value: 'once', label: 'Một lần duy nhất' }
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Thời gian cập nhật
                    </label>
                    <TimePicker
                      value={autoUpdateSettings.scheduleTime}
                      onChange={(time) => setAutoUpdateSettings(prev => ({ ...prev, scheduleTime: time }))}
                      format="HH:mm"
                      style={{ width: '100%' }}
                      placeholder="Chọn thời gian"
                    />
                  </div>

                  {autoUpdateSettings.scheduleType === 'once' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Ngày cập nhật
                      </label>
                      <DatePicker
                        value={autoUpdateSettings.scheduleDate}
                        onChange={(date) => setAutoUpdateSettings(prev => ({ ...prev, scheduleDate: date }))}
                        style={{ width: '100%' }}
                        placeholder="Chọn ngày"
                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                      />
                    </div>
                  )}

                  {autoUpdateSettings.scheduleType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Chọn ngày trong tuần
                      </label>
                      <Select
                        mode="multiple"
                        value={autoUpdateSettings.scheduleDays}
                        onChange={(values) => setAutoUpdateSettings(prev => ({ ...prev, scheduleDays: values }))}
                        style={{ width: '100%' }}
                        placeholder="Chọn các ngày"
                        options={[
                          { value: 1, label: 'Thứ 2' },
                          { value: 2, label: 'Thứ 3' },
                          { value: 3, label: 'Thứ 4' },
                          { value: 4, label: 'Thứ 5' },
                          { value: 5, label: 'Thứ 6' },
                          { value: 6, label: 'Thứ 7' },
                          { value: 0, label: 'Chủ nhật' }
                        ]}
                      />
                    </div>
                  )}

                  {autoUpdateSettings.scheduleTime && (
                    <div className="mt-2 text-sm text-gray-500">
                      Lịch trình: {formatIntervalDisplay(
                        null, 
                        autoUpdateSettings.scheduleType, 
                        autoUpdateSettings.scheduleTime.format('HH:mm')
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {autoUpdateSettings.enabled && (
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Thông tin hiện tại:</h5>
                <div className="text-sm space-y-1">
                  <div>Trạng thái: <Tag color="green">Đang bật</Tag></div>
                  <div>
                    Loại: <Tag color="blue">Lịch trình cố định</Tag><br/>
                    Lịch trình: {formatIntervalDisplay(
                      null,
                      autoUpdateSettings.scheduleType,
                      autoUpdateSettings.scheduleTime ? autoUpdateSettings.scheduleTime.format('HH:mm') : null
                    )}
                  </div>
                  {selectedService.autoUpdate?.lastUpdateAt && (
                    <div>Cập nhật cuối: {new Date(selectedService.autoUpdate.lastUpdateAt).toLocaleString('vi-VN')}</div>
                  )}
                  {selectedService.autoUpdate?.nextUpdateAt && (
                    <div>Cập nhật tiếp theo: {formatNextUpdateTime(selectedService.autoUpdate.nextUpdateAt)}</div>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>• Hệ thống sẽ tự động gọi các link cập nhật theo lịch trình đã chọn</p>
              <p>• Chỉ áp dụng cho các dịch vụ có link cập nhật</p>
              <p>• <strong>Lịch trình cố định:</strong> Cập nhật vào thời gian cụ thể mỗi ngày/tuần/tháng</p>
              <p>• <strong>Hàng ngày:</strong> Cập nhật vào thời gian đã chọn mỗi ngày</p>
              <p>• <strong>Hàng tuần:</strong> Cập nhật vào thời gian đã chọn vào các ngày được chọn trong tuần</p>
              <p>• <strong>Một lần:</strong> Cập nhật một lần duy nhất vào ngày và thời gian đã chọn</p>
              <p>• Bạn có thể tắt bất kỳ lúc nào</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal chọn ngày bắt đầu */}
      <Modal
        title="Chọn ngày bắt đầu (Tùy chọn)"
        open={dateRangeModalVisible}
        onOk={handleConnectWithDateRange}
        onCancel={() => {
          setDateRangeModalVisible(false);
          setStartDate(null);
        }}
        okText={startDate ? "Kết nối từ ngày đã chọn đến hiện tại" : "Kết nối không có thời gian"}
        cancelText="Hủy"
        width={500}
      >
        {selectedServiceForDateRange && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <img
                  src={
                    selectedServiceForDateRange?.service?.image && selectedServiceForDateRange.service.image.trim() !== ""
                      ? selectedServiceForDateRange.service.image
                      : "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg"
                  }
                  alt={selectedServiceForDateRange?.service?.name}
                  className="w-8 h-8 object-cover rounded"
                />
                {selectedServiceForDateRange.service?.name}
              </h4>
              <p className="text-sm text-gray-600">
                <strong className="text-blue-600">Tùy chọn:</strong> Chọn ngày bắt đầu, thời gian hiện tại sẽ tự động được lấy làm ngày kết thúc
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                <CalendarOutlined className="mr-2" />
                Chọn ngày bắt đầu <span className="text-gray-400">(tùy chọn)</span>
              </label>
              <DatePicker
                value={startDate}
                onChange={(date) => setStartDate(date)}
                style={{ width: '100%' }}
                placeholder="Chọn ngày bắt đầu"
                format="DD/MM/YYYY"
                allowClear
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
              {!startDate && (
                <div className="text-gray-500 text-xs mt-1">
                  Để trống nếu không muốn lọc theo thời gian
                </div>
              )}
            </div>

            {startDate && (
              <div className="bg-green-50 p-3 rounded">
                <h5 className="font-medium text-green-700 mb-1">Thông tin đã chọn:</h5>
                <div className="text-sm text-green-600">
                  <div>Từ ngày: <strong>{startDate.format('DD/MM/YYYY')}</strong></div>
                  <div>Đến ngày: <strong>{dayjs().format('DD/MM/YYYY')}</strong> (hiện tại)</div>
                  <div>Tổng số ngày: <strong>{dayjs().diff(startDate, 'days') + 1} ngày</strong></div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <div className="text-xs text-blue-700 space-y-1">
                <p>• <strong>Tùy chọn:</strong> Bạn có thể chọn hoặc không chọn ngày bắt đầu</p>
                <p>• <strong>Nếu chọn:</strong> Dữ liệu sẽ được lọc từ ngày đã chọn đến hiện tại</p>
                <p>• <strong>Nếu không chọn:</strong> Sẽ kết nối dịch vụ với toàn bộ dữ liệu</p>
                <p>• <strong>Tự động:</strong> Thời gian hiện tại sẽ tự động được lấy làm ngày kết thúc</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyService;