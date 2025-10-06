import React, { useState, useContext } from 'react'
import image from "../image/image.jpg";
import UserDropdown from './UserProfile/UserDropdown';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from './core/Auth';
import { useSite } from '../context/SiteContext';
import Dropdown from './PrivacPolicy/Dropdown';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const isLogin = authContext?.isLogin;
    const { currentSite } = useSite();

    const location = useLocation();

    const handleLogoutSuccess = () => {
      // This will be handled by AuthContext automatically
    };

    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

    return (
      <div>
        <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600">
          <div className="container flex flex-wrap items-center justify-between mx-auto px-4">
            <Link to="/">
              <img 
                src={currentSite?.logo_url || currentSite?.theme_config?.logoUrl || image} 
                alt={currentSite?.name || '2T DATA'} 
                className="h-[60px] md:h-[80px] w-[60px] md:w-[80px] object-contain"
                onError={(e) => {
                  // Fallback to default image if site logo fails to load
                  e.target.src = image;
                }}
              />
            </Link>
            
            <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
              {isLogin ? (
                <UserDropdown onLogoutSuccess={handleLogoutSuccess} />
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
                    className={`block py-2 px-3 rounded-sm md:p-0 ${
                      location.pathname === '/'
                        ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                        : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'
                    }`}
                    aria-current={location.pathname === '/' ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Trang chủ
                  </Link>
                </li>
            
                {isLogin && (
                  <li>
                    <Link
                      to="/service/my-service"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        location.pathname === '/service/my-service'
                          ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                          : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dịch vụ của tôi
                    </Link>
                  </li>
                )}
                {/* Ẩn Cơ sở dữ liệu */}
                {/* {isLogin && (
                  <li>
                    <Link
                      to="/database"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        location.pathname.startsWith('/database')
                          ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                          : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Cơ sở dữ liệu
                    </Link>
                  </li>
                )} */}
                <li>
                  <Link
                    to="/service"
                    className={`block py-2 px-3 rounded-sm md:p-0 ${
                      location.pathname === '/service'
                        ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                        : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dịch vụ
                  </Link>
                </li>
                {(authContext?.isAdmin) && (
                  <li>
                    <Link
                      to="/admin"
                      className={`block py-2 px-3 rounded-sm md:p-0 ${
                        location.pathname === '/admin'
                          ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                          : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Quản trị
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/blogs"
                    className={`block py-2 px-3 rounded-sm md:p-0 ${
                      location.pathname === '/blogs'
                        ? 'text-white bg-blue-700 md:bg-transparent md:text-blue-700 md:dark:text-blue-500'
                        : 'text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bài viết
                  </Link>
                </li>
                <li>
                  <Dropdown />
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