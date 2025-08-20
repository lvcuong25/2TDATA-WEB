import React from 'react';
import { Button, Result } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log specific authentication errors
    if (error.message && error.message.includes('role')) {
      console.error('Authentication role error detected:', error.message);
      // Clear potentially corrupted auth data
      localStorage.removeItem('user');
      // Refresh page to reset auth state
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's an authentication-related error
      if (this.state.error?.message?.includes('role') || 
          this.state.error?.message?.includes('Cannot read properties of null')) {
        return (
          <Result
            status="warning"
            title="Phiên đăng nhập gặp sự cố"
            subTitle="Vui lòng đăng nhập lại để tiếp tục sử dụng dịch vụ."
            extra={[
              <Button type="primary" key="login" onClick={() => {
                localStorage.clear();
                window.location.href = '/signin';
              }}>
                Đăng nhập lại
              </Button>,
              <Button key="home" onClick={() => {
                window.location.href = '/';
              }}>
                Về trang chủ
              </Button>,
            ]}
          />
        );
      }

      // Generic error fallback
      return (
        <Result
          status="error"
          title="Có lỗi xảy ra"
          subTitle="Vui lòng thử lại sau hoặc liên hệ quản trị viên."
          extra={[
            <Button type="primary" key="retry" onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}>
              Thử lại
            </Button>,
            <Button key="home" onClick={() => {
              window.location.href = '/';
            }}>
              Về trang chủ
            </Button>,
          ]}
        >
          {process.env.NODE_ENV === 'development' && (
            <div style={{ textAlign: 'left', marginTop: 20 }}>
              <h4>Error Details (Development):</h4>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
        </Result>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
