import React from 'react';

const DynamicFooter = ({ config }) => {
  const {
    companyInfo,
    logos,
    quickLinks,
    socialLinks,
    copyright,
    styles
  } = config;

  return (
    <footer style={{ backgroundColor: styles.backgroundColor, color: styles.textColor }}>
      <div>
        <h1>{companyInfo.name}</h1>
        <p>{companyInfo.address}</p>
        <p>{companyInfo.hotline}</p>
        <p>{companyInfo.email}</p>
      </div>

      <div>
        {logos.main.image && (
          <a href={companyInfo.website || '#'}>
            <img src={logos.main.image} alt={logos.main.alt} />
          </a>
        )}
        {logos.partners.map((partner, index) => (
          <a key={index} href={partner.link}>
            <img src={partner.image} alt={partner.alt} />
          </a>
        ))}
      </div>

      <ul>
        {quickLinks.map((link, index) => (
          <li key={index}><a href={link.url}>{link.title}</a></li>
        ))}
      </ul>

      <div>
        {socialLinks.map((link, index) => (
          <a key={index} href={link.url}>Icon: {link.platform}</a>
        ))}
      </div>

      <p style={{ backgroundColor: styles.copyrightBgColor, color: styles.copyrightTextColor }}>
        {copyright}
      </p>
    </footer>
  );
};

export default DynamicFooter;
