import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SideBar from '../SideBar/sidebar'; // Assuming you have a SideBar component
import PayPal from '../Paypal/paypal'; // Assuming you have a PayPal component
import StarRating from '../SearchBar/starrating'; // Assuming you have a StarRating component
import '../Home/plumber.css';
import MapContainer from '../MapComponent/map';
import Axios from 'axios';
import ClientLocationMap from '../../Worker/freelancermap';
import io from 'socket.io-client';
import TopButton from '../BackToTop/top';
import { UserContext } from '../../UserContext';


const socket = io.connect('http://localhost:3001');

const Plumber = (props) => {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState('starRating');
    const [showMessageButton, setShowMessageButton] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [workersData, setWorkersData] = useState([]);
    const [clientLocation, setClientLocation] = useState(null);
    const [clientsData, setClientsData] = useState([]);
    const {user} = useContext(UserContext)
    const navigate = useNavigate()
  

    useEffect(() => {
        const getData = async () => {
            try {
                const response = await fetch('http://localhost:3001/workers');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                //console.log(data)
                setData(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        getData();

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
          
        const locationData = async () => {
            try {
                const response = await fetch('http://localhost:3001/clients', {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const clientsJson = await response.json();
                setClientsData(clientsJson);
                //console.log(clientsJson); // Debugging log
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        locationData();

        socket.on('receiveAvailability', (availabilityData) => {
            setWorkersData(prevData =>
              prevData.map(worker =>
                worker.id === availabilityData.freelancerId
                  ? { ...worker, isAvailable: availabilityData.isAvailable }
                  : worker
              )
            );
          });

          //console.log(workersData)
      
          return () => {
            socket.off('receiveAvailability');
          };

    }, [workersData]);

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const sortByName = (a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    };

    const sortByStarRating = (a, b) => b.rating - a.rating;

    const sortedData = [...data].sort(
        sortBy === 'name' ? sortByName : sortByStarRating
    );

    const handlePayButtonClick = () => {
        setShowMessageButton(false);
    };

    const handleSendLocation = async (workerId, workerName) => {        
            try {
                // Retrieve the client ID from localStorage
                const clientId = localStorage.getItem('userId');
                if (!clientId) {
                    console.error('Client ID not found in localStorage');
                    return;
                }
                const client = clientsData.find(worker => worker.id === clientId);
                const clientName = client.name
                console.log(clientName)
                console.log(client)
                if (client) {
                    setClientLocation({ lat: parseFloat(client.latitude), lng: parseFloat(client.longitude) });

                    const room = `room-${clientId}-${workerId}`;
    
                    // Emit the location to the WebSocket server
                    socket.emit('sendLocation', client);
                    socket.emit("join_room", {room});
                    navigate('/chat', { state: { room, workerName, clientName } })
                } else {
                    console.error('Client not found:', clientId);
                }
            } catch (error) {
                console.error('Error sending client location:', error);
            }
    };

    const logo1 = require("../Images/logo.png");
    const logo2 = require("../Images/taskfinders.png")
    const logo3 = require("../Images/TalentTrove.png")

    return (
        <>
            <div className="body-container">
                <header>
                    <div className='header'>
                    <aside><SideBar pageWrapId={'page-wrap'} outerContainerId={'outer-container'} /></aside>
                    <div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px",  }}>
                        <img src={logo3} />
                    </div>
                    </div>
                </header>
                <body>
                    <div className='searchbar'>
                        <input type="text" id="search" placeholder="Search for service" onChange={(event) => {
                            setSearchTerm(event.target.value); setSearchQuery(event.target.value)
                        }} value={searchQuery} />
                        <div id='map'>
                         <MapContainer data={workersData} searchQuery={searchQuery} />
                         </div>
                    </div>
                    <label className='sorting'>
                        Sort By:
                        <select value={sortBy} onChange={handleSortChange}>
                            <option value='starRating'>Star Rating (High to Low)</option>
                            <option value='name'>Name (A-Z)</option>
                        </select>
                    </label>
                    <div className='container'>
                        {sortedData.filter((value) => {
                            if (searchTerm === "") {
                                return value;
                            } else if (value.occupation.toLowerCase().includes(searchTerm.toLowerCase())) {
                                return value;
                            }
                        }).map((value, key) => {
                            return (
                                <div className='card_item' key={value.id}>
                                    <div className='card_inner'>
                                        <img src={'http://localhost:3001/images/' + value.images} alt='avatar' /><br />
                                        <div className='userName'>{value.name} {value.surname}</div>
                                        <div className='userJob'>{value.occupation}</div>
                                        <div className='userNumber'>{value.phone}</div>
                                        <div className='userStatus'>
                                            Status: {value.status}
                                            <span className={`status-button ${value.status === 'online' ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <div className='availability'>
                                            Availability: {value.isavailable ? 'Available' : 'Not Available'}
                                        </div>
                                        <div className='detail-box'>
                                            <StarRating />
                                        </div>
                                        <div className='buttons'>
                                            <PayPal onClick={handlePayButtonClick} />
                                            <button className='button' onClick={() => handleSendLocation(value.id)}>Message</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </body>
            </div>
            <TopButton />
        </> 
    );
};

export default Plumber;