import React from "react";
import Header from "../Header";
import FooterWrapper from "../FooterWrapper";
import { useQuery } from "@tanstack/react-query";
import instance from "../../utils/axiosInstance-cookie-only";
import { useParams } from "react-router-dom";
import image9 from "../../image/image9.png";
import MyService from "../MyService/MyService";
const ServiceFacebook = () => {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["facebookService", slug],
    queryFn: async () => {
      const response = await instance.get(`/service/slug/${slug}`);
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred: {error.message}</div>;
  if (!data) return <div>Service not found.</div>;

  return (
    <div>
      <Header />

      {/* Top Section: Title and Description with Background Image */}
      <section
        className="mt-20"
        style={{
          backgroundImage: `url(${image9})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center py-10 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            USER GUIDE FOR FACEBOOK ADS DASHBOARD
          </h1>
          <h2 className="text-xl italic text-gray-800 mb-6">
            HƯỚNG DẪN SỬ DỤNG DỊCH VỤ FACEBOOK ADS DASHBOARD
          </h2>
          <p className="text-gray-600 mb-2">
            Thank you for signing up for HCW Vietnam's service. Please follow
            the steps below to get started
          </p>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã đăng ký dịch vụ của HCW Việt Nam. Vui lòng thực hiện
            theo các bước dưới đây để bắt đầu sử dụng dịch vụ
          </p>
          <p className="mt-4 text-sm">
            <a href="#" className="underline text-blue-600 mx-2">
              Terms of Service (Điều khoản dịch vụ)
            </a>

            <a href="#" className="underline text-blue-600 mx-2">
              Privacy Policy (Chính sách quyền riêng tư)
            </a>
          </p>
        </div>
        <div className="py-6">
          <div className="container mx-auto flex items-center">
            {/* Left Logo */}
            <div className="w-1/4 flex justify-center">
              <img
                src={data?.image}
                alt="Facebook Logo"
                className="w-24 h-24 object-contain"
              />
            </div>

            {/* Content */}
            <div className="w-3/4 bg-[#fbf5dd] p-6 rounded-lg ml-[-1rem]">
              {/* Step 1 */}
              <div className="w-[100%] flex items-start mb-4">
                <div className="w-[5%] flex items-center justify-center h-8 bg-black text-white rounded mr-3 text-sm font-bold">
                  1
                </div>

                <div className="w-[20%] pr-3">
                  <button className="bg-green-600 text-white px-4 py-1.5 rounded-3xl mr-2 mb-3 w-full text-sm">
                    Connect Data
                  </button>
                </div>
                <div className="w-[70%]">
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                    Step 1: Connect Data (Bước 1: Kết nối dữ liệu)
                  </h3>
                  <p className="text-xs text-[#919191] italic">
                    Click "Connect Data" to authenticate your Facebook account
                    and authorize HCW Ads Data to access your Facebook Ads data,
                    in accordance with Facebook's API data usage policies.
                  </p>
                  <p className="text-xs text-[#919191] italic mb-1">
                    Bấm vào "Connect Data" để xác thực tài khoản Facebook của
                    bạn và cho phép HCW Ads Data truy cập dữ liệu Facebook Ads
                    của bạn theo chính sách sử dụng dữ liệu API của Facebook.
                  </p>
                  <a href="#" className="text-blue-600 underline text-xs">
                    View detailed connection instructions (Xem hướng dẫn cách
                    kết nối chi tiết)
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="w-[100%] flex items-start mb-4">
                <div className="w-[5%] flex items-center justify-center h-8 bg-black text-white rounded mr-3 text-sm font-bold">
                  2
                </div>

                <div className="w-[20%] pr-3">
                  <button className="bg-blue-500 text-white px-4 py-1.5 rounded-3xl mr-2 mb-3 w-full text-sm">
                    Update Data
                  </button>
                </div>

                <div className="w-[70%]">
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                    Step 2: Update Your Data (Bước 2: Cập nhật dữ liệu)
                  </h3>
                  <p className="text-xs text-[#919191] italic">
                    Click "Update Data" to initiate the synchronization
                    workflow. This process will securely retrieve your latest
                    Facebook Ads data and display it on the dashboard. Note:
                    This step may take 5 to 10 minutes depending on your data
                    volume.
                  </p>
                  <p className="text-xs text-[#919191] mb-1 italic">
                    Nhấp vào "Update Data" để bắt đầu quy trình đồng bộ hóa. Quy
                    trình này sẽ truy xuất dữ liệu Facebook Ads mới nhất của bạn
                    một cách an toàn và hiển thị trên bảng điều khiển. Lưu ý:
                    Bước này có thể mất từ 5 đến 10 phút tùy thuộc vào khối
                    lượng dữ liệu của bạn.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="w-[100%] flex items-start mb-4">
                <div className="w-[5%] flex items-center justify-center h-8 bg-black text-white rounded mr-3 text-sm font-bold">
                  3
                </div>

                <div className="w-[20%] pr-3">
                  <button className="bg-red-500 text-white px-4 py-1.5 rounded-3xl mb-3 w-full text-sm flex items-center justify-center">
                    View Dashboard
                    <span className="ml-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                </div>

                <div className="w-[70%] ">
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                    Step 3: View the Dashboard (Bước 3: Xem Dashboard)
                  </h3>
                  <p className="text-xs text-[#919191] italic">
                    Click "View Dashboard" to explore your visualized Facebook
                    Ads data. If the dashboard appears incomplete or outdated,
                    please press F5 to refresh and load the most recent content.
                  </p>
                  <p className="text-xs text-[#919191] italic">
                    Nhấp vào "View Dashboard" để xem dữ liệu Facebook Ads của
                    bạn dưới dạng trực quan. Nếu dữ liệu không hiển thị đầy đủ
                    hoặc bị cũ, vui lòng nhấn F5 để làm mới trang và tải lại nội
                    dung mới nhất.
                  </p>
                </div>
              </div>

              {/* Request to Revoke App Permissions */}
              <div className="w-[100%] flex items-start mb-4">
                <div className="w-[5%] mr-3"></div>

                <div className="w-[20%] pr-3">
                  <button className="bg-orange-500 text-white px-4 py-1.5 rounded-3xl mr-2 mb-3 w-full text-sm">
                    Revoke Permissions
                  </button>
                </div>

                <div className="w-[70%]">
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                    Request to Revoke App Permissions (Yêu cầu hủy quyền ứng
                    dụng)
                  </h3>
                  <p className="text-xs text-[#919191] italic">
                    Click "Revoke App Permissions" to completely remove HCW's
                    access to your Facebook data. This action will terminate all
                    data sharing between your account and the HCW application in
                    accordance with Facebook's data privacy policies.
                  </p>
                  <p className="text-xs text-[#919191] italic">
                    Bấm vào "Hủy quyền ứng dụng" để loại bỏ hoàn toàn quyền truy
                    cập dữ liệu Facebook của bạn đối với HCW. Hành động này sẽ
                    chấm dứt toàn bộ việc chia sẻ dữ liệu giữa tài khoản của bạn
                    và ứng dụng HCW, phù hợp với chính sách bảo mật dữ liệu của
                    Facebook.
                  </p>
                </div>
              </div>

              {/* Request to Delete Data */}
              <div className="w-[100%] flex items-start mb-4">
                <div className="w-[5%] mr-3"></div>
                
                <div className="w-[20%] pr-3">
                  <button className="bg-red-600 text-white px-4 py-1.5 rounded-3xl mb-3 w-full text-sm">
                    Delete Data
                  </button>
                </div>

                <div className="w-[70%]">
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm">
                    Request to Delete Data (Yêu cầu xóa dữ liệu)
                  </h3>
                  <p className="text-xs text-[#919191] italic">
                    Click "Delete Data" to permanently remove all data collected
                    for your Dashboard. This action ensures that all your
                    information stored within HCW Ads Data will be completely
                    erased in compliance with data protection regulations.
                  </p>
                  <p className="text-xs text-[#919191] italic">
                    Bấm vào "Xóa dữ liệu" để xóa vĩnh viễn toàn bộ dữ liệu đã
                    được thu thập cho Dashboard của bạn. Hành động này đảm bảo
                    tất cả thông tin của bạn được lưu trữ trong HCW Ads Data sẽ
                    bị xóa hoàn toàn, tuân thủ các quy định bảo vệ dữ liệu.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
      <MyService/>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceFacebook;
