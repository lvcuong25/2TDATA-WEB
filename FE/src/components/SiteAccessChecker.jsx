import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './core/Auth';
import { useSite } from '../context/SiteContext';
import instance from '../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';

const SiteAccessChecker = ({ children }) => {
  const { currentUser, removeCurrentUser } = useContext(AuthContext);
  const { currentSite } = useSite();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(10); // 10 giây countdown

  useEffect(() => {
    checkSiteAccess();
  }, [currentUser, currentSite]);

  // Auto reload countdown
  useEffect(() => {
    if (showAccessDenied && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showAccessDenied && countdown === 0) {
      // Tự động logout và reload sau 10 giây
      handleAutoLogout();
    }
  }, [showAccessDenied, countdown]);

  const checkSiteAccess = async () => {
    // Skip nếu chưa đăng nhập
    if (!currentUser?._id) {
      setShowAccessDenied(false);
      return;
    }

    // Super admin có thể truy cập mọi site  
    if (currentUser.role === 'super_admin') {
      setShowAccessDenied(false);
      return;
    }

    // Đợi có thông tin site
    if (!currentSite?._id) {
      return;
    }

    // Kiểm tra user có thuộc site hiện tại không
    const userSiteId = currentUser.site_id?._id || currentUser.site_id;
    const currentSiteId = currentSite._id;
    
    console.log('🔍 Site Access Check:', {
      userEmail: currentUser.email,
      userSiteId: userSiteId?.toString(),
      currentSiteId: currentSiteId?.toString(),
      currentSiteName: currentSite.name,
      currentDomain: window.location.hostname
    });

    if (userSiteId?.toString() !== currentSiteId?.toString()) {
      console.log('❌ SITE ACCESS DENIED - User site mismatch');
      setShowAccessDenied(true);
      setCountdown(10); // Reset countdown
      return;
    }

    setShowAccessDenied(false);
  };

  const handleAutoLogout = async () => {
    console.log('🔄 Auto logout triggered after countdown');
    await performLogout();
  };

  const handleManualLogout = async () => {
    console.log('👆 Manual logout triggered');
    await performLogout();
  };

  const performLogout = async () => {
    try {
      setIsChecking(true);
      
      // Call backend logout API
      try {
        await instance.post('/auth/logout');
        console.log('✅ Backend logout successful');
      } catch (apiError) {
        console.warn('⚠️ Backend logout failed, continuing with cleanup:', apiError);
      }

      // Clear all data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      removeCurrentUser();
      toast.success('Đăng xuất thành công!');
      
      // Redirect về trang chủ
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất!');
      window.location.href = '/';
    } finally {
      setIsChecking(false);
    }
  };

  // Nếu bị từ chối truy cập, hiện trang thông báo với countdown
  if (showAccessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚫 Không thể truy cập site này
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn đã được chuyển sang site khác. 
            <br />Hệ thống sẽ tự động đăng xuất sau <span className="font-bold text-red-600">{countdown}</span> giây.
          </p>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            ></div>
          </div>

          {/* Site Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <p><strong>Site hiện tại:</strong> {currentSite?.name}</p>
            <p><strong>Domain:</strong> {window.location.hostname}</p>
            <p><strong>Tài khoản:</strong> {currentUser?.email}</p>
          </div>

          {/* Manual Logout Button */}
          <button
            onClick={handleManualLogout}
            disabled={isChecking}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
          >
            {isChecking ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang đăng xuất...
              </>
            ) : (
              <>
                🔓 Đăng xuất ngay
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Hoặc chờ {countdown} giây để tự động đăng xuất
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default SiteAccessChecker;
