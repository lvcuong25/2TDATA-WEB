import React from 'react'
import Header from '../Header'

const DataPolicy = () => {
  return (
    <div>
    <Header/>

    <div style={{ 
      position: 'fixed',
      top: 100,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <iframe 
        src="https://www.hcwvietnam.com/chinh-sach-thu-thap-va-xu-ly-du-lieu-ca-nhan-khach-hang" 
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
      />
    </div>
  </div>
  )
}

export default DataPolicy
