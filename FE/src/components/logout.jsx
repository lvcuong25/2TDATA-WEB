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
      className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
    >
      Đăng xuất
    </button>
  );
};

export default Logout;
