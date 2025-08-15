import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "./Header";
import FooterWrapper from "./FooterWrapper";
import { useMutation } from "@tanstack/react-query";
import instance from "../utils/axiosInstance-cookie-only";
import { toast } from "react-toastify";
import { useSite } from "../context/SiteContext";

const Home = () => {
  const [iframeUrl, setIframeUrl] = useState('https://www.hcwvietnam.com/2tdata_soltuion'); // default
  const { currentSite, refreshSiteConfig } = useSite();
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

  // Update iframe URL when site config changes
  useEffect(() => {
    if (currentSite?.settings?.iframeUrl) {
      setIframeUrl(currentSite.settings.iframeUrl);
    }
  }, [currentSite]);

  // Effect for periodic site config refresh
  useEffect(() => {
    // Set up periodic refresh of site config (every 30 seconds)
    const configRefreshInterval = setInterval(() => {
      refreshSiteConfig();
    }, 30000);

    // Refresh config when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSiteConfig();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh config when window regains focus
    const handleFocus = () => {
      refreshSiteConfig();
    };
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      clearInterval(configRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshSiteConfig]);

  // Separate effect for livechat script - only runs once
  useEffect(() => {
    // Check if script already exists to prevent duplicates
    const existingScript = document.querySelector('script[src*="rocketchat-livechat.min.js"]');
    if (existingScript) {
      return;
    }

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
  }, []); // Empty dependency array - runs only once

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
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title={currentSite?.name || '2TDATA'}
        />
      </div>
    </div>
  );
};

export default Home;