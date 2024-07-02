import React, {useContext} from 'react';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../UserContext';

const Logout = () => {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    console.log('User context before logout:', user);

    const handleLogout = async () => {
        try {
            if (!user || !user.id) {
            throw new Error('No user is logged in');
        }

        if (user.role === 'freelancer'){
            await Axios.post('http://localhost:3001/workerlogout', {
                freelancerId: user.id
            })
        }else if(user.role === 'client'){
            await Axios.post('http://localhost:3001/clientlogout', {
                clientId: user.id,
            })
        } else{
            throw new Error('Failed to logout')
        }

        // Clear user context and redirect to login page
        setUser(null);
        navigate(user.role === 'freelancer' ? '/worker_login' : '/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
    return(
        <div>
            <button onClick={handleLogout}>Logout</button>
        </div>
    )
  };

  export default Logout
