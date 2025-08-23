import { useEffect, useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from '../SearchBar/starrating'; // Assuming you have a StarRating component
import './home.css';
import io from 'socket.io-client';
import TopButton from '../BackToTop/top';
import logo from '../Images/taskaroo.svg';
import MapComponent from '../MapComponent/testmap';
import Axios from 'axios';
import Logout from '../../Worker/Logout/logout';
import ChatWidget from '../../ChatWidget';
import { UserContext } from '../../UserContext';
import { use } from 'react';
import { set } from 'date-fns';

//const socket = io.connect('https://taskfinder.onrender.com');
const socket = io('http://localhost:3001');

const Plumber = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState('starRating');
    const [showMessageButton, setShowMessageButton] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [workersData, setWorkersData] = useState([]);
    const [clientsData, setClientsData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;
    const [isMapLoading, setIsMapLoading] = useState(true);
    const [responseStatus, setResponseStatus] = useState({});
    //const [activeChat, setActiveChat] = useState(null);
    const [activeChats, setActiveChats] = useState([]);
    const {user} = useContext(UserContext);
    const [conversations, setConversations] = useState([]);
    
    useEffect(() => {
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
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        locationData();

        const handler = (availabilityData) => {
            setWorkersData(prev =>
                prev.map(worker =>
                    worker.id === availabilityData.freelancerId
                    ? { ...worker, isAvailable: availabilityData.isAvailable }
                    : worker
                )
            );
        };

        socket.on('receiveAvailability', handler);
      
        return () => {
            socket.off('receiveAvailability', handler);
        };
    }, [workersData]);

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const sortByName = (a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    };

    const sortByStarRating = (a, b) => b.rating - a.rating;

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        const filtered = workersData.filter((value) => {
            if (searchTerm.trim() === "") {
                return value.status === 'online' && value.isavailable;
            }
            return (
                value.occupation.toLowerCase().includes(searchTerm.toLowerCase()) &&
                value.status === 'online' && 
                value.isavailable
            );
        });

        return [...filtered].sort(
            sortBy === 'name' ? sortByName : sortByStarRating
        );
    }, [workersData, searchTerm, sortBy]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAndSortedData.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 when filters/sorting change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);
    
    const handleFreelancerDecision = async ({ clientId, workerId, decision, room }) => {
        if (decision === "accepted") {
            const worker = workersData.find(w => w.id === workerId);
            if (!worker) return;
        
            // Create new chat object
            const newChat = {
                room,
                currentUser: {
                    id: clientId,
                    name: `${user.name} ${user.surname}`,
                    role: 'client'
                },
                otherUser: {
                    id: workerId,
                    name: `${worker.name} ${worker.surname}`,
                    role: 'freelancer',
                    image: worker.images
                }
            };

            // Add to active chats instead of replacing
            setActiveChats(prev => {
                // Check if chat already exists
                if (prev.some(chat => chat.room === room)) return prev;
                return [...prev, newChat];
            });
        
            // Join the new room
            socket.emit("join_room", { room });
        
            // Force refresh of conversations list
            socket.emit("request_chat_update", { userId: user.id });
        }
    };

    useEffect(() => {
        const handleStatusUpdate = ({ workerId, decision }) => {
            setResponseStatus(prev => ({
                ...prev,
                [workerId]: decision
            }));
        };

        socket.on('freelancer_decision', handleStatusUpdate);
        return () => socket.off('freelancer_decision', handleStatusUpdate);
    }, []);

    // Add this to handle chat creation
    useEffect(() => {
        const handleRefreshChats = async ({ userId }) => {
            if (userId === user.id) {
                try {
                    const response = await fetch(`http://localhost:3001/chats/${userId}`);
                    const data = await response.json();
                
                    // Update conversations
                    setConversations(data);
                
                    // Keep any active chats that still exist
                    setActiveChats(prev => {
                        return prev.filter(chat => 
                            data.some(dbChat => dbChat.room_id === chat.room)
                        );
                    });
                
                    // Add any missing active chats from the refreshed data
                    data.forEach(dbChat => {
                        if (!activeChats.some(chat => chat.room === dbChat.room_id)) {
                            const otherUserId = dbChat.client_id === user.id 
                                ? dbChat.freelancer_id 
                                : dbChat.client_id;
                            const otherUserName = dbChat.client_id === user.id 
                                ? dbChat.freelancer_name 
                                : dbChat.client_name;
                            
                            setActiveChats(prev => [...prev, {
                                room: dbChat.room_id,
                                currentUser: {
                                    id: user.id,
                                    name: `${user.name} ${user.surname}`,
                                    role: user.role
                                },
                                otherUser: {
                                    id: otherUserId,
                                    name: otherUserName,
                                    role: user.role === 'client' ? 'freelancer' : 'client'
                                }
                            }]);
                        }
                    }); 
                } catch (error) {
                    console.error('Error refreshing chats:', error);
                }
            }
        };

        socket.on("refresh_chats", handleRefreshChats);
        return () => socket.off("refresh_chats", handleRefreshChats);
    }, [user.id, activeChats]); // Add activeChats to dependencies


    const handlePayButtonClick = () => {
        setShowMessageButton(false);
    };

    // Add this useEffect for handling chat updates
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await fetch(`http://localhost:3001/chats/${user.id}`);
                const data = await response.json();
                setConversations(data);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };

        fetchConversations();
    }, [user.id]);

    useEffect(() => {
        const handleNewChat = (newChat) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.room_id === newChat.room_id);
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = newChat;
                    return updated;
                }
                return [newChat, ...prev];
            });

            // If this is a new chat for the current user, add to active chats
            if ((newChat.client_id === user.id || newChat.freelancer_id === user.id) && 
                !activeChats.some(chat => chat.room === newChat.room_id)) {
            
                const otherUserId = newChat.client_id === user.id ? newChat.freelancer_id : newChat.client_id;
                const otherUserName = newChat.client_id === user.id ? newChat.freelancer_name : newChat.client_name;
            
                setActiveChats(prev => [...prev, {
                    room: newChat.room_id,
                    currentUser: {
                        id: user.id,
                        name: `${user.name} ${user.surname}`,
                        role: user.role
                    },
                    otherUser: {
                        id: otherUserId,
                        name: otherUserName,
                        role: user.role === 'client' ? 'freelancer' : 'client'
                    }
                }]);
            }
            socket.emit('join_room', { room: newChat.room_id });
        };

        socket.on('chat_created', handleNewChat);
        return () => socket.off('chat_created', handleNewChat);
    }, [user.id, activeChats]);

    useEffect(() => {
        const handleFreelancerDecisionEvent = (data) => {
            handleFreelancerDecision(data);
        };

        socket.on("freelancer_decision", handleFreelancerDecisionEvent);
        return () => socket.off("freelancer_decision", handleFreelancerDecisionEvent);
    }, [workersData, user.id, user.name, user.surname]);

    const handleSendLocation = async (workerId) => {
        const clientId = localStorage.getItem('id');
        const client = clientsData.find(worker => worker.id === clientId);

        try {
            const response = await Axios.get(`http://localhost:3001/tasks/${clientId}`);
            const taskData = response.data;
            if (client && taskData) {
                const room = [clientId, workerId].sort().join('-');
                socket.emit("join_room", { room });

            const locationPayload = {
                location: {
                    latitude: client.latitude,
                    longitude: client.longitude,
                    name: client.name,
                    surname: client.surname,
                    id: clientId
                },
                freelancerId: workerId,
                serviceRequest: taskData
            };

            socket.emit('sendLocation', locationPayload);
            setResponseStatus(prev => ({ ...prev, [workerId]: 'pending' }));
            
            }
        } catch(error) {
            console.error('Error fetching task: ', error);
        }
    };


    const handlePageClick = (pageNum) => {
        setCurrentPage(pageNum);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCloseChat = (room) => {
        socket.emit('leave_room', { room });
        setActiveChats(prev => prev.filter(chat => chat.room !== room));
    };


    return (
    <>
    <div className="body-container">
        <header>
            <div className='header'>
                <div className='request-form-logo'>
                    <img src={logo} alt='logo'/>
                </div>
                <div className='searchbar'>
                    <input 
                        type="text" 
                        id="search" 
                        placeholder="Search for service (example: electrician, barber, plumber, etc)" 
                        onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setSearchQuery(event.target.value);
                        }} 
                        value={searchQuery} 
                    />
                </div>
                <Logout />
            </div>
        </header>
        <label className='sorting'>
            Sort By:
            <select value={sortBy} onChange={handleSortChange}>
                <option value='starRating'>Star Rating (High to Low)</option>
                <option value='name'>Name (A-Z)</option>
            </select>
        </label>

        <div className="main-content">
            {/*Map on the left */}
                <div className={`map-container ${isMapLoading ? 'loading' : ''}`}>
                    {isMapLoading && <div className="loading-message">Loading map...</div>}
                    <div className='map'>
                        <MapComponent data={workersData} searchQuery={searchQuery} clientsData={clientsData} setIsMapLoading={setIsMapLoading} activeChats={activeChats}
                        setActiveChats={setActiveChats}
                        handleFreelancerDecision={handleFreelancerDecision} />
                    </div>
                </div>
            {/* Cards on the right */}
                <div className="cards-container">
                
                    <div className='container'>
                        {currentItems.length > 0 ? (
                            currentItems.map((value) => (
                                <div className='card_item' key={value.id}>
                                    <div className='card_inner'>
                                        <img 
                                            src={'http://localhost:3001/images/' + value.images} 
                                            alt='avatar' 
                                        />
                                        <div className='userName'>
                                            {value.name} {value.surname}
                                        </div>
                                        <div className='userJob'>{value.occupation}</div>
                                        <div className='userStatus'>
                                            Status: {value.status}
                                            <span className={`status-button ${value.status === 'online' ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <div className='availability'>
                                            Availability: {value.isavailable ? 'Available' : 'Not Available'}
                                        </div>
                                        {responseStatus[value.id] === 'declined' && (
                                            <div style={{ color: 'red' }}>
                                                <span className="status-dot red"></span> Declined
                                            </div>
                                        )}
                                        {responseStatus[value.id] === 'accepted' && (
                                            <div style={{ color: 'green' }}>
                                                <span className="status-dot green"></span> Accepted
                                            </div>
                                        )}
                                        {responseStatus[value.id] === 'pending' && (
                                            <div style={{ color: 'gray' }}>Waiting for response...</div>
                                        )}
                                        <div className='detail-box'>
                                            <StarRating />
                                        </div>
                                        <div className='buttons'>
                                            <button 
                                                className='button' 
                                                onClick={() => handleSendLocation(value.id)/*handleSendLocation(value.id, `${value.name} ${value.surname}`)*/}
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='no-results'>
                                No workers found matching your criteria
                            </div>
                        )}
                    </div>
                </div>
        </div>
        
        {/* Pagination at bottom right */}
        {totalPages > 1 && (
            <div className='pagination-container'>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={currentPage === page ? 'active' : ''}
                    >
                        {page}
                    </button>
                ))}
            </div>
        )}
        {/*<TopButton />*/}
        {activeChats.map(chat => (
            <ChatWidget 
                key={chat.room}
                room={chat.room}
                currentUser={chat.currentUser}
                otherUser={chat.otherUser}
                onClose={() => {
                    setActiveChats(prev => prev.filter(c => c.room !== chat.room));
                    socket.emit('leave_room', { room: chat.room });
                    console.log(`Left room: ${chat.room}`);
                }}
            />
        ))}
    </div>
    </>
    );
};

export default Plumber;