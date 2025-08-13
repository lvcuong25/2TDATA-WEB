import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { AuthContext } from './Auth';
import ErrorBoundary from './ErrorBoundary';

const AdminProtectedRoute = ({ children }) => {
  const authContext = useContext(AuthContext);
  
  // Handle case where AuthContext is null or undefined
  if (!authContext) {
    console.error('AdminProtectedRoute: AuthContext is null');
    return (
      <Result
        status="error"
        title="Authentication Error"
        subTitle="Authentication context is not available. Please refresh the page."
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        }
      />
    );
  }

  const { 
    currentUser, 
    isLoading, 
    isAdmin, 
    isAuthenticated 
  } = authContext;

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Check if user is authenticated using the safer method
  if (!isAuthenticated || !isAuthenticated()) {
    console.log('AdminProtectedRoute: User not authenticated, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  // Check if user has admin role using the safer method
  if (!isAdmin) {
    console.log('AdminProtectedRoute: User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Additional safety check for currentUser
  if (!currentUser || !currentUser._id || !currentUser.role) {
    console.log('AdminProtectedRoute: Invalid user data, redirecting to signin');
    return <Navigate to="/signin" replace />;
  }

  // Wrap children in error boundary to catch any authentication-related errors
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

export default AdminProtectedRoute;
