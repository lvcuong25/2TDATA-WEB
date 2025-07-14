import React from 'react';
import DynamicFooter from './DynamicFooter';
import Footer from './Footer';
import { useSiteFooter } from '../hooks/useSiteFooter';

const FooterWrapper = () => {
  const { footerConfig, isLoading } = useSiteFooter();

  // If loading or no config, show default Footer
  if (isLoading || !footerConfig) {
    return <Footer />;
  }

  // Use DynamicFooter with config from API
  return <DynamicFooter config={footerConfig} />;
};

export default FooterWrapper;
