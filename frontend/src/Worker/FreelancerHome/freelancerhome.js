import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import FreelancerMap from '../freelancermap';
import io from 'socket.io-client';
import Sidebar from '../Freelancer_Sidebar/freelancer_sidebar';
import { UserContext } from '../../UserContext';
import Freelancers from '../freelancerDelete/freelancerDelete';

const socket = io('http://localhost:3001');

const FreelancerHome = () => {
    const {user} = useContext(UserContext)
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const [clientLocation, setClientLocation] = useState([])
    const [clientsData, setClientsData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect( () => {
        // Fetch initial availability status from the database
        const fetchAvailability = async () => {
            try {
              if(user && user.id){
                const response = await Axios.get(`http://localhost:3001/freelancer/${user.id}/availability`)
                if (response.status === 200) {
                    setIsAvailable(response.data.isAvailable);
                } else {
                    console.error('Failed to fetch availability');
                }
                const locationData = async () => {
                  const responses = await Axios.get('http://localhost:3001/clients');
    
                  if (locationData.status === 200) {
                      setClientsData(responses.data)
                      console.log(responses.data)
                  }else{
                    throw new Error('Failed to fetch clients data')
                  }
              }
            }
            } catch (error) {
                console.error('Error fetching data:', error );
            }finally{
              setLoading(false)
            }
            };

            fetchAvailability();



        /*socket.on('receiveLocation', (locationData) => {
            setClientLocation({ lat: parseFloat(locationData.latitude), lng: parseFloat(locationData.longitude) });
        });*/

        socket.on('receiveLocation', (locationData) => {
          if (locationData?.latitude && locationData?.longitude) {
            setClientLocation({ 
              lat: parseFloat(locationData.latitude), 
              lng: parseFloat(locationData.longitude) 
            });
          }
        });
        

        socket.on('receiveAvailability', (availabilityData) => {
          if (availabilityData.freelancerId === user.id) {
            setIsAvailable(availabilityData.isAvailable);
          }
        });

        return () => {
          socket.off('receiveLocation');
          socket.off('receiveAvailability');
        };

    }, [user]);


    const toggleAvailability = async () => {
      if(user && user.role === 'freelancer') {
        try {
            const newAvailability = !isAvailable;
            console.log('Toggling availability:', newAvailability , user.id); // Debugging log
            const response = await Axios.post('http://localhost:3001/available', {
                freelancerId: user.id,
                isAvailable: newAvailability
            });
            if (response.status === 200) {
                setIsAvailable(newAvailability);
                socket.emit('updateAvailability', { freelancerId: user.id, isAvailable: newAvailability });
            } else {
                console.error('Failed to update availability');
            }
        } catch (error) {
            console.error('Error:', error);
            //setIsAvailable(!newAvailability); // Revert to previous state
        }
      }else{
        console.error('User is not a freelancer or not found')
      }
    };

    const logo = require('../../Components/Images/TalentTrove.png')

    return (
      <>
        <div>
            <Sidebar />
            <div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px",  }}>
                <img src={logo} alt='logo' />
              </div>
                <div className="checkbox-wrapper-5">
                    <div className="check" style={{top: '20%'}}>
                        <input id="check-5" type="checkbox" checked={isAvailable} onChange={toggleAvailability} />
                        <label htmlFor="check-5"></label>
                    </div>
                    <p style={{float: 'left',position: 'absolute', top: '24%', left: "22px"}}>{isAvailable ? 'Available' : 'Unavailable'}</p>
            </div>
            {/*<FreelancerMap initialLocation={clientsData} />*/}
            <FreelancerMap initialLocation={clientsData.map(client => ({
                lat: client.latitude,
                lng: client.longitude,
              }))} />

        </div>
      </>

    );
};

export default FreelancerHome


