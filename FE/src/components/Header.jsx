import React, { useEffect, useState } from 'react'
import image from "../image/image.jpg";
import Logout from "./logout";
import { Link } from 'react-router-dom';

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userService, setUserService] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem("accessToken");
        const userStr = localStorage.getItem("user");
        setIsLoggedIn(!!token);
        
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUserService(userData.service);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      };
      checkAuth();
    }, []);

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

    return (
      <div>
        <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
          <div className="container flex flex-wrap items-center justify-between mx-auto px-4">
            <Link to="/">
              <img src={image} alt="2T DATA" className="h-[60px] md:h-[80px] w-[60px] md:w-[80px]" />
            </Link>
            
            <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
              {isLoggedIn ? (
                <Logout onLogoutSuccess={() => {
                  setIsLoggedIn(false);
                  setUserService(null);
                }} />
              ) : (
                <Link
                  to="/login"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Đăng nhập
                </Link>
              )}
              <button
                onClick={toggleMenu}
                type="button"
                className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-controls="navbar-sticky"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 17 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 1h15M1 7h15M1 13h15"
                  />
                </svg>
              </button>
            </div>
            <div
              className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${
                isMenuOpen ? 'block' : 'hidden'
              }`}
              id="navbar-sticky"
            >
              <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                  <Link
                    to="/"
                    className="block py-2 px-3 text-white bg-blue-700 rounded-sm md:bg-transparent md:text-blue-700 md:p-0 md:dark:text-blue-500"
                    aria-current="page"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Giới thiệu
                  </Link>
                </li>
                {isLoggedIn && (
                  <li>
                    <Link
                      to="/service/my-service"
                      className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dịch vụ của tôi
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/service"
                    className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dịch vụ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blogs"
                    className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bài viết
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {/* Add padding to prevent content from being hidden under fixed header */}
        <div className="h-[60px] md:h-[80px]"></div>
      </div>
    );
}

export default Header;
