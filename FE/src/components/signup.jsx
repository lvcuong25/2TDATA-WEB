import { joiResolver } from '@hookform/resolvers/joi';
import { useMutation } from '@tanstack/react-query';
import React, { useState, useRef, useEffect } from 'react';
import Joi from 'joi';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import instance from '../utils/axiosInstance-cookie-only';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const signupChema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .min(3)
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email là bắt buộc',
      'string.min': 'Email phải có ít nhất 3 ký tự',
    }),
  password: Joi.string()
    .required()
    .min(6)
    .messages({
      'string.empty': 'Mật khẩu là bắt buộc',
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'string.empty': 'Cần xác nhận mật khẩu',
      'any.only': 'Mật khẩu xác nhận không khớp',
    }),
  role: Joi.string().default('member'),
  agreeAllTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'Bạn phải đồng ý với tất cả các điều khoản và chính sách',
      'boolean.base': 'Bạn phải đồng ý với tất cả các điều khoản và chính sách',
    }),
});

// Component dropdown riêng cho các chính sách
const PolicyDropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Các chính sách
  const policies = [
    {
      to: '/policy/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan-khach-hang',
      label: 'Chính sách thu thập và xử lý dữ liệu cá nhân khách hàng',
      desc: 'Thu thập & xử lý dữ liệu cá nhân',
    },
    {
      to: '/policy/chinh-sach-bao-mat-va-xu-ly-du-lieu-khach-hang',
      label: 'Chính sách bảo mật và xử lý dữ liệu khách hàng',
      desc: 'Chính sách bảo mật khách hàng',
    },
    {
      to: '/policy/dieu-khoan-su-dung-dich-vu',
      label: 'Điều khoản sử dụng dịch vụ',
      desc: 'Quy định sử dụng dịch vụ',
    },
  ];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
      >
        Xem chi tiết các điều khoản và chính sách
        <svg className={`w-3 h-3 ml-1 inline transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {open && (
        <div className="absolute left-0 z-50 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-fade-in">
          <div className="py-2">
            {policies.map((policy) => (
              <Link
                key={policy.to}
                to={policy.to}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-3 text-sm transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 text-gray-700 border-b last:border-b-0"
                onClick={() => setOpen(false)}
              >
                <div className="font-medium">{policy.label}</div>
                <div className="text-xs text-gray-400 mt-1">{policy.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>
    </div>
  );
};

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError, // Thêm setError để gán lỗi thủ công
    formState: { errors },
  } = useForm({
    resolver: joiResolver(signupChema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'member',
      agreeAllTerms: false,
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: async (signup) => {
      const { data } = await instance.post(
        'auth/sign-up',
        signup
      );
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      toast.success('Tài khoản đã được thêm thành công!');
      navigate('/login');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    const submitData = {
      ...data,
      agreeTermsOfService: data.agreeAllTerms,
      agreeDataPolicy: data.agreeAllTerms,
      agreeSecurityPolicy: data.agreeAllTerms,
    };
    delete submitData.agreeAllTerms;
    mutate(submitData);
  };

  return (
    <div className="bg-sky-100 flex justify-center items-center h-screen">
      <div className="w-1/2 h-screen hidden lg:block">
        <img 
          src="https://img.freepik.com/fotos-premium/imagen-fondo_910766-187.jpg?w=826" 
          alt="Signup background" 
          className="object-cover w-full h-full"
        />
      </div>
      <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-semibold mb-4">Tạo tài khoản mới</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">Email</label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              placeholder="example@email.com"
              autoComplete="off"
            />
            {errors?.email && <span className="text-red-500 text-sm">{errors?.email?.message}</span>}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-800">Mật khẩu</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors?.password && <span className="text-red-500 text-sm">{errors?.password?.message}</span>}
          </div>
          <div className="mb-4">
            <label htmlFor="confirm-password" className="block text-gray-800">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors?.confirmPassword && (
              <span className="text-red-500 text-sm">{errors?.confirmPassword?.message}</span>
            )}
          </div>
          <div className="mb-6">
            <h3 className="text-gray-800 mb-3">Điều khoản và Chính sách</h3>
            <div className="flex items-start space-x-3">
              <input
                {...register('agreeAllTerms')}
                type="checkbox"
                id="agreeAllTerms"
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex flex-col">
                <label htmlFor="agreeAllTerms" className="text-sm text-gray-700 mb-2">
                  Tôi đồng ý với tất cả các điều khoản và chính sách
                </label>
                <PolicyDropdown />
              </div>
            </div>
            {errors?.agreeAllTerms && (
              <span className="text-red-500 text-sm block ml-7">{errors?.agreeAllTerms?.message}</span>
            )}
          </div>
          <input {...register('role')} type="hidden" />
          <button
            type="submit"
            className="bg-red-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>
        <div className="mt-6 text-green-500 text-center">
          <p className="text-sm font-light text-gray-500">
            Bạn đã có tài khoản?{' '}
            <a href="/login" className="hover:underline">
              Đăng nhập tại đây
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
