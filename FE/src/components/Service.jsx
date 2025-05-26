import Header from "./Header";
import Footer from "./Footer";  
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import instance from '../utils/axiosInstance';
import { AuthContext } from './core/Auth';
import { useContext, useState } from "react";
import { Modal, Form, Input, Button, message, Select, Tag, Checkbox } from 'antd';

const { Option } = Select;

const Service = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [form] = Form.useForm();

  const { data, refetch } = useQuery({
    queryKey: ['userServices'],
    queryFn: async () => {
      const { data } = await instance.get('service');
      return data;
    },
  });

  // Get user's registered service IDs
  const registeredServiceIds = currentUser?.service?.map(s => s.serviceId?._id || s._id) || [];

  const registerMutation = useMutation({
    mutationFn: async (formData) => {
      // First update user profile
      await instance.put(`/user/${currentUser._id}`, formData);
      
      // Get current user's services
      const currentServices = currentUser?.service || [];
      const currentServiceIds = currentServices.map(s => s.serviceId?._id || s._id);

      // Combine current services with new ones
      const allServiceIds = [...currentServiceIds, ...selectedServices.map(s => s._id)];
      
      // Update user with all services
      const { data } = await instance.put(`/user/${currentUser._id}`, {
        service: allServiceIds
      });
      return data;
    },
    onSuccess: () => {
      message.success(`Đăng ký ${selectedServices.length} dịch vụ thành công! Vui lòng chờ admin duyệt.`);
      setIsModalVisible(false);
      form.resetFields();
      setSelectedServices([]);
      // Refresh the page to update the user's services
      window.location.reload();
    },
    onError: (error) => {
      console.error("Error registering services:", error);
      message.error(error.response?.data?.message || 'Đăng ký dịch vụ thất bại!');
    },
  });

  const handleSubmit = (values) => {
    if (selectedServices.length === 0) {
      message.warning('Vui lòng chọn ít nhất một dịch vụ!');
      return;
    }
    registerMutation.mutate(values);
  };

  const handleServiceSelect = (service, checked) => {
    if (checked) {
      setSelectedServices([...selectedServices, service]);
    } else {
      setSelectedServices(selectedServices.filter(s => s._id !== service._id));
    }
  };

  const handleRegisterClick = (service) => {
    if (registeredServiceIds.includes(service._id)) {
      message.info('Bạn đã đăng ký dịch vụ này rồi!');
      return;
    }
    setSelectedServices([service]);
    setIsModalVisible(true);
    // Pre-fill form with user data if available
    form.setFieldsValue({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || ''
    });
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto pt-[100px] py-12">
        <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Các dịch vụ triển khai</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.map((service) => (
              <div 
                key={service._id}
                className="bg-white rounded-2xl p-6 flex flex-col items-center shadow hover:shadow-lg transition-shadow"
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
                  {registeredServiceIds.includes(service._id) && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Đã đăng ký
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => handleRegisterClick(service)}
                  className={`rounded-full px-8 py-2 font-semibold flex items-center gap-2 transition ${
                    registeredServiceIds.includes(service._id)
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  disabled={registeredServiceIds.includes(service._id)}
                >
                  {registeredServiceIds.includes(service._id) ? 'Đã đăng ký' : 'Đăng ký dịch vụ'} 
                  {!registeredServiceIds.includes(service._id) && <span>→</span>}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Modal
        title="Đăng ký dịch vụ"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedServices([]);
        }}
        footer={null}
        width={600}
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Chọn dịch vụ</h3>
          <div className="grid grid-cols-2 gap-4">
            {data?.filter(service => !registeredServiceIds.includes(service._id)).map((service) => (
              <div key={service._id} className="flex items-center gap-2 p-2 border rounded-lg">
                <Checkbox
                  checked={selectedServices.some(s => s._id === service._id)}
                  onChange={(e) => handleServiceSelect(service, e.target.checked)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img 
                        src={service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium">{service.name}</span>
                  </div>
                </Checkbox>
              </div>
            ))}
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input 
              placeholder="Nhập tên của bạn" 
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input 
              placeholder="Nhập số điện thoại" 
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input 
              placeholder="Nhập địa chỉ của bạn" 
            />
          </Form.Item>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              Thông tin cá nhân sẽ được cập nhật vào tài khoản của bạn khi đăng ký dịch vụ.
              Sau khi đăng ký, admin sẽ xem xét và duyệt yêu cầu của bạn.
            </p>
          </div>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setIsModalVisible(false);
                setSelectedServices([]);
              }}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={registerMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                Đăng ký ({selectedServices.length} dịch vụ)
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Footer />
    </div>
  );
};

export default Service; 