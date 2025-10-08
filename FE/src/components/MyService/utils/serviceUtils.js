import dayjs from "dayjs";
import instance from "../../../utils/axiosInstance-cookie-only";
import { 
  createStateObject, 
  encodeState, 
  appendStateToUrl as appendStateToUrlHelper 
} from "../../../utils/serviceStateHelper";

// Hàm lấy URL sạch không có hash fragment
export const getCleanUrl = () => {
  try {
    const url = new URL(window.location.href);
    const cleanUrl = url.origin + url.pathname + url.search;
    console.log('Original URL:', window.location.href);
    console.log('Clean URL:', cleanUrl);
    return cleanUrl;
  } catch (error) {
    const currentUrl = window.location.href;
    const cleanUrl = currentUrl.split('#')[0];
    console.log('Fallback - Original URL:', currentUrl);
    console.log('Fallback - Clean URL:', cleanUrl);
    return cleanUrl;
  }
};

// Hàm kết nối dịch vụ với date range
export const connectServiceWithDateRange = async (currentUser, service, startDate, storageOption, visualizationTool) => {
  try {
    if (!currentUser?._id) {
      console.error('Missing user ID');
      alert('Vui lòng đăng nhập lại.');
      return;
    }

    const authorizedLink = service?.service?.authorizedLinks?.[0];
    if (!authorizedLink) {
      console.error('No authorized link found for service');
      return;
    }

    // Make the webhook request
    try {
      const response = await instance.post('https://auto.hcw.com.vn/webhook/e42a9c6d-e5c0-4c11-bfa9-56aa519e8d7c', {
        userId: currentUser?._id
      });
      console.log('Webhook response:', response?.status);
    } catch (webhookError) {
      console.warn('Webhook request failed, continuing with redirect:', webhookError);
    }

    // Tạo state object với dateRange
    let dateRangeData = null;
    if (startDate) {
      const endDate = dayjs();
      dateRangeData = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        startDateISO: startDate.toISOString(),
        endDateISO: endDate.toISOString()
      };
    }

    // Tạo thông tin cấu hình
    const configData = {
      storage: {
        type: storageOption
      },
      visualization: {
        tool: visualizationTool
      }
    };

    // Proceed with redirect
    const stateObj = createStateObject(currentUser, service, getCleanUrl(), dateRangeData, configData);
    const encodedState = encodeState(stateObj);
    const urlWithState = appendStateToUrlHelper(authorizedLink.url, encodedState);
    
    console.log('🚀 CONNECTING SERVICE WITH CONFIG:');
    console.log('📊 Service:', service?.service?.name);
    console.log('📅 Date Range:', dateRangeData);
    console.log('💾 Storage Option:', storageOption);
    console.log('📈 Visualization Tool:', visualizationTool);
    console.log('⚙️ Config Data:', configData);
    console.log('📦 Full State Object:', stateObj);
    console.log('🌐 Redirecting to:', urlWithState);
    
    window.location.href = urlWithState;
    
  } catch (error) {
    console.error('Error in connectServiceWithDateRange:', error);
    alert('Có lỗi xảy ra khi kết nối dịch vụ. Vui lòng thử lại.');
  }
};

// Hàm kết nối dịch vụ trực tiếp
export const connectServiceDirect = async (currentUser, service) => {
  try {
    if (!currentUser?._id) {
      console.error('Missing user ID');
      alert('Vui lòng đăng nhập lại.');
      return;
    }

    const authorizedLink = service?.service?.authorizedLinks?.[0];
    if (!authorizedLink) {
      console.error('No authorized link found for service');
      return;
    }

    // Make the webhook request
    try {
      const response = await instance.post('https://auto.hcw.com.vn/webhook/e42a9c6d-e5c0-4c11-bfa9-56aa519e8d7c', {
        userId: currentUser?._id
      });
      console.log('Webhook response:', response?.status);
    } catch (webhookError) {
      console.warn('Webhook request failed, continuing with redirect:', webhookError);
    }

    // Proceed with redirect
    const stateObj = createStateObject(currentUser, service, getCleanUrl());
    const encodedState = encodeState(stateObj);
    const urlWithState = appendStateToUrlHelper(authorizedLink.url, encodedState);
    
    console.log('Redirecting to:', urlWithState);
    console.log('State object being passed:', stateObj);
    window.location.href = urlWithState;
    
  } catch (error) {
    console.error('Error in connectServiceDirect:', error);
    alert('Có lỗi xảy ra khi kết nối dịch vụ. Vui lòng thử lại.');
  }
};

// Hàm cập nhật links
export const updateServiceLinks = async (record) => {
  try {
    if (record.link_update && record.link_update.length > 0) {
      await Promise.all(
        record.link_update.map(link => {
          if (link.url) {
            return fetch(link.url, { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              mode: 'cors'
            }).catch(error => {
              console.error('Error calling update link:', error.message);
              return null;
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
  }
};

// Hàm tìm authorized link
export const findAuthorizedLink = (userService) => {
  const link = userService?.service?.authorizedLinks?.[0];
  console.log('Authorized link for service:', userService?.service?.name, link);
  return link;
};

// Hàm format interval display
export const formatIntervalDisplay = (interval, scheduleType, scheduleTime) => {
  console.log('formatIntervalDisplay called with:', { 
    interval, 
    scheduleType, 
    scheduleTime,
    intervalType: typeof interval,
    scheduleTypeType: typeof scheduleType,
    scheduleTimeType: typeof scheduleTime
  });
  
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

// Hàm format next update time
export const formatNextUpdateTime = (nextUpdateAt) => {
  if (!nextUpdateAt) return 'Không có';
  const date = new Date(nextUpdateAt);
  return date.toLocaleString('vi-VN');
};

// Hàm tính next update time
export const calculateNextUpdateTime = (autoUpdateSettings) => {
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
    const currentDay = now.day();
    const nextDays = scheduleDays.filter(day => day > currentDay);
    
    if (nextDays.length > 0) {
      const nextDay = Math.min(...nextDays);
      const daysToAdd = nextDay - currentDay;
      return dayjs(`${now.format('YYYY-MM-DD')} ${scheduleTime.format('HH:mm')}`).add(daysToAdd, 'days').toISOString();
    } else {
      const nextWeekDay = Math.min(...scheduleDays);
      const daysToAdd = 7 - currentDay + nextWeekDay;
      return dayjs(`${now.format('YYYY-MM-DD')} ${scheduleTime.format('HH:mm')}`).add(daysToAdd, 'days').toISOString();
    }
  }
  
  return null;
};
