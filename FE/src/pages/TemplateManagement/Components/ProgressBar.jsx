import React from 'react';

const ProgressBar = ({ value, max = 100, color = '#1890ff', height = '8px', showLabel = true }) => {
  const percentage = Math.min(max, Math.max(0, value));
  const width = (percentage / max) * 100;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      width: '100%',
      height: '100%'
    }}>
      <div style={{
        width: '100%',
        height: height,
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          width: `${width}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
};

export default ProgressBar;
