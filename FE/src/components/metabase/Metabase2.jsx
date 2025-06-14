import React from 'react'

const Metabase2 = () => {
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
          src="http://meta.2tdata.com/public/dashboard/1ec40b13-3143-4927-b0c4-a8c5be20ac11" 
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
    </div>
  )
}

export default Metabase2
