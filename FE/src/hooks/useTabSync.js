import { useEffect, useCallback } from 'react';

/**
 * Hook để quản lý việc đồng bộ giữa các tab
 * Giúp tránh race condition và đảm bảo trạng thái auth đồng nhất
 * Simplified version for React 19 compatibility
 */
export const useTabSync = (onAuthChange) => {
  
  useEffect(() => {
    // Tạo unique ID cho tab này
    const tabId = Math.random().toString(36).substr(2, 9);
    console.log(`[Tab ${tabId}] Initializing tab sync...`);
    
    let lastUpdateTime = 0;
    
    // Lắng nghe storage events từ các tab khác
    const handleStorageChange = (event) => {
      // Chỉ xử lý các thay đổi liên quan đến auth
      if (event.key === 'user' || event.key === 'auth_timestamp') {
        const now = Date.now();
        
        // Tránh xử lý quá nhiều events trong thời gian ngắn
        if (now - lastUpdateTime < 100) {
          return;
        }
        lastUpdateTime = now;
        
        console.log(`[Tab ${tabId}] Storage change detected:`, event.key);
        
        // Thêm delay nhỏ để tránh race condition
        setTimeout(() => {
          if (onAuthChange) {
            onAuthChange(event);
          }
        }, 50);
      }
    };
    
    // Lắng nghe custom auth events
    const handleAuthUpdate = (event) => {
      const now = Date.now();
      if (now - lastUpdateTime < 100) {
        return;
      }
      lastUpdateTime = now;
      
      console.log(`[Tab ${tabId}] Auth update event detected`);
      
      setTimeout(() => {
        if (onAuthChange) {
          onAuthChange(event);
        }
      }, 50);
    };
    
    // Lắng nghe visibility change (khi tab được focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(`[Tab ${tabId}] Tab became visible, checking auth status...`);
        
        // Kiểm tra timestamp để xem có cần refresh auth không
        const authTimestamp = localStorage.getItem('auth_timestamp');
        const now = Date.now();
        const timeSinceLastUpdate = now - (authTimestamp ? parseInt(authTimestamp) : 0);
        
        // Nếu đã quá 5 phút kể từ lần cập nhật cuối, refresh auth
        if (timeSinceLastUpdate > 5 * 60 * 1000) {
          console.log(`[Tab ${tabId}] Auth data is stale, triggering refresh...`);
          if (onAuthChange) {
            onAuthChange({ type: 'visibility_change' });
          }
        }
      }
    };
    
    // Lắng nghe focus events
    const handleFocus = () => {
      console.log(`[Tab ${tabId}] Tab focused, checking auth status...`);
      if (onAuthChange) {
        onAuthChange({ type: 'focus' });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authUpdate', handleAuthUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authUpdate', handleAuthUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onAuthChange]);
  
  // Function để thông báo thay đổi auth cho các tab khác
  const notifyAuthChange = useCallback((userData) => {
    const now = Date.now();
    
    // Cập nhật timestamp
    localStorage.setItem('auth_timestamp', now.toString());
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('authUpdate', { 
      detail: userData,
      timestamp: now 
    }));
    
    // Dispatch storage event để các tab khác biết
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: userData ? JSON.stringify(userData) : null,
      oldValue: localStorage.getItem('user'),
      url: window.location.href
    }));
  }, []);
  
  return { notifyAuthChange };
};