import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // Clear authentication data
      localStorage.removeItem('accessToken');
      
      // Show success message
      toast.success('Đăng xuất thành công!');
      
      // Redirect to login page
      navigate('/');
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đăng xuất!');
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
