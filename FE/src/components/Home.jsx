import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Logout from "./logout";
import image from "../image/image.jpg";
import image2 from "../image/image2.webp";
import image3 from "../image/image3.jpg";
import image5 from "../image/image5.png";
import image6 from "../image/image6.png";
import image7 from "../image/image7.png";
import image9 from "../image/image9.png";
import image1 from "../image/image1.png";
import image4 from "../image/image4.png";
import image8 from "../image/image8.png";
import image10 from "../image/image10.png";
import image11 from "../image/image11.png";
import image12 from "../image/image12.png";
import image13 from "../image/image13.png";
import image14 from "../image/image14.png";
import image15 from "../image/image15.png";
import image16 from "../image/image16.jpg";
import image17 from "../image/image17.png";
import Header from "./Header";
import Footer from "./Footer";
import { useMutation } from "@tanstack/react-query";
import instance from "../utils/axiosInstance";
import { toast } from "react-toastify";

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: ""
  });

  const addUserInfoMutation = useMutation({
    mutationFn: async (data) => {
      const response = await instance.post('/userInfo/add', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Thông tin đã được gửi thành công!");
      setFormData({
        name: "",
        email: "",
        phoneNumber: ""
      });
    },
    onError: (error) => {
      toast.error("Có lỗi xảy ra: " + (error.response?.data?.message || error.message));
    }
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      setIsLoggedIn(!!token);
    };
    checkAuth();

    // Add Rocket.Chat Livechat script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function(w, d, s, u) {
        w.RocketChat = function(c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
        var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
        j.async = true; j.src = 'https://chat.hcw.com.vn/livechat/rocketchat-livechat.min.js?_=201903270000';
        h.parentNode.insertBefore(j, h);
      })(window, document, 'script', 'https://chat.hcw.com.vn/livechat');
    `;
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, email, phoneNumber } = formData;

    // Validate name
    if (!name.trim()) {
      toast.error("Vui lòng nhập họ tên.");
      return;
    }

    if (name.length < 2) {
      toast.error("Họ tên phải có ít nhất 2 ký tự.");
      return;
    }

    // Validate email format
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      toast.error("Địa chỉ email không hợp lệ. Vui lòng nhập email đúng định dạng (ví dụ: example@domain.com)");
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Số điện thoại không hợp lệ. Vui lòng nhập 10 hoặc 11 chữ số.");
      return;
    }

    addUserInfoMutation.mutate(formData);
  };

  return (
    <div>
      <Header/>

      <div style={{ 
        position: 'fixed',
        top: 100,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <iframe 
          src="https://www.hcwvietnam.com/2tdata_soltuion" 
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
      </div>
    </div>
  );
};

export default Home;