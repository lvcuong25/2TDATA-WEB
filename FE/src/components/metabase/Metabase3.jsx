import React, { useState, useEffect } from 'react'
import { Button, Modal, message, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons';

const Metabase3 = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (isModalOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isModalOpen, countdown]);

  const pollStatusAndCloseModal = () => {
    console.log('Starting polling...');
    clearInterval(window.pollingInterval);

    window.pollingInterval = setInterval(() => {
      console.log('Polling status...');
      fetch("https://auto.hcw.com.vn/webhook/job-status")
        .then(res => res.json())
        .then(data => {
          console.log('Status response:', data);
          const status = data?.status;

          if (status === "done") {
            clearInterval(window.pollingInterval);
            setIsModalOpen(false);
            setCountdown(0);
            message.success('Cập nhật dữ liệu thành công!');
            window.location.reload();
          }
        })
        .catch(err => {
          console.error('Polling error:', err);
          message.error("Lỗi khi kiểm tra trạng thái: " + err.message);
        });
    }, 10000);
  };

  const handleUpdateData = () => {
    console.log('Update button clicked');
    setIsModalOpen(true);
    
    fetch("https://auto.hcw.com.vn/webhook/update-data-tiktok-shop")
      .then(() => {
        console.log('Update request sent');
        pollStatusAndCloseModal();
      })
      .catch((err) => {
        console.error('Update error:', err);
        setIsModalOpen(false);
        setCountdown(0);
        message.error("Lỗi khi gửi yêu cầu cập nhật: " + err.message);
      });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <Button 
          type="primary"
          onClick={handleUpdateData}
        >
          Cập nhật dữ liệu
        </Button>
        <Button 
          danger
          onClick={() =>  window.location.href('https://metabase.com/app/embed/1234567890/dashboard/1234567890?delete=true', '_blank')}
        >
          Xóa dữ liệu
        </Button>
      </div>

      <Modal
        title="Đang cập nhật dữ liệu"
        open={isModalOpen}
        closable={false}
        footer={null}
        maskClosable={false}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <p style={{ marginTop: '20px' }}>Vui lòng đợi trong giây lát, hệ thống đang cập nhật dữ liệu...</p>
          <p style={{ marginTop: '10px', color: '#1890ff' }}>Thời gian còn lại: {formatTime(countdown)}</p>
        </div>
      </Modal>

      <iframe 
        src="https://metabase.com/app/embed/1234567890/dashboard/1234567890" 
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  )
}

export default Metabase3
