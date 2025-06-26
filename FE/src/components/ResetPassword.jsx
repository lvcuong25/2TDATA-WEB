import { joiResolver } from '@hookform/resolvers/joi';
import { useMutation } from '@tanstack/react-query';
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Joi from 'joi';
import instance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

const resetSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: false })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không đúng định dạng",
      "any.required": "Email là bắt buộc",
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.empty": "Mật khẩu không được để trống",
      "string.min": "Mật khẩu phải có ít nhất {#limit} ký tự",
      "any.required": "Mật khẩu là bắt buộc",
    }),

  cPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Mật khẩu xác nhận không khớp",
      "string.empty": "Mật khẩu xác nhận không được để trống",
      "any.required": "Mật khẩu xác nhận là bắt buộc",
    }),

  otp: Joi.string()
    .length(6)
    .required()
    .messages({
      "string.length": "OTP phải gồm đúng 6 ký tự",
      "string.empty": "OTP không được để trống",
      "any.required": "OTP là bắt buộc",
    }),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue
  } = useForm({
    resolver: joiResolver(resetSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
      cPassword: "",
    },
  });

  // Mutation để gửi OTP
  const { mutate: sendOtp, isPending: isSendingOtp } = useMutation({
    mutationFn: async (email) => {
      const { data } = await instance.post('auth/send-otp', { email });
      return data;
    },
    onSuccess: () => {
      toast.success('Mã OTP đã được gửi đến email của bạn!');
      setIsOtpSent(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Không thể gửi mã OTP!');
    }
  });

  // Mutation để đổi mật khẩu
  const { mutate: changePassword, isPending: isChanging } = useMutation({
    mutationFn: async (formData) => {
      const { data } = await instance.post('auth/reset-password', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại!');
    }
  });

  const handleSendOtp = () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Vui lòng nhập email!');
      return;
    }
    sendOtp(email);
  };

  const onSubmit = (data) => {
    if (!isOtpSent) {
      toast.error('Vui lòng gửi và xác nhận OTP trước!');
      return;
    }
    changePassword(data);
  };

  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);

  const handleKeyDown = (e) => {
    if (!/^[0-9]{1}$/.test(e.key) && 
        e.key !== "Backspace" && 
        e.key !== "Delete" && 
        e.key !== "Tab" && 
        !e.metaKey) {
      e.preventDefault();
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      const index = inputRefs.current.indexOf(e.target);
      if (index > 0) {
        setOtp((prevOtp) => [
          ...prevOtp.slice(0, index - 1),
          "",
          ...prevOtp.slice(index),
        ]);
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleInput = (e) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    if (target.value) {
      const newOtp = [...otp];
      newOtp[index] = target.value;
      setOtp(newOtp);
      
      // Update the form's OTP value
      const otpValue = newOtp.join('');
      setValue('otp', otpValue);
      
      if (index < otp.length - 1) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  return (
    <div className="bg-sky-100 flex justify-center items-center h-screen">
      {/* Left: Image */}
      <div className="w-1/2 h-screen hidden lg:block">
        <img 
          src="https://img.freepik.com/fotos-premium/imagen-fondo_910766-187.jpg?w=826" 
          alt="Placeholder Image" 
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right: Reset Password Form */}
      <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-semibold mb-4">Đổi Mật Khẩu</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">Email</label>
            <div className="flex gap-2">
              <input
                {...register("email")}
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                placeholder="name@company.com"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="bg-red-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4"
              >
                {isSendingOtp ? 'Đang gửi...' : 'Gửi OTP'}
              </button>
            </div>
            {errors?.email && <span className="text-red-500 text-sm">{errors?.email?.message}</span>}
          </div>

          {/* OTP Input */}
          <div className="mb-4">
            <label className="block text-gray-800">Mã OTP</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-xl border rounded-lg focus:outline-none focus:border-blue-500"
                  autoComplete="off"
                />
              ))}
            </div>
            {errors?.otp && <span className="text-red-500 text-sm">{errors?.otp?.message}</span>}
          </div>

          {/* Password fields */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-800">Mật khẩu mới</label>
            <div className="relative">
              <input
                {...register("password")}
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
            <label htmlFor="cPassword" className="block text-gray-800">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                {...register("cPassword")}
                type={showConfirmPassword ? "text" : "password"}
                id="cPassword"
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
            {errors?.cPassword && <span className="text-red-500 text-sm">{errors?.cPassword?.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isChanging || !isOtpSent}
            className="bg-red-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
          >
            {isChanging ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-green-500 text-center">
          <p className="text-sm font-light text-gray-500">
            Quay lại{" "}
            <a href="/login" className="hover:underline">
              đăng nhập
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
