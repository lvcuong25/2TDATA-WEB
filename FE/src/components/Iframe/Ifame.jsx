import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Header from '../Header';
import instance from '../../utils/axiosInstance-cookie-only';
import { AuthContext } from '../core/Auth';

const Ifame = () => {
  const { domain } = useParams();
  const [iframeData, setIframeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;

  useEffect(() => {
    const fetchIframe = async () => {
      try {
        setLoading(true);
        const { data } = await instance.get(`/iframe/view/${domain}`);
        setIframeData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching iframe:', err);
        console.log('[IFRAME] Error status:', err.response?.status);
        console.log('[IFRAME] Current user:', currentUser);
        if (err.response?.status === 401) {
          setError('Vui lòng đăng nhập để xem nội dung này');
        } else if (err.response?.status === 403) {
          setError('Bạn không có quyền xem nội dung này');
        } else {
          setError(err.response?.data?.message || 'Không tìm thấy iframe');
        }
        setIframeData(null);
      } finally {
        setLoading(false);
      }
    };

    if (domain) {
      fetchIframe();
    }
  }, [domain]);

  // Kiểm tra authentication - chỉ redirect khi có lỗi 401
  if (!currentUser && !loading && error && error.includes('đăng nhập')) {
    console.log('[IFRAME] Redirecting to login due to 401 error');
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Header />
        <div style={{ 
          height: 'calc(100vh - 80px)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '18px',
          color: '#666'
        }}>
          Đang tải...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', width: '100vw' }}>
        <Header />
        <div style={{ 
          height: 'calc(100vh - 80px)',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ fontSize: '18px', color: '#ff4d4f' }}>
            {error}
          </div>
          {error.includes('đăng nhập') && (
            <a 
              href="/login" 
              style={{ 
                padding: '10px 20px', 
                background: '#1890ff', 
                color: 'white', 
                borderRadius: '4px',
                textDecoration: 'none'
              }}
            >
              Đăng nhập
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header />
      
      <div style={{ 
        width: '100%',
        height: 'calc(100vh - 80px)',
        position: 'relative'
      }}>
        {iframeData?.url ? (
          <iframe 
            src={iframeData.url} 
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
            title={iframeData.title || "Embedded Content"}
            allowFullScreen
            allow="fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '18px',
            color: '#666'
          }}>
            Không có URL iframe
          </div>
        )}
      </div>
    </div>
  );
};

export default Ifame;
