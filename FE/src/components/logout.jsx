import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import instance from '../utils/axiosInstance-cookie-only';

const Logout = () => {
  const navigate = useNavigate();

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

      // ✅ Cookie-only authentication: Backend đã clear cookie accessToken
      // ❌ Không cần xóa token từ localStorage vì không còn lưu ở đó
      // 🧹 Chỉ clear user data không nhạy cảm
      localStorage.removeItem('user');
      localStorage.removeItem('auth_timestamp');
      sessionStorage.removeItem('user');
      
      // Clear any cached user data
      if (window.userData) {
        delete window.userData;
      }
      
      // Clear React Query cache if available
      if (window.queryClient) {
        window.queryClient.clear();
      }
      
      // Clear any other potential auth data (except tokens since we don't store them anymore)
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
      
      // Dispatch events để thông báo cho các tab khác
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('authUpdate', { detail: null }));
      
      // Show success message
      toast.success('Đăng xuất thành công!');

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất!');
      
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
    >
      Đăng xuất
    </button>
  );
};

export default Logout;
