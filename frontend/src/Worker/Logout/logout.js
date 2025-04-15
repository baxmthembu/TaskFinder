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
    //const {worker, setWorker} = useContext(WorkerContext)
    //const {role, setRole} = useContext(UserContext)
    const navigate = useNavigate();

    /*console.log('User context before logout:', user);*/

    const handleLogout = async () => {
        try {
            /*if (!user || !user.id || !worker || worker.id) {
                throw new Error('No user is logged in');
            }*/

            if (user?.role === 'freelancer'){
                await Axios.post('http://localhost:3001/workerlogout', {
                    freelancerId: user.id
                });
                setUser(null)
                localStorage.clear()
                navigate('/worker_login')
            }else if(user?.role === 'client'){
                await Axios.post('http://localhost:3001/clientlogout', {
                    clientId: user.id,
                })
                setUser(null)
                localStorage.clear()
                navigate('/login')
                throw new Error('Failed to logout')
            }
            //navigate('/navigator')
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
    return(
        <>
            <div style={styles.button}>
                <button className='button-77'  onClick={handleLogout}>Logout</button>
            </div>
            <p>or</p>
            <Freelancers />
        </>
    )
  };

  const styles = {
    button: {
        float: 'right',
        right: '20px',
        bottom: '1rem'
    }
  }

  export default Logout
