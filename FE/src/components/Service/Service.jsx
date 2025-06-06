import Header from "../Header";
import Footer from "../Footer";  
import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal, Form, Input, Button, Spin, Checkbox } from 'antd';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from "../core/Auth";
import instance from "../../utils/axiosInstance";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';

const Service = () => {
  const { currentUser } = useContext(AuthContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['userServices'],
    queryFn: async () => {
      const { data } = await instance.get('service');
      console.log(data)
      return data;
    },
  });

  const { data: userInfo, isLoading: isFetchingUser } = useQuery({
    queryKey: ['userInfo', currentUser?._id],
    queryFn: async () => {
      const { data } = await instance.get(`/user/${currentUser?._id}`);
      return data.data;
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (userInfo) {
      reset({
        name: userInfo.name,
        phone: userInfo.phone,
        address: userInfo.address
      });
    }
  }, [userInfo, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values) => {
      const { data } = await instance.put(`/user/${currentUser._id}`, {
        ...values,
        email: currentUser.email,
        role: currentUser.role,
        active: currentUser.active
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công!');
      setIsModalVisible(false);
      reset();
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || 'Cập nhật thông tin thất bại');
    }
  });

  const registerServiceMutation = useMutation({
    mutationFn: async (serviceIds) => {
      const promises = serviceIds.map(serviceId => 
        instance.post('/requests/add', { serviceId })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Đăng ký dịch vụ thành công! Vui lòng chờ admin xác nhận.');
      setIsModalVisible(false);
      setSelectedServices([]);
    },
    onError: (error) => {
      toast.error('Đăng ký dịch vụ thất bại: ' + error.message);
    }
  });

  const handleRegister = () => {
    if (!currentUser) {
      toast.warning('Vui lòng đăng nhập để đăng ký dịch vụ!');
      return;
    }
    setIsModalVisible(true);
  };

  const handleServiceSelect = (serviceId, checked) => {
    if (checked) {
      setSelectedServices(prev => [...prev, serviceId]);
      toast.info('Đã thêm dịch vụ vào danh sách đăng ký');
    } else {
      setSelectedServices(prev => prev.filter(id => id !== serviceId));
      toast.info('Đã xóa dịch vụ khỏi danh sách đăng ký');
    }
  };

  const onSubmit = (data) => {
    setIsLoading(true);
    if (selectedServices.length > 0) {
      updateProfileMutation.mutate(data, {
        onSuccess: () => {
          registerServiceMutation.mutate(selectedServices, {
            onSettled: () => setIsLoading(false)
          });
        },
        onError: () => {
          setIsLoading(false);
        }
      });
    } else {
      updateProfileMutation.mutate(data, {
        onSettled: () => setIsLoading(false)
      });
    }
  };

  return (
    <div>
      <Header />
      {isLoadingServices || (currentUser && isFetchingUser) ? (
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div className="container mx-auto pt-[100px] py-12">
            <section className="bg-gray-100 rounded-[32px] max-w-6xl mx-auto mt-8 p-8">
              <h2 className="text-2xl font-bold text-center mb-8">Các dịch vụ triển khai</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services?.map((service) => (
                  <div 
                    key={service?._id}
                    className="bg-white rounded-2xl p-6 flex flex-col items-center shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                      <img 
                        src={service?.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                        alt={service?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="font-semibold mb-4 capitalize">{service.name}</div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        service?.status 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {service?.status ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                    <Checkbox
                      onChange={(e) => handleServiceSelect(service?._id, e.target.checked)}
                      disabled={!service?.status}
                    >
                      Chọn dịch vụ
                    </Checkbox>
                  </div>
                ))}
              </div>
              {currentUser && (
                <div className="mt-8 text-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleRegister}
                    className="bg-red-500 hover:bg-red-600"
                    disabled={selectedServices?.length === 0}
                  >
                    Đăng ký dịch vụ đã chọn ({selectedServices?.length})
                  </Button>
                  <div className="mt-4">
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate('/service/my-service')}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Xem dịch vụ của tôi
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {currentUser && (
            <Modal
              title="Đăng ký dịch vụ"
              open={isModalVisible}
              onCancel={() => {
                setIsModalVisible(false);
                setSelectedServices([]);
                reset();
              }}
              footer={null}
              width={600}
            >
              <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
                <Form.Item
                  label="Họ và tên"
                  required
                  validateStatus={errors.name ? "error" : ""}
                  help={errors.name?.message}
                >
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      required: 'Vui lòng nhập họ và tên!',
                      minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                    }}
                    render={({ field }) => <Input {...field} placeholder="Nhập họ và tên của bạn" />}
                  />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  validateStatus={errors.phone ? "error" : ""}
                  help={errors.phone?.message}
                >
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Số điện thoại không hợp lệ'
                      }
                    }}
                    render={({ field }) => <Input {...field} placeholder="Nhập số điện thoại" />}
                  />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ"
                  validateStatus={errors.address ? "error" : ""}
                  help={errors.address?.message}
                >
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Nhập địa chỉ của bạn" />}
                  />
                </Form.Item>

                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-blue-800 text-sm">
                    Thông tin của bạn sẽ được gửi đến admin để xác nhận đăng ký {selectedServices.length} dịch vụ.
                  </p>
                </div>

                <Form.Item>
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => {
                      setIsModalVisible(false);
                      setSelectedServices([]);
                      reset();
                    }}>
                      Hủy
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      loading={isLoading || registerServiceMutation.isPending}
                      disabled={isLoading || registerServiceMutation.isPending}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isLoading || registerServiceMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            </Modal>
          )}
        </>
      )}
      <Footer />
    </div>
  );
};

export default Service; 