import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance-cookie-only';

const SiteContext = createContext();

// Helper function to update favicon dynamically
const updateDynamicFavicon = (siteData) => {
  try {
    // Remove existing favicon
    const existingFavicon = document.querySelector("link[rel*='icon']");
    if (existingFavicon) {
      existingFavicon.remove();
    }
    
    // Priority: theme_config.faviconUrl > logo_url > default
    const faviconUrl = siteData.theme_config?.faviconUrl || 
                      siteData.logo_url || 
                      '/src/image/image.jpg'; // fallback
    
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
    
    } catch (error) {
    console.error('Error updating favicon:', error);
  }
};

// Helper function to update logo meta tags for social sharing
const updateLogoMetaTags = (siteData) => {
  try {
    const logoUrl = siteData.theme_config?.logoUrl || siteData.logo_url;
    
    if (logoUrl) {
      // Update or create Open Graph image meta tag
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.getElementsByTagName('head')[0].appendChild(ogImage);
      }
      ogImage.setAttribute('content', logoUrl);
      
      // Update or create Twitter Card image meta tag
      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        document.getElementsByTagName('head')[0].appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', logoUrl);
      
      }
  } catch (error) {
    console.error('Error updating logo meta tags:', error);
  }
};

// Helper function to clear all authentication data
const clearAuthData = () => {
  // Clear all auth-related localStorage items
  localStorage.removeItem('user');
  localStorage.removeItem('auth_timestamp');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token');
  
  // Clear sessionStorage as well
  sessionStorage.clear();
  
  // Clear all cookies for current domain
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  console.log('Authentication data cleared for site switch');
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};

export const SiteProvider = ({ children }) => {
  const [currentSite, setCurrentSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousHostname, setPreviousHostname] = useState(null);

  useEffect(() => {
    detectAndLoadSite();
  }, []);

  const detectAndLoadSite = async () => {
    try {
      // Get current hostname
      const currentHostname = window.location.hostname;
      
      // Check if hostname has changed (user switched site)
      const storedHostname = localStorage.getItem('last_hostname');
      
      if (storedHostname && storedHostname !== currentHostname) {
        console.log(`Site switch detected: ${storedHostname} -> ${currentHostname}`);
        // Clear all authentication data when switching sites
        clearAuthData();
        
        // Force reload to ensure clean state
        localStorage.setItem('last_hostname', currentHostname);
        window.location.reload();
        return;
      }
      
      // Store current hostname
      localStorage.setItem('last_hostname', currentHostname);
      
      // Build timestamp: 2025-07-01T06:57:00Z - Force rebuild
      // Use the public /sites/current endpoint that detects site based on hostname
      const response = await axiosInstance.get('/sites/current');
      if (response.data.success) {
        const siteData = response.data.data;
        
        // Check if site ID has changed (another way to detect site switch)
        const storedSiteId = localStorage.getItem('current_site_id');
        if (storedSiteId && storedSiteId !== siteData._id) {
          console.log(`Site ID change detected: ${storedSiteId} -> ${siteData._id}`);
          // Clear authentication data
          clearAuthData();
          localStorage.setItem('current_site_id', siteData._id);
          // Force reload
          window.location.reload();
          return;
        }
        
        // Store current site ID
        localStorage.setItem('current_site_id', siteData._id);
        
        setCurrentSite(siteData);
        
        // Update document title with site name
        const newTitle = siteData.name || '2T DATA';
        document.title = newTitle;
        // Update favicon if available
        updateDynamicFavicon(siteData);
        
        // Update any logo meta tags if needed
        updateLogoMetaTags(siteData);
        
        } else {
        throw new Error('No site data received');
      }
      
    } catch (error) {
      console.error('Error detecting site:', error);
      // Fallback to default configuration
      setCurrentSite({
        name: '2TDATA',
        domains: ['localhost'],
        theme_config: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1F2937'
        },
        settings: {
          iframeUrl: 'https://www.hcwvietnam.com/2tdata_soltuion'
        }
      });
      // Set default title
      document.title = '2T DATA';
    } finally {
      setLoading(false);
    }
  };

  const refreshSiteConfig = async () => {
    if (!currentSite?._id) {
      // If no current site ID, re-detect the site
      return detectAndLoadSite();
    }
    
    try {
      const response = await axiosInstance.get('/sites/current');
      if (response.data.success) {
        const siteData = response.data.data;
        
        // Check if site has changed
        if (siteData._id !== currentSite._id) {
          console.log('Site change detected during refresh');
          // Clear auth data and reload
          clearAuthData();
          localStorage.setItem('current_site_id', siteData._id);
          localStorage.setItem('last_hostname', window.location.hostname);
          window.location.reload();
          return;
        }
        
        setCurrentSite(siteData);
        
        // Update favicon and logos dynamically
        updateDynamicFavicon(siteData);
        updateLogoMetaTags(siteData);
        
        // Update document title
        const newTitle = siteData.name || '2T DATA';
        document.title = newTitle;
        
        }
    } catch (error) {
      console.error('Error refreshing site config:', error);
    }
  };

  // Listen for hostname changes (in case of programmatic navigation)
  useEffect(() => {
    const checkHostnameChange = () => {
      const currentHostname = window.location.hostname;
      const storedHostname = localStorage.getItem('last_hostname');
      
      if (storedHostname && storedHostname !== currentHostname) {
        console.log('Hostname change detected via navigation');
        clearAuthData();
        localStorage.setItem('last_hostname', currentHostname);
        window.location.reload();
      }
    };
    
    // Check on popstate (browser back/forward)
    window.addEventListener('popstate', checkHostnameChange);
    
    return () => {
      window.removeEventListener('popstate', checkHostnameChange);
    };
  }, []);

  const value = {
    currentSite,
    loading,
    detectAndLoadSite,
    refreshSiteConfig
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};

// Site change detection hook
export const useSiteChangeDetection = () => {
  const { currentSite } = useSite();
  const [siteChanged, setSiteChanged] = useState(false);

  useEffect(() => {
    // Lưu site hiện tại vào localStorage khi load
    if (currentSite?._id) {
      const lastSiteId = localStorage.getItem('last_site_id');
      
      if (lastSiteId && lastSiteId !== currentSite._id) {
        console.log('🔄 Site change detected:', {
          from: lastSiteId,
          to: currentSite._id,
          siteName: currentSite.name
        });
        setSiteChanged(true);
      }
      
      localStorage.setItem('last_site_id', currentSite._id);
    }
  }, [currentSite]);

  return { siteChanged, resetSiteChange: () => setSiteChanged(false) };
};
