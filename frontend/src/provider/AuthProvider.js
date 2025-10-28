// AuthProvider.js
/*import React, { createContext, useContext, useEffect, useState } from 'react';
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
    checkAuthStatus();
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      //const response = await Axios.get(`${process.env.REACT_APP_API_URL}/validate`);
      const response = await Axios.get('http://localhost:3001/validate')
      if (response.data.authenticated) {
        setUser(response.data.user);
        // Store user info in localStorage for quick access (non-sensitive data only)
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('role');
        localStorage.removeItem('id');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      //const response = await Axios.post(`${process.env.REACT_APP_API_URL}/login`, credentials);
      const response = await Axios.post('http://localhost:3001/login', credentials)
      
      if (response.data.msg === "Authentication Successful") {
        setUser(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.msg };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const worker_login = async (credentials) => {
    try {
      //const response = await Axios.post(`${process.env.REACT_APP_API_URL}/login`, credentials);
      const response = await Axios.post('http://localhost:3001/worker_login', credentials)
      
      if (response.data.msg === "Authentication Successful") {
        setUser(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.msg };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      //await Axios.post(`${process.env.REACT_APP_API_URL}/logout`);
      await Axios.post('http://localhost:3001/logout');
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
    client_logout,
    loading,
    checkAuthStatus,
    worker_login
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};*/

// AuthProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
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

    const verifyUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); // Set user immediately to prevent redirect
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
          localStorage.clear();
        }
      }

      try {
        const response = await Axios.get('http://localhost:3001/validate');
        if (response.data.authenticated) {
          const fetchedUser = response.data.user;
          setUser(fetchedUser);
          localStorage.setItem('user', JSON.stringify(fetchedUser));
          localStorage.setItem('role', fetchedUser.role);
          localStorage.setItem('id', fetchedUser.id);
        } else {
          // Only clear if we have stored user data but backend says not authenticated
          if (storedUser) {
            setUser(null);
            localStorage.clear();
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Don't clear localStorage on network errors - keep user logged in
        // Only clear if we definitively know the session is invalid
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      const response = await Axios.get('http://localhost:3001/validate');
      if (response.data.authenticated) {
        setUser(response.data.user);
        // Store user info in localStorage for quick access (non-sensitive data only)
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
      } else {
        setUser(null);
        localStorage.removeItem('role');
        localStorage.removeItem('id');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function for clients
  const login = async (credentials) => {
    try {
      const response = await Axios.post('http://localhost:3001/login', credentials);
      
      if (response.data.msg === "Authentication Successful") {
        setUser(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Store user object
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.msg };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // Login function for workers
  const worker_login = async (credentials) => {
    try {
      const response = await Axios.post('http://localhost:3001/workerlogin', credentials);
      
      if (response.data.msg === "Authentication Successful") {
        setUser(response.data.user);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('id', response.data.user.id);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Store user object
        return { success: true, user: response.data.user };
      } else {
        return { success: false, error: response.data.msg };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('id');
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