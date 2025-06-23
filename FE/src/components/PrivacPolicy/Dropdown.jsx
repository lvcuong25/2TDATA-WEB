import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Dropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

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

  // Các đường dẫn
  const items = [
    {
      to: '/policy/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan-khach-hang',
      label: 'Chính sách dữ liệu',
      desc: 'Thu thập & xử lý dữ liệu cá nhân',
    },
    {
      to: '/policy/chinh-sach-bao-mat-va-xu-ly-du-lieu-khach-hang',
      label: 'Bảo mật & Xử lý dữ liệu',
      desc: 'Chính sách bảo mật khách hàng',
    },
    {
      to: '/policy/dieu-khoan-su-dung-dich-vu',
      label: 'Điều khoản sử dụng',
      desc: 'Quy định sử dụng dịch vụ',
    },
  ];

  const isDropdownActive = items.some(item => location.pathname === item.to);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 py-2 px-3 rounded-sm md:p-0 
          text-gray-900 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent transition-colors duration-200
          ${isDropdownActive ? 'bg-gray-100 md:bg-transparent md:text-blue-700' : 'hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700'}
        `}
      >
        Chính sách
        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-fade-in"
        >
          <div className="py-1">
            {items.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block px-4 py-2 text-sm transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="font-medium">{item.label}</span>
                  <div className="text-xs text-gray-400">{item.desc}</div>
                </Link>
              );
            })}
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

export default Dropdown;
