import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../Header';
import instance from '../../utils/axiosInstance';

const Ifame = () => {
  const { domain } = useParams();
  const [iframeData, setIframeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIframe = async () => {
      try {
        setLoading(true);
        const { data } = await instance.get(`/iframe/domain/${domain}`);
        setIframeData(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tìm thấy iframe');
        setIframeData(null);
      } finally {
        setLoading(false);
      }
    };

    if (domain) {
      fetchIframe();
    }
  }, [domain]);

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
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '18px',
          color: '#ff4d4f'
        }}>
          {error}
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
