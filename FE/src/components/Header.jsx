import React, { useEffect, useState } from 'react'
import image from "../image/image.jpg";
import Logout from "./logout";
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const location = useLocation();

    useEffect(() => {
      const checkAuth = () => {
        const token = localStorage.getItem("accessToken");
        setIsLoggedIn(!!token);
      };
      checkAuth();
    }, []);

    return (
      <div>
        <nav class="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
          <div class="container flex flex-wrap items-center justify-between m-auto ">
            <Link to="/">
              <img src={image} alt="2T DATA" className="h-[80px] w-[80px]" />
            </Link>
            
            <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
              {isLoggedIn ? (
                <Logout onLogoutSuccess={() => {
                  setIsLoggedIn(false);
                }} />
              ) : (
                <Link
                  to="/login"
                  class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Đăng nhập
                </Link>
              )}
              <button
                data-collapse-toggle="navbar-sticky"
                type="button"
                class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-controls="navbar-sticky"
                aria-expanded="false"
              >
                <span class="sr-only">Open main menu</span>
                <svg
                  class="w-5 h-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 17 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M1 1h15M1 7h15M1 13h15"
                  />
                </svg>
              </button>
            </div>
            <div
              class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
              id="navbar-sticky"
            >
              <ul class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                <li>
                  <Link
                    to="/"
                    class={`block py-2 px-3 rounded-sm md:p-0 ${location.pathname === '/' ? 'text-blue-700 md:text-blue-700' : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'}`}
                    aria-current={location.pathname === '/' ? 'page' : undefined}
                  >
                    Trang chủ
                  </Link>
                </li>
                
             
                {isLoggedIn && (
                  <li>
                    <Link
                      to="/service/my-service"
                      class={`block py-2 px-3 rounded-sm md:p-0 ${location.pathname === '/service/my-service' ? 'text-blue-700 md:text-blue-700' : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'}`}
                    >
                      Dịch vụ của tôi
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/service"
                    class={`block py-2 px-3 rounded-sm md:p-0 ${location.pathname === '/service' ? 'text-blue-700 md:text-blue-700' : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'}`}
                  >
                    Dịch vụ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blogs"
                    class={`block py-2 px-3 rounded-sm md:p-0 ${location.pathname === '/blogs' ? 'text-blue-700 md:text-blue-700' : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'}`}
                  >
                    Bài viết
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
}

export default Header;
