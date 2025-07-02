import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, Alert, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosInstance from '../axios/axiosInstance';

const { Title, Text } = Typography;

const ApiTest = () => {
  const [status, setStatus] = useState({
    backend: 'loading',
    auth: 'idle',
    sites: 'idle',
    assets: 'idle'
  });
  
  const [results, setResults] = useState({});

  const testBackendConnection = async () => {
    try {
      setStatus(prev => ({ ...prev, backend: 'loading' }));
      const response = await axiosInstance.get('/assets/');
      setResults(prev => ({ ...prev, backend: response.data }));
      setStatus(prev => ({ ...prev, backend: 'success' }));
    } catch (error) {
      setResults(prev => ({ ...prev, backend: error.message }));
      setStatus(prev => ({ ...prev, backend: 'error' }));
    }
  };

  const testAuthEndpoint = async () => {
    try {
      setStatus(prev => ({ ...prev, auth: 'loading' }));
      const response = await axiosInstance.get('/auth/');
    } catch (error) {
      // Expected to fail without token, but should get a proper error response
      if (error.response?.status === 403) {
        setResults(prev => ({ ...prev, auth: 'Auth endpoint working (403 expected without token)' }));
        setStatus(prev => ({ ...prev, auth: 'success' }));
      } else {
        setResults(prev => ({ ...prev, auth: error.message }));
        setStatus(prev => ({ ...prev, auth: 'error' }));
      }
    }
  };

  const testSitesEndpoint = async () => {
    try {
      setStatus(prev => ({ ...prev, sites: 'loading' }));
      const response = await axiosInstance.get('/sites/');
      setResults(prev => ({ ...prev, sites: response.data }));
      setStatus(prev => ({ ...prev, sites: 'success' }));
    } catch (error) {
      setResults(prev => ({ ...prev, sites: error.message }));
      setStatus(prev => ({ ...prev, sites: 'error' }));
    }
  };

  const testAssetsEndpoint = async () => {
    try {
      setStatus(prev => ({ ...prev, assets: 'loading' }));
      const response = await axiosInstance.get('/assets/');
      setResults(prev => ({ ...prev, assets: response.data }));
      setStatus(prev => ({ ...prev, assets: 'success' }));
    } catch (error) {
      setResults(prev => ({ ...prev, assets: error.message }));
      setStatus(prev => ({ ...prev, assets: 'error' }));
    }
  };

  const runAllTests = () => {
    testBackendConnection();
    testAuthEndpoint();
    testSitesEndpoint();
    testAssetsEndpoint();
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  const getStatusIcon = (statusType) => {
    switch (status[statusType]) {
      case 'loading':
        return <Spin size="small" />;
      case 'success':
        return <CheckCircleOutlined style={{ color: 'green' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: 'red' }} />;
      default:
        return null;
    }
  };

  return (
    <Card title="🔌 Backend API Connection Test" style={{ maxWidth: 800, margin: '20px auto' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Backend Server Status</Title>
          <Text>Base URL: http://localhost:3000/api</Text>
        </div>

        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={runAllTests}
          loading={status.backend === 'loading'}
        >
          Test All Endpoints
        </Button>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Card size="small">
            <Space>
              {getStatusIcon('backend')}
              <Text strong>Backend Connection:</Text>
              <Text type={status.backend === 'error' ? 'danger' : 'success'}>
                {status.backend === 'success' ? 'Connected' : status.backend === 'error' ? 'Failed' : 'Testing...'}
              </Text>
            </Space>
            {results.backend && (
              <div style={{ marginTop: 8 }}>
                <Text code>{JSON.stringify(results.backend, null, 2)}</Text>
              </div>
            )}
          </Card>

          <Card size="small">
            <Space>
              {getStatusIcon('auth')}
              <Text strong>Auth Endpoint:</Text>
              <Button size="small" onClick={testAuthEndpoint} loading={status.auth === 'loading'}>
                Test /auth/
              </Button>
            </Space>
            {results.auth && (
              <div style={{ marginTop: 8 }}>
                <Text code>{JSON.stringify(results.auth, null, 2)}</Text>
              </div>
            )}
          </Card>

          <Card size="small">
            <Space>
              {getStatusIcon('sites')}
              <Text strong>Sites Endpoint:</Text>
              <Button size="small" onClick={testSitesEndpoint} loading={status.sites === 'loading'}>
                Test /sites/
              </Button>
            </Space>
            {results.sites && (
              <div style={{ marginTop: 8 }}>
                <Text code>{JSON.stringify(results.sites, null, 2)}</Text>
              </div>
            )}
          </Card>

          <Card size="small">
            <Space>
              {getStatusIcon('assets')}
              <Text strong>Assets Endpoint:</Text>
              <Button size="small" onClick={testAssetsEndpoint} loading={status.assets === 'loading'}>
                Test /assets/
              </Button>
            </Space>
            {results.assets && (
              <div style={{ marginTop: 8 }}>
                <Text code>{JSON.stringify(results.assets, null, 2)}</Text>
              </div>
            )}
          </Card>
        </Space>

        {status.backend === 'success' && (
          <Alert
            message="✅ Backend Connection Successful!"
            description="Your frontend is successfully connected to the backend API. You can now test authentication, user management, and other features."
            type="success"
            showIcon
          />
        )}

        {status.backend === 'error' && (
          <Alert
            message="❌ Backend Connection Failed"
            description="Make sure your backend server is running on http://localhost:3000 and try again."
            type="error"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default ApiTest;
