/**
 * Utility functions để xử lý state khi chuyển người dùng sang site khác
 */

// Hàm decode state từ URL parameter
export function decodeStateFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get('state');
    
    if (!stateParam) {
      console.log('No state parameter found in URL');
      return null;
    }

    // Decode base64 state
    const decodedState = decodeURIComponent(escape(atob(stateParam)));
    const stateObj = JSON.parse(decodedState);
    
    console.log('Decoded state from URL:', stateObj);
    return stateObj;
  } catch (error) {
    console.error('Error decoding state from URL:', error);
    return null;
  }
}

// Hàm lấy thông tin user từ state
export function getUserInfoFromState(state) {
  if (!state) return null;
  
  return {
    userId: state.userId,
    name: state.name,
    serviceId: state.serviceId
  };
}

// Hàm lấy thông tin service từ state
export function getServiceInfoFromState(state) {
  if (!state) return null;
  
  return {
    serviceId: state.serviceId,
    serviceName: state.serviceName,
    serviceSlug: state.serviceSlug,
    serviceImage: state.serviceImage,
    serviceDescription: state.serviceDescription,
    userServiceStatus: state.userServiceStatus,
    userServiceCreatedAt: state.userServiceCreatedAt,
    userServiceUpdatedAt: state.userServiceUpdatedAt,
    resultLinks: state.resultLinks || [],
    updateLinks: state.updateLinks || [],
    authorizedLinks: state.authorizedLinks || [],
    dateRange: state.dateRange || null,
    config: state.config || null
  };
}

// Hàm lấy thông tin dateRange từ state
export function getDateRangeFromState(state) {
  if (!state || !state.dateRange) return null;
  
  return {
    startDate: state.dateRange.startDate,
    endDate: state.dateRange.endDate,
    startDateISO: state.dateRange.startDateISO,
    endDateISO: state.dateRange.endDateISO
  };
}

// Hàm lấy thông tin cấu hình từ state
export function getConfigFromState(state) {
  if (!state || !state.config) return null;
  
  return {
    storage: state.config.storage || null,
    visualization: state.config.visualization || null
  };
}

// Hàm kiểm tra xem có state trong URL không
export function hasStateInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('state');
}

// Hàm xóa state khỏi URL (sau khi đã xử lý)
export function removeStateFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
  } catch (error) {
    console.error('Error removing state from URL:', error);
  }
}

// Hàm tạo state object để truyền sang site khác
export function createStateObject(user, service, returnUrl, dateRange = null, configData = null) {
  const stateObj = {
    userId: user?._id || "",
    name: user?.name || "",
    serviceId: service?._id || "",
    serviceName: service?.service?.name || "",
    serviceSlug: service?.service?.slug || "",
    serviceImage: service?.service?.image || "",
    serviceDescription: service?.service?.description || "",
    userServiceStatus: service?.status || "",
    userServiceCreatedAt: service?.createdAt || "",
    userServiceUpdatedAt: service?.updatedAt || "",
    resultLinks: service?.link || [],
    updateLinks: service?.link_update || [],
    authorizedLinks: service?.service?.authorizedLinks || [],
    returnUrl: returnUrl || ""
  };

  // Thêm thông tin dateRange nếu có
  if (dateRange) {
    stateObj.dateRange = dateRange;
  }

  // Thêm thông tin cấu hình nếu có
  if (configData) {
    stateObj.config = configData;
  }

  return stateObj;
}

// Hàm encode state thành base64
export function encodeState(stateObj) {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(stateObj))));
  } catch (error) {
    console.error('Error encoding state:', error);
    return null;
  }
}

// Hàm thêm state vào URL
export function appendStateToUrl(url, stateValue) {
  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('state', stateValue);
    return urlObj.toString();
  } catch (error) {
    console.error('Error appending state to URL:', error);
    return url;
  }
}
