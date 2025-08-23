import React, {useContext} from 'react';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';
//import { WorkerContext } from '../FreelancerContext';
import './logout.css'
import Freelancers from '../freelancerDelete/freelancerDelete';
//import { right } from '@popperjs/core';


const Logout = () => {
    const { user, setUser } = useContext(UserContext);
    //const { worker, setWorker } = useContext(WorkerContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Check if user exists before proceeding
            if (!user || !user.id) {
                throw new Error('No user is logged in');
            }

            // Perform the appropriate logout based on user role
            if (user.role === 'freelancer') {
                await Axios.post('http://localhost:3001/workerlogout', {
                    freelancerId: user.id
                });
                /*await Axios.post(`${process.env.REACT_APP_API_URL}/workerlogout`, {
                    freelancerId: user.id
                });*/
            } else if (user.role === 'client') {
                await Axios.post('http://localhost:3001/clientlogout', {
                    clientId: user.id,
                });
                /*await Axios.post(`${process.env.REACT_APP_API_URL}/clientlogout`, {
                    clientId: user.id,
                });*/
            }

            // Clear user state and local storage
            setUser(null);
            //if (setWorker) setWorker(null); // Clear worker state if exists
            localStorage.clear();

            // Navigate after state is cleared
            navigate('/');
            
        } catch (error) {
            console.error('Error logging out:', error);
            // Optionally navigate to / even if there's an error
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

  export default Logout
