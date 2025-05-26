import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useContext, useState } from 'react';
import { AuthContext } from './core/Auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import instance from '../utils/axiosInstance';
import { Modal, message } from 'antd';

const MyService = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [serviceToCancel, setServiceToCancel] = useState(null);
  const queryClient = useQueryClient();

  const cancelServiceMutation = useMutation({
    mutationFn: async (serviceId) => {
      // Get current user's services
      const currentServices = currentUser?.service || [];
      // Filter out the service to cancel
      const updatedServices = currentServices
        .filter(s => (s.serviceId?._id || s._id) !== serviceId)
        .map(s => s.serviceId?._id || s._id);

      // Update user with remaining services
      const { data } = await instance.put(`/user/${currentUser._id}`, {
        service: updatedServices
      });
      return data;
    },
    onSuccess: () => {
      message.success('Hủy dịch vụ thành công!');
      setIsCancelModalVisible(false);
      setServiceToCancel(null);
      // Refresh the page to update the user's services
      window.location.reload();
    },
    onError: (error) => {
      console.error("Error canceling service:", error);
      message.error(error.response?.data?.message || 'Hủy dịch vụ thất bại!');
    },
  });

  const handleServiceClick = (service) => {
    navigate(`/service/slug/${service.slug}`);
  };

  const handleCancelClick = (service, e) => {
    e.stopPropagation(); // Prevent navigation when clicking cancel
    setServiceToCancel(service);
    setIsCancelModalVisible(true);
  };

  const confirmCancel = () => {
    if (serviceToCancel) {
      cancelServiceMutation.mutate(serviceToCancel.serviceId?._id || serviceToCancel._id);
    }
  };

  const userServices = currentUser?.service || [];

  return (
    <div>
      <Header />
      <div className="container mx-auto pt-[100px] py-12">
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Dịch vụ của tôi</h2>
          
          {userServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bạn chưa đăng ký dịch vụ nào</p>
              <button 
                onClick={() => navigate('/service')}
                className="bg-red-500 text-white px-8 py-2 rounded-full hover:bg-red-600 transition"
              >
                Đăng ký dịch vụ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userServices.map((service) => (
                <div 
                  key={service._id}
                  className="bg-white rounded-2xl p-6 flex flex-col items-center shadow cursor-pointer hover:shadow-lg transition"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                    <img 
                      src={service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-semibold mb-4 capitalize">{service.name}</div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      service.status 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {service.status ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="bg-red-500 text-white rounded-full px-8 py-2 font-semibold flex items-center gap-2 hover:bg-red-600 transition"
                    >
                      Xem chi tiết <span>→</span>
                    </button>
                    <button 
                      onClick={(e) => handleCancelClick(service, e)}
                      className="bg-gray-200 text-gray-700 rounded-full px-4 py-2 font-semibold hover:bg-gray-300 transition"
                    >
                      Hủy dịch vụ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        title="Xác nhận hủy dịch vụ"
        open={isCancelModalVisible}
        onOk={confirmCancel}
        onCancel={() => {
          setIsCancelModalVisible(false);
          setServiceToCancel(null);
        }}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ 
          className: 'bg-red-500 hover:bg-red-600',
          loading: cancelServiceMutation.isPending 
        }}
      >
        <p>Bạn có chắc chắn muốn hủy dịch vụ "{serviceToCancel?.name}" không?</p>
        <p className="text-red-500 mt-2">Lưu ý: Hành động này không thể hoàn tác.</p>
      </Modal>

      <Footer />
    </div>
  );
};

export default MyService;