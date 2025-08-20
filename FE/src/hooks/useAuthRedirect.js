import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/core/Auth';

// Hook để xử lý redirect authentication một cách nhất quán
export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const checkAuthAndRedirect = () => {
    const currentPath = window.location.pathname;
    
    // Định nghĩa các routes cần authentication
    const protectedRoutes = [
      '/service/my-service', 
      '/profile', 
      '/admin',
      '/admin/iframe',
      '/admin/users',
      '/admin/blogs',
      '/admin/services',
      '/admin/status',
      '/admin/user-info',
      '/admin/sites',
      '/admin/site-form'
    ];
    const authRoutes = ['/login', '/logup', '/rest-password'];
    
    // Nếu đang ở route authentication và đã có user, redirect về trang chính
    if (authRoutes.includes(currentPath) && currentUser) {
      navigate('/service/my-service');
      return;
    }
    
    // Nếu đang ở protected route và không có user, redirect về login
    if (protectedRoutes.some(route => currentPath.startsWith(route)) && !currentUser) {
      // Lưu URL hiện tại để redirect sau khi login
      const redirectUrl = encodeURIComponent(currentPath);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }
  };
  
  const redirectToLogin = (redirectPath = null) => {
    const path = redirectPath ? `/login?redirect=${encodeURIComponent(redirectPath)}` : '/login';
    navigate(path);
  };
  
  const redirectAfterLogin = (defaultPath = '/service/my-service') => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('redirect');
    
    if (redirectPath) {
      window.location.href = decodeURIComponent(redirectPath);
    } else {
      window.location.href = defaultPath;
    }
  };
  
  return {
    checkAuthAndRedirect,
    redirectToLogin,
    redirectAfterLogin
  };
};
