import { toast } from 'react-toastify';
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
import { useAuth } from '../../provider/Authprovider';
import History from '../History/History';
import PayPal from '../Paypal/paypal';

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
    const {user} = useAuth();
    const [conversations, setConversations] = useState([]);
    const [taskDetails, setTaskDetails] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [inProgressCount, setInProgressCount] = useState(0);
    const [showHistory, setShowHistory] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [taskForPayment, setTaskForPayment] = useState(null);
    
    useEffect(() => {
        const fetchTaskDetails = async () => {
            try {
                const clientId = localStorage.getItem('id');
                const response = await Axios.get(`http://localhost:3001/task-details/${clientId}`);
                setTaskDetails(response.data);
            } catch (error) {
                console.error('Error fetching task details:', error);
            }
        };

        const fetchInProgressCount = async () => {
            try {
                const clientId = localStorage.getItem('id');
                const response = await Axios.get(`http://localhost:3001/tasks/${clientId}/in-progress-count`);
                setInProgressCount(response.data.count);
            } catch (error) {
                console.error('Error fetching in-progress task count:', error);
            }
        };

        fetchTaskDetails();
        fetchInProgressCount();

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
    }, []);

    useEffect(() => {
        const clientId = localStorage.getItem('id');
        socket.emit('join_room', `client-${clientId}`);
    
        const handleTaskCompleted = (data) => {
            setNotificationCount(prev => prev + 1);
            toast.success(data.message);
            const fetchTaskDetails = async () => {
                try {
                    const response = await Axios.get(`http://localhost:3001/task-details/${clientId}`);
                    setTaskDetails(response.data);
                } catch (error) {
                    console.error('Error refetching task details:', error);
                }
            };
            fetchTaskDetails();
        };
    
        const handleTaskAccepted = (data) => {
            toast.info(data.message);
        };

        const handleUpdateTaskCounter = ({ action }) => {
            if (action === 'increment') {
                setInProgressCount(prev => prev + 1);
            } else if (action === 'decrement') {
                setInProgressCount(prev => prev - 1);
            }
        };
    
        const handleTaskDeclined = (data) => {
            toast.error(data.message);
        };
    
        socket.on('task_finished_notification', handleTaskCompleted);
        socket.on('task_accepted_notification', handleTaskAccepted);
        socket.on('task_declined_notification', handleTaskDeclined);
        socket.on('update_task_counter', handleUpdateTaskCounter);
        socket.on('task_updated', (updatedTask) => {
            setTaskDetails(prevDetails => prevDetails.map(details =>
                details.task.id === updatedTask.id ? { ...details, task: updatedTask } : details
            ));
        });
    
        return () => {
            socket.off('task_finished_notification', handleTaskCompleted);
            socket.off('task_accepted_notification', handleTaskAccepted);
            socket.off('task_declined_notification', handleTaskDeclined);
            socket.off('update_task_counter', handleUpdateTaskCounter);
            socket.emit('leave_room', `client-${clientId}`);
        };
    }, []);

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


    const handlePayButtonClick = (details) => {
        setTaskForPayment(details);
    };

    const handlePaymentSuccess = async () => {
        if (!taskForPayment) return;
        try {
            const clientId = localStorage.getItem('id');
            await Axios.post(`http://localhost:3001/tasks/${taskForPayment.task.id}/pay`, { clientId });
            
            // Optimistically update UI
            setTaskDetails(prevDetails =>
                prevDetails.map(d =>
                    d.task.id === taskForPayment.task.id
                    ? { ...d, task: { ...d.task, status: 'paid' } }
                    : d
                )
            );
            
            setTaskForPayment(null); // Close modal
            toast.success('Payment successful!');
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Payment failed.');
        }
    };

    const handlePaymentCancel = () => {
        setTaskForPayment(null);
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
        <div className="min-h-screen bg-white-50 pb-24">
            {/* Header */}
            <header className="bg-transparent py-4 px-6 flex items-center justify-between">
                <div className="request-form-logo ml-10 mt-9">
                    <img src={logo} alt='logo' className="max-w-[25rem]" />
                </div>
                <nav className="flex items-center space-x-4">
                    <ul className="flex items-center space-x-4">
                        <li>
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setNotificationCount(0);
                                    }}
                                    className="relative px-4 py-2 bg-gray-200 rounded-md"
                                >
                                    Task Status
                                    {inProgressCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                            {inProgressCount}
                                        </span>
                                    )}
                                </button>
                                {isDropdownOpen && taskDetails && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl p-4 z-50">
                                        {taskDetails.map((details, index) => (
                                            <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                                                {details.freelancer ? (
                                                    <div className="flex items-center mb-2">
                                                        <img src={`http://localhost:3001/images/${details.freelancer.images}`} alt="Freelancer" className="w-12 h-12 rounded-full mr-4"/>
                                                        <div>
                                                            <p className="font-bold">{details.freelancer.name} {details.freelancer.surname}</p>
                                                            <p className="text-sm text-gray-600">{details.freelancer.occupation}</p>
                                                        </div>
                                                    </div>
                                                ) : <p className="font-semibold">Unassigned</p>}
                                                <p><span className="font-semibold">Task:</span> {details.task.description}</p>
                                                <p><span className="font-semibold">Status:</span> {
                                                    details.task.status === 'finished' ?
                                                    <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>Completed</span> :
                                                    details.task.status === 'paid' ?
                                                    <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>Paid</span> :
                                                    'In Progress'
                                                }</p>
                                                {details.task.status === 'finished' && (
                                                    <button
                                                        onClick={() => handlePayButtonClick(details)}
                                                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </li>
                        <li>
                            <History userType="client" userId={user.id} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
                        </li>
                        <li>
                            <Logout />
                        </li>
                    </ul>
                </nav>
            </header>
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-0 w-full max-w-2xl px-4">
                <input 
                    type="text" 
                    id="search" 
                    placeholder="Search for service (example: electrician, barber, plumber, etc)" 
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setSearchQuery(event.target.value);
                    }} 
                    value={searchQuery}
                    className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
            </div>

            {/* Sorting */}
            <div className='absolute top-15 right-5 z-15 bg-white rounded-xl shadow-lg border border-gray-100 p-4'>
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort By:</span>
                    <select 
                        value={sortBy} 
                        onChange={handleSortChange} 
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
                    >
                        <option value='starRating'>Star Rating (High to Low)</option>
                        <option value='name'>Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex h-[calc(100vh-180px)] mt-16 w-full relative z-10 min-h-0 overflow-hidden">
                {/* Map Container */}
                <div className={`flex-1 h-screen min-h-[500px] relative z-10 ${isMapLoading ? 'bg-gray-100 flex items-center justify-center' : ''}`}>
                    {isMapLoading && <div className="text-lg text-gray-600">Loading map...</div>}
                    <div className='absolute inset-0 border-r border-gray-200'>
                        <MapComponent 
                            data={workersData} 
                            searchQuery={searchQuery} 
                            clientsData={clientsData} 
                            setIsMapLoading={setIsMapLoading} 
                            activeChats={activeChats}
                            setActiveChats={setActiveChats}
                            handleFreelancerDecision={handleFreelancerDecision} 
                        />
                    </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 min-w-[500px] h-full overflow-y-auto p-5 bg-gray-50 relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-5">
                        {currentItems.length > 0 ? (
                            currentItems.map((value) => (
                                <div key={value.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                                    <div className="p-5 text-center">
                                        <img 
                                            src={'http://localhost:3001/images/' + value.images} 
                                            alt='avatar' 
                                            className="w-32 h-32 mx-auto mb-3 rounded-full transition-transform duration-200"
                                        />
                                        <div className="text-gray-800 font-semibold text-xl truncate">
                                            {value.name} {value.surname}
                                        </div>
                                        <div className="text-gray-900 font-bold text-xl">{value.occupation}</div>
                                        <div className="text-gray-700 mt-2">
                                            Status: {value.status}
                                            <span className={`inline-block w-3 h-3 rounded-full ml-2 ${value.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        </div>
                                        <div className="text-gray-700">
                                            Availability: {value.isavailable ? 'Available' : 'Not Available'}
                                        </div>
                
                                        {/* Response Status */}
                                        {responseStatus[value.id] === 'declined' && (
                                            <div className="text-red-500 flex items-center justify-center mt-2">
                                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> Declined
                                            </div>
                                        )}
                                        {responseStatus[value.id] === 'accepted' && (
                                            <div className="text-green-500 flex items-center justify-center mt-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Accepted
                                            </div>
                                        )}
                                        {responseStatus[value.id] === 'pending' && (
                                            <div className="text-gray-500 mt-2">Waiting for response...</div>
                                        )}
                
                                        <div className="detail-box -mt-1">
                                            <StarRating />
                                        </div>
                                        <div className="buttons inline-block mt-3">
                                            <button 
                                                className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold shadow-lg hover:bg-teal-400 transition-colors duration-200 text-xl"
                                                onClick={() => handleSendLocation(value.id)}
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16">
                                <div className="text-6xl mb-4">🔍</div>
                                <div className="text-2xl font-semibold text-gray-600 mb-2">No workers found</div>
                                <div className="text-gray-500">Try adjusting your search criteria</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
  
            {/* Pagination */}
            {totalPages > 1 && (
                <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center p-4 bg-white shadow-lg rounded-t-lg z-50'>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`px-4 py-2 mx-1 rounded ${
                                currentPage === page 
                                ? 'bg-gray-800 text-white' 
                                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            )}

            {/* Chat Widgets */}
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

            {taskForPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-md">
                        <PayPal
                            amount={taskForPayment.task.price_per_hour}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentCancel={handlePaymentCancel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plumber;