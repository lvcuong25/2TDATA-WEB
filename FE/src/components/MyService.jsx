import {  useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useContext } from 'react';
import { AuthContext } from './core/Auth';
import { useQuery } from '@tanstack/react-query';
import instance from '../utils/axiosInstance';
import { Tag, Table, Space, Card, Button, Tooltip } from 'antd';
import { LinkOutlined } from "@ant-design/icons";

const MyService = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['myServices', currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser._id}`);
      console.log(response.data);
      return response.data;
    },
    enabled: !!currentUser?._id,
  });

  const handleServiceClick = (service) => {
    // Find the authority link
    const authorityLink = service.link?.find(link => link.type === 'authority');
    if (authorityLink) {
      window.open(authorityLink.url, '_blank');
    } else {
      console.log('No authority link found for this service.', service);
      // Optional: Show a message to the user indicating no link is available
    }
  };

  const columns = [
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      render: (service) => (
        <div className="flex items-center gap-2">
          <img 
            src={service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
            alt={service.name}
            className="w-10 h-10 object-cover rounded"
          />
          <div>
            <div className="font-medium">{service.name}</div>
            <div className="text-sm text-gray-500">{service.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'approved' ? 'green' : 
          status === 'waiting' ? 'orange' : 
          'red'
        }>
          {status === 'approved' ? 'Đã xác nhận' : 
           status === 'waiting' ? 'Đang chờ' : 
           'Bị từ chối'}
        </Tag>
      ),
    },
    {
      title: 'Links Kết quả',
      dataIndex: 'link',
      key: 'resultLinks',
      render: (links) => {
        const resultLinks = links?.filter(link => link.type === 'result') || [];
        return resultLinks.length > 0 ? (
          <Space direction="vertical">
            {resultLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <Tooltip title={link.description || 'Không có mô tả'}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {link.title}
                  </a>
                </Tooltip>
              </div>
            ))}
          </Space>
        ) : (
          'Chưa có link kết quả'
        );
      },
    },
    {
      title: 'Registered At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
  ];

  // Find if there is an authority link for conditional rendering
  const findAuthorityLink = (userService) => {
    return userService.link?.find(link => link.type === 'authority');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!userData || !userData.data || !userData.data.service) {
      return (
          <div>
              <Header />
              <div className="container mx-auto pt-[100px] py-12">
                  <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8 text-center">
                      <h2 className="text-2xl font-bold mb-8">Dịch vụ của tôi</h2>
                      <p className="text-gray-600 mb-4">Không thể tải dữ liệu dịch vụ.</p>
                  </section>
              </div>
              <Footer />
          </div>
      );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto pt-[100px] py-12">
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Dịch vụ đang triển khai</h2>
          
          {!userData.data.service || userData.data.service.length === 0 ? (
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
              {userData.data.service.map((userService) => {
                 const authorityLink = findAuthorityLink(userService);
                return (
                <div 
                  key={userService._id}
                  className={`bg-white rounded-2xl p-6 flex flex-col items-center shadow ${
                    userService.status === 'approved' && authorityLink ? 'cursor-pointer hover:shadow-lg transition' : ''
                  }`}
                  onClick={() => userService.status === 'approved' && authorityLink && handleServiceClick(userService)}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                    <img 
                      src={userService.service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                      alt={userService.service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-semibold mb-2 capitalize">{userService.service.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Ngày đăng ký: {new Date(userService.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Tag color={
                      userService.status === 'approved' ? 'green' : 
                      userService.status === 'waiting' ? 'orange' : 
                      'red'
                    }>
                      {userService.status === 'approved' ? 'Đã xác nhận' : 
                       userService.status === 'waiting' ? 'Đang chờ' : 'Bị từ chối'}
                    </Tag>
                  </div>
                  {userService.status === 'approved' && authorityLink ? (
                     <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceClick(userService);
                        }}
                        className="bg-blue-500 text-white rounded-full px-8 py-2 font-semibold flex items-center gap-2 hover:bg-blue-600 transition"
                      >
                       Kết nối<span>→</span>
                      </button>
                  ) : (
                     <button 
                        className={`rounded-full px-8 py-2 font-semibold flex items-center gap-2 transition ${
                          userService.status === 'waiting' ? 'bg-yellow-500 text-white cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled
                      >
                        {userService.status === 'waiting' ? 'Đang chờ' : 'Chưa có link uy quyền'} <span>→</span>
                      </button>
                  )}
                </div>
              )})}
            </div>
          )}
        </section>

        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Danh sách dịch vụ</h2>
           {!userData.data.service || userData.data.service.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Bạn chưa đăng ký dịch vụ nào</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={userData.data.service}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default MyService;