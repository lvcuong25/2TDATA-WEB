const fs = require('fs');

// Read file
let content = fs.readFileSync('components/admin/Site/SiteForm.jsx', 'utf8');

// Add import
if (!content.includes('PartnerLogosManager')) {
  const importIndex = content.indexOf("import DynamicFooter");
  content = content.slice(0, importIndex) + 
    "import PartnerLogosManager from './PartnerLogosManager';\n" + 
    content.slice(importIndex);
}

// Add handler for partner logos change
const handleFormChangeIndex = content.indexOf('const handleFormChange = (changedValues, allValues) => {');
if (handleFormChangeIndex > -1) {
  const handleFormChangeEnd = content.indexOf('};', handleFormChangeIndex);
  const beforeEnd = content.lastIndexOf('}', handleFormChangeEnd);
  
  const newHandler = `
  // Handle partner logos change
  const handlePartnerLogosChange = (newLogos) => {
    setFooterConfig(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        partners: newLogos
      }
    }));
    form.setFieldsValue({
      footer_config: {
        ...form.getFieldValue('footer_config'),
        logos: {
          ...form.getFieldValue(['footer_config', 'logos']),
          partners: newLogos
        }
      }
    });
  };
`;
  
  content = content.slice(0, handleFormChangeIndex) + newHandler + '\n  ' + content.slice(handleFormChangeIndex);
}

// Find Footer Config tab and add PartnerLogosManager
const footerTabIndex = content.indexOf('<TabPane tab="Cấu hình Footer"');
if (footerTabIndex > -1) {
  const endOfRow = content.indexOf('</Row>', footerTabIndex);
  const insertPoint = content.indexOf('</Row>', endOfRow + 1);
  
  const partnerLogosSection = `
            
            <Row gutter={24} style={{marginTop: 16}}>
              <Col span={24}>
                <PartnerLogosManager 
                  logos={footerConfig?.logos?.partners || []}
                  onChange={handlePartnerLogosChange}
                  siteName={form.getFieldValue('name') || 'site'}
                />
              </Col>
            </Row>`;
  
  content = content.slice(0, insertPoint) + partnerLogosSection + '\n' + content.slice(insertPoint);
}

// Write back
fs.writeFileSync('components/admin/Site/SiteForm.jsx', content);
console.log('Updated SiteForm.jsx successfully!');
