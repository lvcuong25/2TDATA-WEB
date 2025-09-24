/**
 * Tab synchronization utility
 * Simple function-based approach without React hooks
 */
export const useTabSync = (onAuthChange) => {
  
  // Simple initialization check
  if (!window._tabSyncInitialized) {
    window._tabSyncInitialized = true;
    
    // Tạo unique ID cho tab này
    const tabId = Math.random().toString(36).substr(2, 9);
    console.log(`[Tab ${tabId}] Initializing tab sync...`);
    
    let lastUpdateTime = 0;
    
    // Lắng nghe storage events từ các tab khác
    const handleStorageChange = (event) => {
      if (event.key === 'user' || event.key === 'auth_timestamp') {
        const now = Date.now();
        
        if (now - lastUpdateTime < 100) {
          return;
        }
        lastUpdateTime = now;
        
        console.log(`[Tab ${tabId}] Storage change detected:`, event.key);
        
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
    
    // Lắng nghe visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log(`[Tab ${tabId}] Tab became visible, checking auth status...`);
        
        const authTimestamp = localStorage.getItem('auth_timestamp');
        const now = Date.now();
        const timeSinceLastUpdate = now - (authTimestamp ? parseInt(authTimestamp) : 0);
        
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
    
    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authUpdate', handleAuthUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Store cleanup function globally
    window._tabSyncCleanup = () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authUpdate', handleAuthUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }
  
  // Function để thông báo thay đổi auth cho các tab khác
  const notifyAuthChange = (userData) => {
    const now = Date.now();
    
    localStorage.setItem('auth_timestamp', now.toString());
    
    window.dispatchEvent(new CustomEvent('authUpdate', { 
      detail: userData,
      timestamp: now 
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user',
      newValue: userData ? JSON.stringify(userData) : null,
      oldValue: localStorage.getItem('user'),
      url: window.location.href
    }));
  };
  
  // Return cleanup function
  const cleanup = () => {
    if (window._tabSyncCleanup) {
      window._tabSyncCleanup();
    }
  };
  
  return { notifyAuthChange, cleanup };
};