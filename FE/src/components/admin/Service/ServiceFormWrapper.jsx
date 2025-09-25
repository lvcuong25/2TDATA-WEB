import React from 'react';
import AdminProtectedRoute from '../../core/AdminProtectedRoute';
import ServiceForm from './ServiceForm';

const ServiceFormWrapper = () => {
  return (
    <AdminProtectedRoute>
      <ServiceForm />
    </AdminProtectedRoute>
  );
};

export default ServiceFormWrapper;
