import React from 'react'
import {  Route, Routes } from "react-router-dom";
import Home from '../components/Home';
import SignUp from '../components/signup.jsx';
import SignIn from '../components/signin.jsx';
import ResetPassword from '../components/ResetPassword.jsx';
import ServiceUse from '../components/ServiceUse.jsx';


const Router = () => {
  return (
    <div>
      <Routes>
       <Route>
       <Route index element={<Home/>}/>
       <Route path='/login' element={<SignIn/>}/>
       <Route path='/logup' element={<SignUp/>}/>
       <Route path='/rest-password' element={<ResetPassword/>}/>
       <Route path='/service-use' element={<ServiceUse/>}/>
       </Route>
        
       
      </Routes>
    </div>
  )
}

export default Router
