/*import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import { UserContext } from '../../UserContext';
import { FreelancerContext } from '../FreelancerContext';
import WorkerLogout from '../Worker_Logout/workerlogout';
import FreelancerMap from '../freelancermap';
import io from 'socket.io-client';


const socket = io('http://localhost:3001');

const FreelancerHome = () => {
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const { user } = useContext(UserContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const [clientLocation, setClientLocation] = useState([])
    const [workersData, setWorkersData] = useState([])
    const [clientsData, setClientsData] = useState([])

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

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

        const locationData = async () => {
          try {
              const response = await Axios.get('http://localhost:3001/clients', {
                  headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                  },
              });

              if (response.status !== 200) {
                  throw new Error('Failed to fetch data');
              }

              const workersJson = await response.data;
              /*setWorkersData(workersJson);*
              setClientsData(workersJson)
              console.log(workersJson); // Debugging log
          } catch (error) {
              console.error('Error fetching data:', error);
          }
      };

      locationData();

      const fetchData = async () => {
        try {
          const response = await fetch('http://localhost:3001/workers', {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          });
  
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
  
          const workersJson = await response.json();
          setWorkersData(workersJson);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
  
      fetchData();



        socket.on('receiveLocation', (locationData) => {
            setClientLocation({ lat: parseFloat(locationData.latitude), lng: parseFloat(locationData.longitude) });
        });

        socket.on('receiveAvailability', (availabilityData) => {
          if (availabilityData.freelancerId === user.id) {
            setIsAvailable(availabilityData.isAvailable);
          }
        });
    
        return () => {
            socket.disconnect();
        };

    }, [user])


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
                socket.emit('updateAvailability', { freelancerId: user.id, isAvailable: newAvailability });
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
            <nav className='nav'>
                <div className="burger-menu" onClick={toggleMenu}>
                    ☰
                </div>
            <ul className={menuOpen ? "nav-list show" : "nav-list"}>
                <li className='li'><a href="default.asp">Home</a></li>
                <li className='li'><a href="news.asp">News</a></li>
                <li className='li'><a href="contact.asp">Contact</a></li>
                <li className='li'><a href="about.asp">About</a></li>
                <li className='li'><WorkerLogout /></li>
            </ul>
            
            </nav>
                <div className="checkbox-wrapper-5">
                    <div className="check">
                        <input id="check-5" type="checkbox" checked={isAvailable} onChange={toggleAvailability} />
                        <label htmlFor="check-5"></label>
                    </div>
                    <p>{isAvailable ? 'Available' : 'Unavailable'}</p>
            </div>
            <FreelancerMap /*clientLocation*initialLocation={/*workersData* clientsData}/>
        </div>

    );
};

export default FreelancerHome*/

import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import { UserContext } from '../../UserContext';
import { FreelancerContext } from '../FreelancerContext';
import WorkerLogout from '../Worker_Logout/workerlogout';
import FreelancerMap from '../freelancermap';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

const FreelancerHome = () => {
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const { user } = useContext(UserContext);
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
              if(user){
                const response = await Axios.get(`http://localhost:3001/freelancer/${user.id}/availability`);
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
        }
    };

    /*if(loading){
      return <div>Loading...</div>
    }

    if (!user) {
        return <div>User not found</div>;
    }*/

    return (
      <>
        <div>
            <nav className='nav'>
                <div className="burger-menu" onClick={toggleMenu}>
                    ☰
                </div>
            <ul className={menuOpen ? "nav-list show" : "nav-list"}>
                <li className='li'><a href="default.asp">Home</a></li>
                <li className='li'><a href="news.asp">News</a></li>
                <li className='li'><a href="contact.asp">Contact</a></li>
                <li className='li'><a href="about.asp">About</a></li>
                <li className='li'><WorkerLogout /></li>
            </ul>
            
            </nav>
                <div className="checkbox-wrapper-5">
                    <div className="check">
                        <input id="check-5" type="checkbox" checked={isAvailable} onChange={toggleAvailability} />
                        <label htmlFor="check-5"></label>
                    </div>
                    <p>{isAvailable ? 'Available' : 'Unavailable'}</p>
            </div>
            <FreelancerMap /*clientLocation*/initialLocation={/*workersData*/ clientsData} />
        </div>
      </>

    );
};

export default FreelancerHome


