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
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'
import { Tooltip } from 'react-tooltip'

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
      <div className="">
        <button 
            onClick={handleLogout}
            className="bg-transparent text-gray-600 hover:bg-gray-100 rounded-md px-4 py-2 transition-colors"
            data-tooltip-id="logout-tooltip"
            data-tooltip-content="Logout"
        >
            <div className="flex items-center space-x-2">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </div>
        </button>
        <Tooltip id="logout-tooltip" />
    </div>
    );
};


export default Logout;
