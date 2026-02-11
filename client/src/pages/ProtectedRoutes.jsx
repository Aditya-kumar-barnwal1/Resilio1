import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // 1. Get User Data from LocalStorage
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  // 2. CHECK: Is the user logged in?
  if (!token || !user) {
    // If not, kick them back to Login
    return <Navigate to="/" replace />;
  }

  // 3. CHECK: Does the user have the correct ROLE?
  // (e.g. If a 'Rescuer' tries to enter the 'Admin' dashboard)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    
    // If they are logged in but in the wrong place, send them to THEIR home.
    if (user.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } 
    
    if (user.role === 'rescuer') {
      return <Navigate to="/rescuer" replace />;
    }

    // Fallback for unknown roles
    return <Navigate to="/" replace />;
  }

  // 4. Access Granted! Render the page.
  return children;
};

export default ProtectedRoute;