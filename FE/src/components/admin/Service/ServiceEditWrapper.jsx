import React from 'react';
import AdminProtectedRoute from '../../core/AdminProtectedRoute';
import ServiceEdit from './ServiceEdit';

const ServiceEditWrapper = () => {
  return (
    <AdminProtectedRoute>
      <ServiceEdit />
    </AdminProtectedRoute>
  );
};

export default ServiceEditWrapper;
