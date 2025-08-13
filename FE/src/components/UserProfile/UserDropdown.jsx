import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../core/Auth';
import RegisterOrganizationModal from './RegisterOrganizationModal';
import instance from '../../utils/axiosInstance-cookie-only';

const UserDropdown = ({ onLogoutSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const removeCurrentUser = authContext?.removeCurrentUser;
  // Show organization modal if needed later
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [loadingOrg, setLoadingOrg] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!currentUser || authContext?.isAdmin) return;
      setLoadingOrg(true);
      try {
        const response = await instance.get(`/organization/user/${currentUser._id}`);
        setHasOrganization(!!response.data);
      } catch {
        setHasOrganization(false);
      } finally {
        setLoadingOrg(false);
      }
    };
    fetchOrg();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      // Call backend logout API to clear cookie
      try {
        await instance.post('/auth/logout');
        console.log('Backend logout successful');
      } catch (apiError) {
        console.warn('Backend logout failed, continuing with client-side cleanup:', apiError);
        // Continue with client-side cleanup even if API fails
      }

      // Clear user data from context and storage
      removeCurrentUser();
      
      // Clear localStorage and sessionStorage
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Clear any cached user data
      if (window.userData) {
        delete window.userData;
      }
      
      // Clear React Query cache if available
      if (window.queryClient) {
        window.queryClient.clear();
      }
      
      // Clear any other potential auth data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('auth') || key.includes('user')) {
          sessionStorage.removeItem(key);
        }
      });

      toast.success('Đăng xuất thành công!');

      if (onLogoutSuccess) {
        onLogoutSuccess();
      }

      // Force a redirect to the homepage
      window.location.href = '/';

    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất!');
      
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const canRegisterOrg = authContext?.isAdmin || !hasOrganization;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 text-sm rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
        type="button"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {currentUser?.name || 'User'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentUser?.email || 'user@example.com'}
            </p>
            {currentUser?.role && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mt-1">
                                {authContext?.isAdmin ?
                (authContext?.isSuperAdmin ? 'Quản trị tối cao' :
                currentUser?.role === 'site_admin' ? 'Quản trị site' : 'Quản trị viên') : 'Người dùng'}
              </span>
            )}
          </div>
          
          <div className="py-1">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Thông tin cá nhân
              </div>
            </Link>
            
            <Link
              to="/profile/change-password"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Đổi mật khẩu
              </div>
            </Link>
            
            <Link
              to="/service/my-service"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Dịch vụ của tôi
              </div>
            </Link>
            
            {(authContext?.isAdmin) && (
              <Link
                to="/admin"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Quản trị
                </div>
              </Link>
            )}
            
            <button
              onClick={() => { if (canRegisterOrg) { setShowOrgModal(true); setIsOpen(false); } }}
              className={`block w-full text-left px-4 py-2 text-sm ${canRegisterOrg ? 'text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed'} `}
              disabled={!canRegisterOrg || loadingOrg}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Đăng ký tổ chức
              </div>
            </button>
            
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </div>
            </button>
          </div>
        </div>
      )}
      
      {/* Add the missing RegisterOrganizationModal */}
      <RegisterOrganizationModal
        isOpen={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        onSuccess={() => {
          setHasOrganization(true);
          setShowOrgModal(false);
        }}
        hasOrganization={hasOrganization}
        isAdmin={authContext?.isAdmin}
      />
     
    </div>
  );
};

export default UserDropdown; 