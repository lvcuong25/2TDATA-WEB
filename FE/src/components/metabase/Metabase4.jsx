import React from 'react'

const Metabase4 = () => {
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
          src="http://meta.2tdata.com/public/dashboard/794aef48-ee28-4dac-89bc-be3b2628b05c" 
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
        />
    </div>
  )
}

export default Metabase4
