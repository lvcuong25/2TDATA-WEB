import React, { createContext, useEffect, useState, useRef, useCallback } from "react";
import { getUserByToken } from "./_request"; // adjust the path according to your project structure
import { getAuth, removeAuth, setAuth } from "./AuthHelper";
import { useTabSync } from "../../hooks/useTabSync";

const AuthContext = createContext();

// Tạo unique ID cho mỗi tab để tránh conflict
const TAB_ID = Math.random().toString(36).substr(2, 9);
const AUTH_STORAGE_KEY = 'user';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

export const fetchUser = async (setCurrentUser, tabId = TAB_ID) => {
  console.log(`[Tab ${tabId}] fetchUser: Starting...`);
  
  // Kiểm tra timestamp để tránh gọi API quá nhiều
  const lastFetchTime = localStorage.getItem(AUTH_TIMESTAMP_KEY);
  const now = Date.now();
  const timeSinceLastFetch = now - (lastFetchTime ? parseInt(lastFetchTime) : 0);
  
  // Nếu vừa fetch gần đây (< 30 giây), chỉ đọc từ localStorage
  if (timeSinceLastFetch < 30000) {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData._id && userData.role) {
          console.log(`[Tab ${tabId}] fetchUser: Using cached data from localStorage`);
          setCurrentUser(userData);
          return;
        }
      } catch (error) {
        console.log(`[Tab ${tabId}] Error parsing stored user data:`, error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }
  
  // Thử lấy user data từ localStorage trước để hiển thị nhanh
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  console.log(`[Tab ${tabId}] fetchUser: storedUser from localStorage:`, storedUser ? 'exists' : 'not found');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      console.log(`[Tab ${tabId}] fetchUser: Setting user from localStorage temporarily:`, userData);
      setCurrentUser(userData);
      // Không return ngay, vẫn gọi API để verify
    } catch (error) {
      console.log(`[Tab ${tabId}] Error parsing stored user data:`, error);
      localStorage.removeItem(AUTH_STORAGE_KEY); // Remove invalid data
    }
  }
  
  try {
    console.log(`[Tab ${tabId}] fetchUser: Calling getUserByToken API...`);
    const response = await getUserByToken();
    console.log(`[Tab ${tabId}] fetchUser: API response:`, response);
    
    // Cập nhật timestamp
    localStorage.setItem(AUTH_TIMESTAMP_KEY, now.toString());
    
    // Kiểm tra response có hợp lệ không
    if (response && response.data) {
      const userData = response.data;
      console.log(`[Tab ${tabId}] fetchUser: User data:`, userData);
      
      // Kiểm tra user data có _id không
      if (userData._id) {
        setAuth(userData);
        setCurrentUser(userData);
        // Lưu user data vào localStorage với timestamp
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        console.log(`[Tab ${tabId}] fetchUser: User data saved to localStorage`);
      } else {
        console.log(`[Tab ${tabId}] fetchUser: User data missing _id, clearing auth`);
        removeAuth();
        setCurrentUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      }
    } else if (response && response._id) {
      // Trường hợp response trực tiếp là user data
      const userData = response;
      console.log(`[Tab ${tabId}] fetchUser: Direct user data:`, userData);
      
      if (userData._id) {
        setAuth(userData);
        setCurrentUser(userData);
        // Lưu user data vào localStorage với timestamp
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        console.log(`[Tab ${tabId}] fetchUser: User data saved to localStorage`);
      } else {
        console.log(`[Tab ${tabId}] fetchUser: User data missing _id, clearing auth`);
        removeAuth();
        setCurrentUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      }
    } else {
      console.log(`[Tab ${tabId}] fetchUser: No user data from API, clearing auth`);
      removeAuth();
      setCurrentUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.log(`[Tab ${tabId}] Auth fetch error:`, error);
    
    // Handle specific error cases
    if (error?.error === 'USER_INACTIVE') {
      console.log(`[Tab ${tabId}] User is inactive, clearing auth data...`);
      removeAuth();
      setCurrentUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      
      // Show user-friendly message if toast is available
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
      }
    } else {
      // Handle other errors (token expired, invalid, etc.)
      console.log(`[Tab ${tabId}] fetchUser: Clearing auth due to error:`, error.message);
      removeAuth();
      setCurrentUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    }
  }
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const statusCheckIntervalRef = useRef(null);
  
  // Callback để xử lý auth changes từ các tab khác
  const handleAuthChange = useCallback((event) => {
    console.log(`[Tab ${TAB_ID}] Auth change detected:`, event.type || event.key);
    
    // Thêm delay nhỏ để tránh race condition
    setTimeout(() => {
      fetchUser(setCurrentUser, TAB_ID);
    }, 100);
  }, []);
  
  // Sử dụng useTabSync hook
  const { notifyAuthChange } = useTabSync(handleAuthChange);
  
  useEffect(() => {
    console.log(`[Tab ${TAB_ID}] AuthProvider: Initializing...`);
    
    // Tránh khởi tạo nhiều lần
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;
    
    // Kiểm tra user data từ localStorage trước
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate the parsed data has required fields
        if (userData && userData._id && userData.role) {
          console.log(`[Tab ${TAB_ID}] AuthProvider: Found valid stored user data:`, userData);
          setCurrentUser(userData);
        } else {
          console.log(`[Tab ${TAB_ID}] AuthProvider: Invalid stored user data, removing...`);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        }
      } catch (error) {
        console.log(`[Tab ${TAB_ID}] AuthProvider: Error parsing stored user data:`, error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
      }
    }
    
    // Sau đó gọi API để verify
    fetchUser(setCurrentUser, TAB_ID).finally(() => {
      setIsLoading(false);
    });
    
    // Set up periodic user status check (every 5 minutes)
    statusCheckIntervalRef.current = setInterval(() => {
      console.log(`[Tab ${TAB_ID}] Periodic auth check...`);
      fetchUser(setCurrentUser, TAB_ID);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    console.log(`[Tab ${TAB_ID}] AuthProvider: currentUser changed:`, currentUser);
  }, [currentUser]);

  const removeCurrentUser = () => {
    removeAuth();
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    
    // Thông báo cho các tab khác
    notifyAuthChange(null);
  };

  // Helper function to safely check user role
  const checkUserRole = (user, roles) => {
    if (!user || !user.role || !Array.isArray(roles)) {
      return false;
    }
    return roles.includes(user.role);
  };

  // Add error boundary for authentication context with comprehensive null checks
  const contextValue = {
    currentUser, 
    setCurrentUser, 
    removeCurrentUser, 
    isLogin: !!(currentUser && currentUser._id), 
    isLoading,
    // Add safe role check helper with comprehensive null checks
    isAdmin: checkUserRole(currentUser, ["admin", "super_admin", "site_admin"]),
    isSuperAdmin: checkUserRole(currentUser, ["super_admin"]),
    // Additional helper methods for safer role checking
    hasRole: (role) => currentUser && currentUser.role === role,
    hasAnyRole: (roles) => checkUserRole(currentUser, roles),
    getUserRole: () => currentUser && currentUser.role ? currentUser.role : null,
    isAuthenticated: () => !!(currentUser && currentUser._id && currentUser.role),
    // Expose notifyAuthChange for external use
    notifyAuthChange
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
