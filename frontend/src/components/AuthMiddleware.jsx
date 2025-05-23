import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthMiddleware = ({ children, allowedRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            }});
        
        // Check if user has required role
        if (allowedRoles.length > 0 && !allowedRoles.includes(response.data.userType)) {
          navigate('/unauthorized');
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, allowedRoles]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : null;
};

export default AuthMiddleware;