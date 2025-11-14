import { toast } from 'react-toastify';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ClipboardDocumentCheckIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import StarRating from '../StarRating/StarRating';
import './home.css';
import socket from '../../socket';
import CommentsModal from '../CommentsModal/CommentsModal';
//import TopButton from '../BackToTop/top';
import logo from '../Images/taskaroo.svg';
import MapComponent from '../MapComponent/testmap';
import Axios from 'axios';
import Logout from '../../Worker/Logout/logout';
import ChatWidget from '../../ChatWidget';
import { useAuth } from '../../provider/authProvider';
import History from '../History/History';
import PayPal from '../Paypal/paypal';
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'


const Plumber = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState('starRating');
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
    const [, setConversations] = useState([]);
    const [taskDetails, setTaskDetails] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [, setNotificationCount] = useState(0);
    const [inProgressCount, setInProgressCount] = useState(0);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [taskForPayment, setTaskForPayment] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [selectedFreelancerId, setSelectedFreelancerId] = useState(null);
    
    useEffect(() => {
        // new
        const handleNewRating = ({ freelancerId, newAverageRating }) => {
            setWorkersData(prevWorkers =>
                prevWorkers.map(worker =>
                    worker.id === freelancerId
                        ? { ...worker, rating: newAverageRating }
                        : worker
                )
            );
        };

        socket.on('new_rating', handleNewRating);

        return () => {
            socket.off('new_rating', handleNewRating);
        };
    }, []);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            const clientId = localStorage.getItem('id');
            if (clientId) {
                try {
                    //const response = await Axios.get(`http://localhost:3001/task-details/${clientId}`);
                    const response = await Axios.get(`${process.env.REACT_APP_API_URL}/task-details/${clientId}`);
                    setTaskDetails(response.data);
                } catch (error) {
                    console.error('Error fetching task details:', error);
                }
            }
        };

        const fetchInProgressCount = async () => {
            const clientId = localStorage.getItem('id');
            if (clientId) {
                try {
                    //const response = await Axios.get(`http://localhost:3001/tasks/${clientId}/in-progress-count`);
                    const response = await Axios.get(`${process.env.REACT_APP_API_URL}/tasks/${clientId}/in-progress-count`);
                    setInProgressCount(response.data.count);
                } catch (error) {
                    console.error('Error fetching in-progress task count:', error);
                }
            }
        };

        fetchTaskDetails();
        fetchInProgressCount();

        const fetchData = async () => {
            try {
                /*const response = await fetch('http://localhost:3001/workers', {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });*/
                const response = await fetch(`${process.env.REACT_APP_API_URL}/workers`, {
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
                /*const response = await fetch('http://localhost:3001/clients', {
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json', 
                    },
                });*/
                const response = await fetch(`${process.env.REACT_APP_API_URL}/clients`, {
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

        const handleAvailabilityChange = ({ freelancerId, isAvailable }) => {
            setWorkersData(prevWorkers =>
                prevWorkers.map(worker =>
                    worker.id === freelancerId
                        ? { ...worker, isavailable: isAvailable, status: isAvailable ? 'online' : 'offline' }
                        : worker
                )
            );
        };

        socket.on('freelancer-status-changed', handleAvailabilityChange);

        return () => {
            socket.off('freelancer-status-changed', handleAvailabilityChange);
        };
    }, []);

    useEffect(() => {
        const clientId = localStorage.getItem('id');
        if (clientId) {
            socket.emit('join_room', `client-${clientId}`);
        }
    
        const handleTaskCompleted = (data) => {
            setNotificationCount(prev => prev + 1);
            toast.success(data.message);
            const fetchTaskDetails = async () => {
                const clientId = localStorage.getItem('id');
                if (clientId) {
                    try {
                        //const response = await Axios.get(`http://localhost:3001/task-details/${clientId}`);
                        const response = await Axios.get(`${process.env.REACT_APP_API_URL}/task-details/${clientId}`);
                        setTaskDetails(response.data);
                    } catch (error) {
                        console.error('Error refetching task details:', error);
                    }
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
                details.task.task_id === updatedTask.task_id ? { ...details, task: updatedTask } : details
            ));
        });
    
        return () => {
            socket.off('task_finished_notification', handleTaskCompleted);
            socket.off('task_accepted_notification', handleTaskAccepted);
            socket.off('task_declined_notification', handleTaskDeclined);
            socket.off('update_task_counter', handleUpdateTaskCounter);
            if (clientId) {
                socket.emit('leave_room', `client-${clientId}`);
            }
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
    
    const handleFreelancerDecision = useCallback(async ({ clientId, workerId, decision, room }) => {
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
    }, [workersData, user.id, user.name, user.surname]);

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
                    //const response = await fetch(`http://localhost:3001/chats/${userId}`);
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${userId}`);
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
    }, [user.id, user.name, user.surname, user.role, activeChats]); // Add user.role to dependencies


    const handlePayButtonClick = (details) => {
        setTaskForPayment(details);
    };

    const handlePaymentSuccess = async () => {
        if (!taskForPayment) return;
        try {
            const clientId = localStorage.getItem('id');
            //await Axios.post(`http://localhost:3001/tasks/${taskForPayment.task.id}/pay`, { clientId });
            await Axios.post(`${process.env.REACT_APP_API_URL}/tasks/${taskForPayment.task.id}/pay`, { clientId });

            // Optimistically update UI by removing the task from the active list.
            setTaskDetails(prevDetails =>
                prevDetails.filter(d => d.task.task_id !== taskForPayment.task.task_id)
            );

            setTaskForPayment(null); // Close modal
            toast.success('Payment successful! Task moved to history.');
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
                //const response = await fetch(`http://localhost:3001/chats/${user.id}`);
                const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${user.id}`);
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
    }, [user.id, user.name, user.surname, user.role, activeChats]);

    useEffect(() => {
        const handleFreelancerDecisionEvent = (data) => {
            handleFreelancerDecision(data);
        };

        socket.on("freelancer_decision", handleFreelancerDecisionEvent);
        return () => socket.off("freelancer_decision", handleFreelancerDecisionEvent);
    }, [handleFreelancerDecision, workersData, user.id, user.name, user.surname]);

    const handleSendLocation = async (workerId) => {
        const clientId = localStorage.getItem('id');
        const client = clientsData.find(c => String(c.id) === clientId);
    
        try {
            //const response = await Axios.get(`http://localhost:3001/tasks/${clientId}`);
            const response = await Axios.get(`${process.env.REACT_APP_API_URL}/tasks/${clientId}`);
            const tasks = response.data; // Assuming the endpoint returns an array of tasks
            
            // Find the most recent task that is still pending
            const latestTask = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                  .find(t => t.status === 'pending');
    
            if (client && latestTask) {
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
                    serviceRequest: latestTask // Send the specific task
                };
    
                socket.emit('sendLocation', locationPayload);
                setResponseStatus(prev => ({ ...prev, [workerId]: 'pending' }));
                
            } else {
                // Handle case where no pending task is found
                console.error('No pending tasks found for this client.');
                toast.info('You have no pending tasks to connect with.');
            }
        } catch(error) {
            console.error('Error fetching task: ', error);
        }
    };


    const handlePageClick = (pageNum) => {
        setCurrentPage(pageNum);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    /*const handleCloseChat = (room) => {
        socket.emit('leave_room', { room });
        setActiveChats(prev => prev.filter(chat => chat.room !== room));
    };*/

    const handleOpenCommentsModal = (freelancerId) => {
        setSelectedFreelancerId(freelancerId);
        setIsCommentsModalOpen(true);
    };

    const handleCloseCommentsModal = () => {
        setIsCommentsModalOpen(false);
        setSelectedFreelancerId(null);
    };


    return (
        <div className="min-h-screen bg-teal-50 pb-24 overflow-x-hidden">
            {/* Header */}
            <header className="bg-transparent py-4 px-6 flex items-center">
                {/*<div className="request-form-logo ml-10 mt-9">
                    <img src={logo} alt='logo' className="max-w-[25rem]" />
                </div>*/}
                <div className="logo ml-10 mt-6">
                          <img src={logo} alt="Logo" className="max-w-[20rem] drop-shadow-md" />
                        </div>
                <div className="flex-grow"></div>
                <nav className="hidden md:flex items-center space-x-4 mr-20 bg-white rounded-full shadow-lg px-6 py-2">
                    <ul className="flex items-center space-x-8">
                        <li>
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setNotificationCount(0);
                                    }}
                                    className="relative px-4 py-2 bg-transparent text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
                                    data-tooltip-id="task-status-tooltip"
                                    data-tooltip-content="Task Status"
                                >
                                    <ClipboardDocumentCheckIcon className="h-6 w-6" />
                                    <span className="sr-only">Task Status</span>
                                    {inProgressCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                            {inProgressCount}
                                        </span>
                                    )}
                                </button>
                                {isDropdownOpen && taskDetails && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
                                        <div className="max-h-[400px] overflow-y-auto p-4">
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
                                    </div>
                                )}
                            </div>
                        </li>
                        <li>
                            <History userType="client" userId={user.id} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
                        </li>
                        <li className='flex items-center'>
                            <Logout />
                        </li>
                    </ul>
                </nav>
                <div className="md:hidden mr-4">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-teal-700">
                        <Bars3Icon className="h-8 w-8" />
                    </button>
                </div>
                {isMobileMenuOpen && (
                    <div className="absolute top-0 left-0 w-full h-full bg-yellow-50 z-50">
                        <div className="flex justify-end p-4">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-teal-700">
                                <XMarkIcon className="h-8 w-8" />
                            </button>
                        </div>
                        <ul className="flex flex-col items-center space-y-8 mt-16">
                            <li>
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(!isDropdownOpen);
                                            setNotificationCount(0);
                                        }}
                                        className="relative px-4 py-2 bg-transparent text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
                                        data-tooltip-id="task-status-tooltip"
                                        data-tooltip-content="Task Status"
                                    >
                                        <ClipboardDocumentCheckIcon className="h-6 w-6" />
                                        <span className="sr-only">Task Status</span>
                                        {inProgressCount > 0 && (
                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                                {inProgressCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </li>
                            <li>
                                <History userType="client" userId={user.id} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
                            </li>
                            <li className='flex items-center'>
                                <Logout />
                            </li>
                        </ul>
                    </div>
                )}
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
                    className="w-full px-5 py-3 border border-teal-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg"
                />
            </div>


            {/* Main Content */}
            <div className="flex h-[calc(100vh-180px)] mt-16 w-full relative z-10 min-h-0 overflow-hidden">
                {/* Map Container */}
                <div className={`lg:flex flex-1 h-screen min-h-[500px] relative z-10 ${isMapLoading ? 'bg-gray-100 items-center justify-center' : ''}`}>
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
                            handleSendLocation={handleSendLocation}
                            handleOpenCommentsModal={handleOpenCommentsModal}
                        />
                    </div>
                </div>

                {/* Cards Container */}
                <div className="w-full lg:w-3/5 h-full overflow-y-auto p-5 bg-gray-100 relative z-20 hidden lg:block">
                    <div className="flex justify-end mb-4">
                        <div className="flex items-center space-x-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 py-5">
                        {currentItems.length > 0 ? (
                            currentItems.map((value) => (
                                <div key={value.id} className="bg-yellow-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden md:flex">
                                    <div className="md:flex-shrink-0 p-5 flex items-center justify-center">
                                        <img
                                            src={'http://localhost:3001/images/' + value.images}
                                            alt='avatar'
                                            className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="p-5 flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-xl font-bold text-gray-800">{value.name} {value.surname}</div>
                                                <p className="text-md font-semibold text-orange-600">{value.occupation}</p>
                                            </div>
                                            <div className="flex-shrink-0 ml-4">
                                                <StarRating rating={value.rating} />
                                            </div>
                                        </div>

                                        <div className="mt-3 text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center">
                                                <p>Status: {value.status}</p>
                                                <span className={`ml-2 h-3 w-3 rounded-full ${value.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            </div>
                                            <p>Availability: {value.isavailable ? 'Available' : 'Not Available'}</p>
                                        </div>
                                        
                                        <div className="mt-2 text-sm">
                                            {responseStatus[value.id] === 'declined' && (
                                                <div className="font-semibold text-red-500">Declined</div>
                                            )}
                                            {responseStatus[value.id] === 'accepted' && (
                                                <div className="font-semibold text-green-500">Accepted</div>
                                            )}
                                            {responseStatus[value.id] === 'pending' && (
                                                <div className="text-gray-500">Waiting for response...</div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center space-x-4">
                                            <button
                                                className="px-5 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors"
                                                onClick={() => handleSendLocation(value.id)}
                                            >
                                                Connect
                                            </button>
                                            <button
                                                className="text-teal-600 hover:underline font-medium"
                                                onClick={() => handleOpenCommentsModal(value.id)}
                                            >
                                                Comments
                                            </button>
                                        </div>
                                    </div>
                                </div>
                           ))
                        ) : (
                            <div className="col-span-full text-center py-16">
                                <div className="text-6xl mb-4">🔍</div>
                                <div className="text-2xl font-semibold text-teal-800 mb-2">No workers found</div>
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
                                ? 'bg-teal-500 text-white'
                                : 'bg-yellow-200 text-teal-800 hover:bg-yellow-300'
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
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
                        <PayPal
                            amount={taskForPayment.task.price_per_hour}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentCancel={handlePaymentCancel}
                        />
                    </div>
                </div>
            )}
            <Tooltip id="task-status-tooltip" />
            <CommentsModal
                isOpen={isCommentsModalOpen}
                onClose={handleCloseCommentsModal}
                freelancerId={selectedFreelancerId}
            />
        </div>
    );
};

export default Plumber;