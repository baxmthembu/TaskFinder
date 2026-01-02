// AuthProvider.js
import { createContext, useContext, useEffect, useState } from 'react';
import Axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure Axios to send cookies with all requests
  useEffect(() => {
    Axios.defaults.withCredentials = true;

    const checkAuthStatus = async () => {
      try {
        const response = await Axios.get(`${process.env.REACT_APP_API_URL}/validate`);
        if (response.data.authenticated) {
          setUser(response.data.user);
          localStorage.setItem('role', response.data.user.role);
          localStorage.setItem('id', response.data.user.id);
        } else {
          setUser(null);
          localStorage.removeItem('role');
          localStorage.removeItem('id');
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error('Authentication check failed:', error);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function for clients
  const login = async (credentials) => {
    try {
      const response = await Axios.post(`${process.env.REACT_APP_API_URL}/login`, credentials);
      if (response.data.msg === "Authentication Successful") {
        setUser(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.msg };
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      return {
        success: false,
        error: errorData.msg || 'Login failed',
        field: errorData.field,
        errors: errorData.errors
      };
    }
  };

  // Login function for workers
  const worker_login = async (credentials) => {
    try {
      const response = await Axios.post(`${process.env.REACT_APP_API_URL}/workerlogin`, credentials);
      if (response.data.msg === "Authentication Successful") {
        setUser(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.msg };
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      return {
        success: false,
        error: errorData.msg || 'Login failed',
        field: errorData.field,
        errors: errorData.errors
      };
    }
  };

  const logout = async () => {
    try {
      await Axios.post(`${process.env.REACT_APP_API_URL}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('role');
      localStorage.removeItem('id');
    }
  };

  const value = {
    user,
    login,
    worker_login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};