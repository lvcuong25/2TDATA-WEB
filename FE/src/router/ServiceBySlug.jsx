import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ServiceFacebook from "../components/ServiceFacebook";
import ServiceTiktok from "../components/ServiceTiktok";
import instance from "../utils/axiosInstance";
import { toast } from "react-toastify";
import { useContext } from "react";
import { AuthContext } from "../components/core/Auth";

// import các component khác nếu có

const ServiceBySlug = () => {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        const { data } = await instance.get(`/service/slug/${slug}`);
        
        // Check if user has access to this service
        const hasService = currentUser.role === 'admin' || currentUser.service?.some(s => s.slug === slug);
        
        if (hasService) {
          setService(data);
        } else {
          toast.error('Bạn chưa đăng ký dịch vụ này');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể truy cập dịch vụ này');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [slug, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!service) {
    // If user has other services, redirect to the first one
    if (currentUser.service?.length > 0) {
      return <Navigate to={`/service/slug/${currentUser.service[0].slug}`} />;
    }
    // If no services, redirect to services page
    return <Navigate to="/service" />;
  }

  // Render service component based on slug
  switch (slug) {
    case "facebook":
      return <ServiceFacebook service={service} />;
    case "tik-tok":
      return <ServiceTiktok service={service} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy dịch vụ</h2>
            <button 
              onClick={() => window.history.back()}
              className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
  }
};

export default ServiceBySlug;