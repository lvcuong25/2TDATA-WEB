import React from 'react'

const Metabase5 = () => {
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
          src="http://meta.2tdata.com/public/dashboard/71a5e0fc-b406-4009-a5a8-eaac861b866c" 
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
    </div>
  )
}

export default Metabase5
