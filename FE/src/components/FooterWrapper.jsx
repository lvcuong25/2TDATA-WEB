import React from 'react';
import DynamicFooter from './DynamicFooter';
import Footer from './Footer';
import { useSiteFooter } from '../hooks/useSiteFooter';

const FooterWrapper = () => {
  try {
    const { footerConfig, isLoading, error } = useSiteFooter();

    // If loading, error, or no config, show default Footer
    if (isLoading || error || !footerConfig) {
      return <Footer />;
    }

    // Use DynamicFooter with config from API
    return <DynamicFooter config={footerConfig} />;
  } catch (error) {
    console.error('FooterWrapper error:', error);
    // Fallback to default Footer if any error occurs
    return <Footer />;
  }
};

export default FooterWrapper;
