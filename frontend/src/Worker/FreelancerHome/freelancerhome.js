import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import { UserContext } from '../../UserContext';
import { FreelancerContext } from '../FreelancerContext'

/*const FreelancerHome = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  const handleToggle = async () => {
    try {
      const newAvailability = !isAvailable;
      setIsAvailable(newAvailability);

      const response = await Axios.post('http://localhost:3001/availability', {
        isAvailable: newAvailability
      }, {
        withCredentials: true
      });

      if (response.status !== 200) {
        throw new Error('Failed to update availability status');
      }

    } catch (error) {
      console.error('Error updating availability status:', error);
    }
  };

  return (
     <div>
        <label className="switch">
            <input type="checkbox" checked={isAvailable} onChange={handleToggle} />
            <span className="slider round"></span>
        </label>
        <p>{isAvailable ? 'You are available' : 'You are not available'}</p>
    </div>
  );
};*/

const FreelancerHome = () => {
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const { user } = useContext(UserContext);

    useEffect(() => {
        // Fetch initial availability status from the database
        const fetchAvailability = async () => {
            try {
                const response = await Axios.get(`http://localhost:3001/freelancer/${user.id}/availability`);
                if (response.status === 200) {
                    setIsAvailable(response.data.isAvailable);
                } else {
                    console.error('Failed to fetch availability');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };

        if (user) {
            fetchAvailability();
        }
    }, [user]);

    const toggleAvailability = async () => {
        try {
            const newAvailability = !isAvailable;
            console.log('Toggling availability:', newAvailability , user.id); // Debugging log
            const response = await Axios.post('http://localhost:3001/available', {
                freelancerId: user.id,
                isAvailable: newAvailability
            });
            if (response.status === 200) {
                setIsAvailable(newAvailability);
            } else {
                console.error('Failed to update availability');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <label className="switch">
                <input type="checkbox" checked={isAvailable} onChange={toggleAvailability} />
                <span className="slider round"></span>
            </label>
            <p>{isAvailable ? 'You are available' : 'You are not available'}</p>
        </div>
    );
};

export default FreelancerHome