import React, { createContext, useEffect, useState } from "react";
import { getUserByToken } from "./_request"; // adjust the path according to your project structure
import { getAuth, removeAuth, setAuth } from "./AuthHelper";

const AuthContext = createContext();

export const fetchUser = async (setCurrentUser) => {
  console.log('fetchUser: Starting...');
  // ✅ Cookie-only authentication: Không cần kiểm tra token từ localStorage
  // 🔒 Token được gửi tự động qua HTTP-only cookie
  
  // Thử lấy user data từ localStorage trước để hiển thị nhanh
  const storedUser = localStorage.getItem('user');
  console.log('fetchUser: storedUser from localStorage:', storedUser ? 'exists' : 'not found');
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      console.log('fetchUser: Setting user from localStorage temporarily:', userData);
      setCurrentUser(userData);
      // Không return ngay, vẫn gọi API để verify
    } catch (error) {
      console.log('Error parsing stored user data:', error);
      localStorage.removeItem('user'); // Remove invalid data
    }
  }
  
  try {
    console.log('fetchUser: Calling getUserByToken API...');
    const response = await getUserByToken();
    console.log('fetchUser: API response:', response);
    
    // Kiểm tra response có hợp lệ không
    if (response && response.data) {
      const userData = response.data;
      console.log('fetchUser: User data:', userData);
      
      // Kiểm tra user data có _id không
      if (userData._id) {
        setAuth(userData);
        setCurrentUser(userData);
        // Lưu user data vào localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('fetchUser: User data saved to localStorage');
      } else {
        console.log('fetchUser: User data missing _id, clearing auth');
        removeAuth();
        setCurrentUser(null);
        localStorage.removeItem('user');
      }
    } else if (response && response._id) {
      // Trường hợp response trực tiếp là user data
      const userData = response;
      console.log('fetchUser: Direct user data:', userData);
      
      if (userData._id) {
        setAuth(userData);
        setCurrentUser(userData);
        // Lưu user data vào localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('fetchUser: User data saved to localStorage');
      } else {
        console.log('fetchUser: User data missing _id, clearing auth');
        removeAuth();
        setCurrentUser(null);
        localStorage.removeItem('user');
      }
    } else {
      console.log('fetchUser: No user data from API, clearing auth');
      removeAuth();
      setCurrentUser(null);
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.log('Auth fetch error:', error);
    
    // Handle specific error cases
    if (error?.error === 'USER_INACTIVE') {
      console.log('User is inactive, clearing auth data...');
      removeAuth();
      setCurrentUser(null);
      localStorage.removeItem('user');
      
      // Show user-friendly message if toast is available
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
      }
    } else {
      // Handle other errors (token expired, invalid, etc.)
      console.log('fetchUser: Clearing auth due to error:', error.message);
      removeAuth();
      setCurrentUser(null);
      localStorage.removeItem('user');
    }
  }
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Initialize as null instead of getAuth()
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    
    // Kiểm tra user data từ localStorage trước
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Validate the parsed data has required fields
        if (userData && userData._id && userData.role) {
          console.log('AuthProvider: Found valid stored user data:', userData);
          setCurrentUser(userData);
        } else {
          console.log('AuthProvider: Invalid stored user data, removing...');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.log('AuthProvider: Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    
    // Sau đó gọi API để verify
    fetchUser(setCurrentUser).finally(() => {
      setIsLoading(false);
    });
    
    // Set up periodic user status check (every 5 minutes)
    const statusCheckInterval = setInterval(() => {
      // ✅ Cookie-only authentication: Luôn kiểm tra user status
      // 🔒 Không cần kiểm tra token từ localStorage
      fetchUser(setCurrentUser);
    }, 5 * 60 * 1000); // 5 minutes
    
    // Listen for storage changes (when user data is updated)
    const handleStorageChange = () => {
      console.log('AuthProvider: Storage event detected, refreshing user data...');
      fetchUser(setCurrentUser);
    };
    
    // Listen for custom auth update events
    const handleAuthUpdate = (event) => {
      console.log('AuthProvider: Auth update event detected, setting user data...');
      if (event.detail && event.detail._id && event.detail.role) {
        setCurrentUser(event.detail);
      } else {
        setCurrentUser(null);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authUpdate', handleAuthUpdate);
    
    return () => {
      clearInterval(statusCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authUpdate', handleAuthUpdate);
    };
  }, []);
  
  useEffect(() => {
    console.log('AuthProvider: currentUser changed:', currentUser);
  }, [currentUser]);

  const removeCurrentUser = () => {
    removeAuth();
    setCurrentUser(null);
    localStorage.removeItem('user');
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
    isAuthenticated: () => !!(currentUser && currentUser._id && currentUser.role)
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
