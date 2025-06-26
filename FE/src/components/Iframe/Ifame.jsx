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
      <div>
        <Header />
        <div style={{ 
          position: 'fixed',
          top: 100,
          left: 0,
          width: '100vw',
          height: '100vh',
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
      <div>
        <Header />
        <div style={{ 
          position: 'fixed',
          top: 100,
          left: 0,
          width: '100vw',
          height: '100vh',
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
    <div>
      <Header />

      <div style={{ 
        position: 'fixed',
        top: 100,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {iframeData?.url ? (
          <iframe 
            src={iframeData.url} 
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title={iframeData.title || "Embedded Content"}
            allowFullScreen
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
