import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import { WorkerContext } from '../FreelancerContext';
import FreelancerMap from '../freelancermap';
import io from 'socket.io-client';
import Sidebar from '../Freelancer_Sidebar/freelancer_sidebar';

const socket = io('http://localhost:3001');

const FreelancerHome = () => {
    const {worker} = useContext(WorkerContext)
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const [menuOpen, setMenuOpen] = useState(false);
    const [clientLocation, setClientLocation] = useState([])
    const [workersData, setWorkersData] = useState([])
    const [clientsData, setClientsData] = useState([])
    const [loading, setLoading] = useState(true)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

    useEffect( () => {
        // Fetch initial availability status from the database
        const fetchAvailability = async () => {
            try {
              if(worker && worker.id){
                const response = await Axios.get(`http://localhost:3001/freelancers/${worker.id}/availability`)
                if (response.status === 200) {
                    setIsAvailable(response.data.isAvailable);
                } else {
                    console.error('Failed to fetch availability');
                }
                const locationData = async () => {
                  const response = await Axios.get('http://localhost:3001/clients');
    
                  if (locationData.status === 200) {
                      setClientsData(response.data)
                      console.log(response.data)
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



        socket.on('receiveLocation', (locationData) => {
            setClientLocation({ lat: parseFloat(locationData.latitude), lng: parseFloat(locationData.longitude) });
        });

        socket.on('receiveAvailability', (availabilityData) => {
          if (availabilityData.freelancerId === worker.id) {
            setIsAvailable(availabilityData.isAvailable);
          }
        });

        return () => {
          socket.off('receiveLocation');
          socket.off('receiveAvailability');
        };

    }, [worker]);


    const toggleAvailability = async () => {
      if(worker && worker.role === 'freelancer') {
        try {
            const newAvailability = !isAvailable;
            console.log('Toggling availability:', newAvailability , worker.id); // Debugging log
            const response = await Axios.post('http://localhost:3001/available', {
                freelancerId: worker.id,
                isAvailable: newAvailability
            });
            if (response.status === 200) {
                setIsAvailable(newAvailability);
                socket.emit('updateAvailability', { freelancerId: worker.id, isAvailable: newAvailability });
            } else {
                console.error('Failed to update availability');
            }
        } catch (error) {
            console.error('Error:', error);
        }
      }else{
        console.error('User is not a freelancer or not found')
      }
    };

    if (!worker || worker.role !== 'freelancer') {
      return <div>User not found or not a freelancer</div>;
  }

    /*if(loading){
      return <div>Loading...</div>
    }

    if (!user) {
        return <div>User not found</div>;
    }*/

    const logo = require('../../Components/Images/TalentTrove.png')

    return (
      <>
        <div>
            <Sidebar />
            <div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px",  }}>
                <img src={logo} />
              </div>
                <div className="checkbox-wrapper-5">
                    <div className="check" style={{top: '20%'}}>
                        <input id="check-5" type="checkbox" checked={isAvailable} onChange={toggleAvailability} />
                        <label htmlFor="check-5"></label>
                    </div>
                    <p style={{float: 'left',position: 'absolute', top: '24%', left: "22px"}}>{isAvailable ? 'Available' : 'Unavailable'}</p>
            </div>
            <FreelancerMap initialLocation={clientsData} />
        </div>
      </>

    );
};

export default FreelancerHome


