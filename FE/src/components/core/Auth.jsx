import React, { createContext, useEffect, useState } from "react";
import { getUserByToken } from "./_request"; // adjust the path according to your project structure
import { getAuth, removeAuth, setAuth } from "./AuthHelper";

const AuthContext = createContext();
export const fetchUser = async (setCurrentUser) => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    removeAuth();
    setCurrentUser(null);
    return;
  }
  try {
    const { data } = await getUserByToken();
    if (data) {
      setAuth(data);
      setCurrentUser(data);
    } else {
      removeAuth();
      setCurrentUser(null);
    }
  } catch (error) {
    console.log('Auth fetch error:', error);
    
    // Handle specific error cases
    if (error?.error === 'USER_INACTIVE') {
      console.log('User is inactive, clearing auth data...');
      removeAuth();
      setCurrentUser(null);
      
      // Show user-friendly message if toast is available
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.');
      }
    } else {
      // Handle other errors (token expired, invalid, etc.)
      removeAuth();
      setCurrentUser(null);
    }
  }
};

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getAuth());
  
  useEffect(() => {
    fetchUser(setCurrentUser);
    
    // Set up periodic user status check (every 5 minutes)
    const statusCheckInterval = setInterval(() => {
      if (localStorage.getItem('accessToken')) {
        fetchUser(setCurrentUser);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(statusCheckInterval);
    };
  }, []);

  const removeCurrentUser = () => {
    removeAuth();
    setCurrentUser(null);
  };

  useEffect(() => {
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, removeCurrentUser, isLogin: !!currentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };