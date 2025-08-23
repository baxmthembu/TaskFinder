import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import FreelancerMap from '../FreelancerMap/freelancermap';
import io from 'socket.io-client';
import Sidebar from '../Freelancer_Sidebar/freelancer_sidebar';
import { UserContext } from '../../UserContext';
import logo from '../../Components/Images/taskaroo.svg'
import Logout from '../Logout/logout';
import ChatWidget from '../../ChatWidget';

//const socket = io('https://taskfinder.onrender.com')
const socket = io('http://localhost:3001');


const FreelancerHome = () => {
    const {user} = useContext(UserContext)
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const [clientLocation,setClientLocation] = useState([])
    const [clientsData, setClientsData] = useState([])
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null);
    const [activeChats, setActiveChats] = useState([]);

    useEffect( () => {
      if (user && user.role === 'freelancer') {
        // Identify as freelancer when component mounts
        socket.emit('freelancer_identify', user.id);
        // Fetch initial availability status from the database
        const fetchAvailability = async () => {
            try {
              if(user && user.id){
                socket.emit('freelancer_identify', user.id);
                const response = await Axios.get(`http://localhost:3001/freelancer/${user.id}/availability`);
                //const response = await Axios.post(`${process.env.REACT_APP_API_URL}/freelancer/${user.id}/availability`);
                if (response.status === 200) {
                    setIsAvailable(response.data.isAvailable);
                } else {
                    console.error('Failed to fetch availability');
                }
                const locationData = async () => {
                  const responses = await Axios.get('http://localhost:3001/clients');
                  //const responses = await Axios.post(`${process.env.REACT_APP_API_URL}/clients`);
    
                  if (responses.status === 200) {
                      setClientsData(responses.data)
                      console.log(responses.data)
                  }else{
                    throw new Error('Failed to fetch clients data')
                  }
              }
               await locationData()
            }
            } catch (error) {
                console.error('Error fetching data:', error );
            }finally{
              setLoading(false)
            }
            };

            fetchAvailability();

        // Handle browser tab closing
        const handleBeforeUnload = () => {
            if (isAvailable && user?.id) {
                // Not ideal but can help in some cases
                socket.emit('updateAvailability', { 
                    freelancerId: user.id, 
                    isAvailable: false 
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

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
          window.removeEventListener('beforeunload', handleBeforeUnload);
          socket.off('recieveAvailability');
          if(user && user.role === 'freelancer'){
            socket.off('freelancer_identify')
          }
        };
      }
    }, [user, isAvailable]);

    useEffect(() => {
        const handleNewChat = (newChat) => {
            if ((newChat.freelancer_id === user.id) && 
                !activeChats.some(chat => chat.room === newChat.room_id)) {
            
                setActiveChats(prev => [...prev, {
                    room: newChat.room_id,
                    currentUser: {
                        id: user.id,
                        name: `${user.name} ${user.surname}`,
                        role: 'freelancer'
                    },
                    otherUser: {
                        id: newChat.client_id,
                        name: newChat.client_name,
                        role: 'client'
                    }
                }]);
            }
        };

        socket.on('chat_created', handleNewChat);
        return () => socket.off('chat_created', handleNewChat);
    }, [user.id,user.name,user.surname, activeChats]);

    useEffect(() => {
        const handleRefreshChats = async ({ userId }) => {
            if (userId === user.id) {
                try {
                    const response = await fetch(`http://localhost:3001/chats/${userId}`);
                    const data = await response.json();
                
                    // Filter to only chats where current user is the freelancer
                    const freelancerChats = data.filter(chat => chat.freelancer_id === user.id);
                
                    setActiveChats(prev => {
                        // Merge existing with new chats
                        const newChats = freelancerChats.filter(dbChat => 
                            !prev.some(chat => chat.room === dbChat.room_id)
                        ).map(dbChat => ({
                            room: dbChat.room_id,
                            currentUser: {
                                id: user.id,
                                name: `${user.name} ${user.surname}`,
                                role: 'freelancer'
                            },
                            otherUser: {
                                id: dbChat.client_id,
                                name: dbChat.client_name,
                                role: 'client'
                            }
                        }));
                    
                        return [...prev, ...newChats];
                    });
                } catch (error) {
                    console.error('Error refreshing chats:', error);
                }
            }
        };

        socket.on("refresh_chats", handleRefreshChats);
        return () => socket.off("refresh_chats", handleRefreshChats);
    }, [user.id, user.name, user.surname]);

    useEffect(() => {
        const handleReceiveMessage = (data) => {
            setActiveChats(prev => prev.map(chat => {
                if (chat.room === data.room) {
                    return {
                        ...chat,
                        lastMessage: data.message,
                        lastMessageTime: data.timestamp
                    };
                }
                return chat;
            }));
        };

        socket.on('receive_message', handleReceiveMessage);
        return () => socket.off('receive_message', handleReceiveMessage);
    }, []);


    const toggleAvailability = async () => {
      if(user && user.role === 'freelancer') {
        try {
            const newAvailability = !isAvailable;
            console.log('Toggling availability:', newAvailability , user.id); // Debugging log
            const response = await Axios.post('http://localhost:3001/available', {
                freelancerId: user.id,
                isAvailable: newAvailability
            });
            /*const response = await Axios.post(`${process.env.REACT_APP_API_URL}/available`, {
              freelancerId: user.id,
              isAvailable: newAvailability
            });*/
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


    const handleDecisionFromMap = (decision, selectedMarker) => {
        if (decision === 'accepted' && user) {
            const room = [selectedMarker.id, user.id].sort().join('-');
        
            // Join the room without leaving others
            socket.emit("join_room", { room });
        
            setActiveChats(prev => {
                // Check if chat already exists
                if (prev.some(chat => chat.room === room)) return prev;
            
                return [...prev, {
                    room,
                    currentUser: {
                        id: user.id,
                        name: `${user.name} ${user.surname}`,
                        role: 'freelancer',
                        image: user.images
                    },
                    otherUser: {
                        id: selectedMarker.id,
                        name: `${selectedMarker.name} ${selectedMarker.surname}`,
                        role: 'client'
                    }
                }];
            });
        }
    };

    return (
      <>
        <div className='body-container'>
          <header>
            <div className='header'>
              <div className='request-form-logo'>
                <img src={logo} alt='logo' />
              </div>
            </div>
            <div className='freelancerhome-logout'>
              <Logout className="freelancerhome-logout"/>
            </div>
          </header>
            <Sidebar />
            {/*<div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px",  }}>
                <img src={logo} alt='logo' />
              </div>*/}
              <div className="checkbox-wrapper-5">
                <div className="check" style={{top: '20%'}}>
                  <input id="check-5" type="checkbox" checked={isAvailable} onChange={toggleAvailability} />
                  <label htmlFor="check-5"></label>
                </div>
                <p style={{float: 'left',position: 'absolute', top: '24%', left: "22px"}}>{isAvailable ? 'Available' : 'Unavailable'}</p>
              </div>
            <FreelancerMap initialLocation={clientsData.map(client => ({
                lat: client.latitude,
                lng: client.longitude,
              }))}
            onDecision={handleDecisionFromMap} />
            {activeChats.map(chat => (
                <ChatWidget 
                    key={chat.room}
                    room={chat.room}
                    currentUser={chat.currentUser}
                    otherUser={chat.otherUser}
                    onClose={() => {
                        setActiveChats(prev => prev.filter(c => c.room !== chat.room));
                        socket.emit('leave_room', { room: chat.room });
                    }}
                />
            ))}
        </div>
      </>

    );
};

export default FreelancerHome


