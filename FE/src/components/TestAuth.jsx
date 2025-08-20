import React, { useContext } from 'react';
import { AuthContext } from './core/Auth';

const TestAuth = () => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isLoading = authContext?.isLoading || false;
  const isAdmin = authContext?.isAdmin || false;
  const isSuperAdmin = authContext?.isSuperAdmin || false;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px' }}>
      <h2>Authentication Debug Info</h2>
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Current User:</strong> {currentUser ? 'Yes' : 'No'}</p>
        {currentUser && (
          <div style={{ marginLeft: '20px' }}>
            <p><strong>User ID:</strong> {currentUser._id}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
          </div>
        )}
        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Is Super Admin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Is Authenticated:</strong> {authContext?.isAuthenticated?.() ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default TestAuth;
