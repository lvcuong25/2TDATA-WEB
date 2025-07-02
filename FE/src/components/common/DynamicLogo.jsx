import React from 'react';
import { useSite } from '../../context/SiteContext';

/**
 * Dynamic Logo Component
 * Automatically displays the correct logo based on current site configuration
 * 
 * @param {Object} props
 * @param {string} props.className - CSS classes for styling
 * @param {string} props.alt - Alternative text for the logo
 * @param {string} props.type - Type of logo to display ('main', 'favicon', 'header')
 * @param {string} props.fallback - Fallback image URL if no logo is configured
 * @param {Object} props.style - Inline styles
 * @param {function} props.onClick - Click handler
 */
const DynamicLogo = ({ 
  className = '', 
  alt, 
  type = 'main', 
  fallback = '/src/image/image.jpg',
  style = {},
  onClick,
  ...props 
}) => {
  const { currentSite, loading } = useSite();

  // Determine which logo URL to use based on type and availability
  const getLogoUrl = () => {
    if (!currentSite) return fallback;

    switch (type) {
      case 'favicon':
        return currentSite.theme_config?.faviconUrl || 
               currentSite.logo_url || 
               fallback;
      
      case 'header':
      case 'main':
      default:
        return currentSite.theme_config?.logoUrl || 
               currentSite.logo_url || 
               fallback;
    }
  };

  // Generate appropriate alt text
  const getAltText = () => {
    if (alt) return alt;
    if (currentSite?.name) return `${currentSite.name} Logo`;
    return 'Site Logo';
  };

  const logoUrl = getLogoUrl();
  const altText = getAltText();

  // Show loading placeholder while site data is loading
  if (loading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse rounded ${className}`}
        style={{ width: '100px', height: '40px', ...style }}
        aria-label="Loading logo..."
      />
    );
  }

  return (
    <img
      src={logoUrl}
      alt={altText}
      className={`object-contain ${className}`}
      style={style}
      onClick={onClick}
      onError={(e) => {
        // Fallback to default image if logo fails to load
        if (e.target.src !== fallback) {
          console.warn(`Failed to load logo: ${e.target.src}, falling back to: ${fallback}`);
          e.target.src = fallback;
        }
      }}
      {...props}
    />
  );
};

export default DynamicLogo;
