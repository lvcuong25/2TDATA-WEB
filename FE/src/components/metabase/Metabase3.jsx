import React from 'react'

const Metabase3 = () => {
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
          src="https://metabase.com/app/embed/1234567890/dashboard/1234567890" 
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
    </div>
  )
}

export default Metabase3
