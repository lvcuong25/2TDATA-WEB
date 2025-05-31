import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useContext } from 'react';
import { AuthContext } from './core/Auth';
import { useQuery } from '@tanstack/react-query';
import instance from '../utils/axiosInstance';

const MyService = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['myServices', currentUser?._id],
    queryFn: async () => {
      const response = await instance.get(`/user/${currentUser._id}`);
      return response.data;
    },
  });

  const handleServiceClick = (service) => {
    navigate(`/service/slug/${service.service.slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto pt-[100px] py-12">
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Dịch vụ của tôi</h2>
          
          {!userData?.data?.service || userData.data.service.length === 0 ? (
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
              {userData.data.service.map((service) => (
                <div 
                  key={service._id}
                  className={`bg-white rounded-2xl p-6 flex flex-col items-center shadow ${
                    service.status === 'approved' ? 'cursor-pointer hover:shadow-lg transition' : ''
                  }`}
                  onClick={() => service.status === 'approved' && handleServiceClick(service)}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                    <img 
                      src={service.service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                      alt={service.service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-semibold mb-2 capitalize">{service.service.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {new Date(service.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      service.status === 'approved' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : service.status === 'waiting'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {service.status === 'approved' ? 'Đã xác nhận' : 
                       service.status === 'waiting' ? 'Đang chờ' : 'Bị từ chối'}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (service.status === 'approved') {
                        handleServiceClick(service);
                      }
                    }}
                    className={`rounded-full px-8 py-2 font-semibold flex items-center gap-2 transition ${
                      service.status === 'approved'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={service.status !== 'approved'}
                  >
                    Xem chi tiết <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default MyService;