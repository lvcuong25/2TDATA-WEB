import React from 'react'
import Header from '../Header'

const TermsOfService = () => {
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
        src="https://www.hcwvietnam.com/dieu-khoan-su-dung-dich-vu" 
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

export default TermsOfService
