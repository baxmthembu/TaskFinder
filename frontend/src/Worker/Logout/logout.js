/*import React, {useContext} from 'react';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../provider/Authprovider';
import './logout.css'
import Freelancers from '../freelancerDelete/freelancerDelete';


const Logout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
            navigate('/');
        }
    };

    return (
        <div style={styles.button}>
            <button className='button-77' onClick={handleLogout}>Logout</button>
        </div>
    );
};


  const styles = {
    button: {
        float: 'right',
        right: '20px',
        bottom: '1rem'
    }
  }

  export default Logout*/

// Logout.js
import { useAuth } from '../../provider/Authprovider';
import { useNavigate } from 'react-router-dom';
import './logout.css';

const Logout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.clear();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
            localStorage.clear();
            navigate('/');
        }
    };

    // Optional: Display different logout message based on user role
    const getLogoutMessage = () => {
        if (user) {
            return 'Logout';
        }
        return 'Logout';
    };

    return (
      <div className="absolute top-12 right-20 z-50">
        <button 
            onClick={handleLogout}
            className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
        >
            <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>{getLogoutMessage()}</span>
            </div>
        </button>
    </div>
    );
};


export default Logout;
