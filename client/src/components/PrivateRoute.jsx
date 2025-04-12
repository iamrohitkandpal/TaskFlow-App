import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * PrivateRoute component that checks if user is authenticated
 * Redirects to login if not authenticated, preserving the intended destination
 */
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If they are logged in, show the protected content
  return children;
};

export default PrivateRoute;