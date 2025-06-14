import React from 'react'

const Metabase = () => {
  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
        <iframe 
          src="http://meta.2tdata.com/public/dashboard/8c8b3a08-cf9e-41f6-a406-d7d5ca7b620b" 
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
    </div>
  )
}

export default Metabase
