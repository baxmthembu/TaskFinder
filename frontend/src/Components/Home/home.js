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

    // Auto-close mobile menu on screen resize to larger screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobileMenuOpen]);
    
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
        // Main container: Responsive padding and background - prevents horizontal overflow on all devices
        <div className="min-h-screen bg-teal-50 pb-20 sm:pb-24 lg:pb-28 xl:pb-32 overflow-x-hidden">
            {/* Header: Enhanced responsive design with better spacing and sizing */}
            <header className="bg-transparent py-4 sm:py-5 lg:py-6 px-4 sm:px-6 lg:px-8 flex items-center relative">
                {/* Logo Container: Hidden on mobile when menu open, shown otherwise */}
                <div className={`logo sm:ml-6 lg:ml-10 mt-2 sm:mt-4 lg:mt-6 flex-shrink-0 ${isMobileMenuOpen ? 'hidden' : 'block'}`}>
                    <img 
                        src={logo} 
                        alt="TaskRoo Logo" 
                        className="w-40 sm:w-52 md:w-64 drop-shadow-md"
                    />
                </div>
                
                {/* Spacer: Pushes navigation to the right */}
                <div className="flex-grow"></div>
                
                {/* Desktop Navigation: Hidden on mobile (lg:), visible on large+ screens */}
                <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 lg:mr-8 xl:mr-16 2xl:mr-20 bg-white rounded-full shadow-lg px-4 xl:px-6 2xl:px-8 py-2.5">
                    <ul className="flex items-center space-x-6 xl:space-x-8 2xl:space-x-10">
                        <li>
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setNotificationCount(0);
                                    }}
                                    className="relative px-3 xl:px-4 2xl:px-5 py-2 bg-transparent text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
                                    data-tooltip-id="task-status-tooltip"
                                    data-tooltip-content="Task Status"
                                >
                                    <ClipboardDocumentCheckIcon className="h-5 w-5 xl:h-6 xl:w-6 2xl:h-7 2xl:w-7" />
                                    <span className="sr-only">Task Status</span>
                                    {/* Notification badge: Responsive sizing for better visibility */}
                                    {inProgressCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 sm:px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full min-w-[1.25rem] h-5">
                                            {inProgressCount}
                                        </span>
                                    )}
                                </button>
                                
                                {/* Desktop Task Status Dropdown: Responsive width and sizing */}
                                {isDropdownOpen && taskDetails && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50">
                                        <div className="max-h-[400px] overflow-y-auto p-4">
                                            {taskDetails.map((details, index) => (
                                                <div key={index} className="mb-4 pb-4 border-b last:border-b-0">
                                                    {details.freelancer ? (
                                                        <div className="flex items-center mb-2">
                                                            <img src={details.freelancer.images} alt="Freelancer" className="w-12 h-12 rounded-full mr-4 flex-shrink-0"/>
                                                            <div>
                                                                <p className="font-bold text-sm sm:text-base">{details.freelancer.name} {details.freelancer.surname}</p>
                                                                <p className="text-xs sm:text-sm text-gray-600">{details.freelancer.occupation}</p>
                                                            </div>
                                                        </div>
                                                    ) : <p className="font-semibold text-sm sm:text-base">Unassigned</p>}
                                                    <p className="text-xs sm:text-sm"><span className="font-semibold">Task:</span> {details.task.description}</p>
                                                    <p className="text-xs sm:text-sm"><span className="font-semibold">Status:</span> {
                                                        details.task.status === 'finished' ?
                                                        <span className="flex items-center mt-1"><span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>Completed</span> :
                                                        details.task.status === 'paid' ?
                                                        <span className="flex items-center mt-1"><span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>Paid</span> :
                                                        'In Progress'
                                                    }</p>
                                                    {details.task.status === 'finished' && (
                                                        <button
                                                            onClick={() => handlePayButtonClick(details)}
                                                            className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
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
                
                {/* Mobile Menu Button: Visible only on mobile (lg:hidden) with responsive sizing */}
                <div className="lg:hidden mr-2 sm:mr-4">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                        className="text-teal-700 p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Bars3Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </button>
                </div>
                
                {/* Mobile Menu Overlay: Centered responsive design without overflow */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-teal-50 via-yellow-50 to-orange-50 z-50 overflow-hidden">
                        <div className="w-full h-full flex flex-col max-w-md mx-auto">
                            {/* Mobile menu header - perfectly centered */}
                            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
                                <div className="flex-1"></div>
                                <h2 className="text-xl font-bold text-teal-800">Menu</h2>
                                <div className="flex-1 flex justify-end">
                                    <button 
                                        onClick={() => setIsMobileMenuOpen(false)} 
                                        className="text-teal-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* User info section - centered */}
                            <div className="flex-shrink-0 p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                                <div className="flex items-center justify-center space-x-3">
                                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                        <span className="text-teal-700 font-semibold text-lg">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-gray-800">{user.name} {user.surname}</p>
                                        <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Mobile menu items - scrollable and centered */}
                            <div className="flex-1 overflow-y-auto px-4 py-6">
                                <div className="space-y-4">
                                    {/* Task Status Section */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                                        <div className="p-4 border-b border-gray-100">
                                            <button
                                                onClick={() => {
                                                    if (isDropdownOpen) {
                                                        setIsDropdownOpen(false);
                                                    }
                                                }}
                                                className="w-full font-semibold text-gray-800 flex items-center justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                            >
                                                <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2 text-teal-600" />
                                                Task Status
                                                {inProgressCount > 0 && (
                                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full min-w-[1.25rem] h-5">
                                                        {inProgressCount}
                                                    </span>
                                                )}
                                                {isDropdownOpen && (
                                                    <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            {isDropdownOpen && taskDetails ? (
                                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                                    {taskDetails.map((details, index) => (
                                                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                            {details.freelancer ? (
                                                                <div className="flex items-center mb-2">
                                                                    <img 
                                                                        src={details.freelancer.images}
                                                                        alt="Freelancer" 
                                                                        className="w-8 h-8 rounded-full mr-3 object-cover flex-shrink-0"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-medium text-sm truncate">{details.freelancer.name} {details.freelancer.surname}</p>
                                                                        <p className="text-xs text-gray-600 truncate">{details.freelancer.occupation}</p>
                                                                    </div>
                                                                </div>
                                                            ) : <p className="font-medium text-sm text-gray-700">Unassigned</p>}
                                                            <p className="text-xs text-gray-600 mt-1 break-words"><span className="font-medium">Task:</span> {details.task.description}</p>
                                                            <p className="text-xs mt-1">
                                                                <span className="font-medium">Status:</span> 
                                                                <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                                                    details.task.status === 'finished' ? 'bg-green-100 text-green-800' :
                                                                    details.task.status === 'paid' ? 'bg-blue-100 text-blue-800' : 
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                    {details.task.status === 'finished' ? 'Completed' :
                                                                     details.task.status === 'paid' ? 'Paid' : 'In Progress'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <button
                                                        onClick={() => {
                                                            setIsDropdownOpen(!isDropdownOpen);
                                                            setNotificationCount(0);
                                                        }}
                                                        className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
                                                    >
                                                        {isDropdownOpen ? 'Hide Tasks' : 'View Tasks'}
                                                    </button>
                                                    {isDropdownOpen && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Tap anywhere outside to close
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* History Section */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                                        <div className="p-4">
                                            <History 
                                                userType="client" 
                                                userId={user.id} 
                                                isOpen={isHistoryOpen} 
                                                setIsOpen={setIsHistoryOpen}
                                                isMobile={true}
                                            />
                                        </div>
                                    </div>

                                    {/* Logout Section */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-red-200">
                                        <div className="p-4">
                                            <Logout isMobile={true} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>
            
            {/* Search Bar Container: Responsive positioning and sizing across all devices */}
            <div className="relative w-full px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 lg:mt-10">
                <div className="max-w-2xl sm:max-w-3xl lg:max-w-4xl mx-auto">
                    <input 
                        type="text" 
                        id="search" 
                        placeholder="Search for service (example: electrician, barber, plumber, etc)" 
                        onChange={(event) => {
                            setSearchTerm(event.target.value);
                            setSearchQuery(event.target.value);
                        }} 
                        value={searchQuery}
                        className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg border border-teal-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                    />
                </div>
            </div>

            {/* Main Content: Responsive layout with improved spacing */}
            <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] mt-16 w-full relative z-10 min-h-0 overflow-hidden">
                {/* Map Container: Always visible, responsive sizing */}
                <div className={`flex-1 h-96 lg:h-screen min-h-[400px] lg:min-h-[500px] relative z-10 ${isMapLoading ? 'bg-gray-100 items-center justify-center flex' : ''}`}>
                    {isMapLoading && <div className="text-base sm:text-lg text-gray-600">Loading map...</div>}
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

                {/* Cards Container: Hidden on smaller screens as requested (md:), responsive spacing */}
                <div className="w-full lg:w-3/5 h-full overflow-y-auto p-3 sm:p-4 lg:p-5 bg-gray-100 relative z-20 hidden md:block">
                    {/* Sort Controls: Responsive design */}
                    <div className="flex justify-end mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                            <label className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:block">Sort by:</label>
                            <select
                                value={sortBy}
                                onChange={handleSortChange}
                                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white cursor-pointer"
                            >
                                <option value='starRating'>Star Rating (High to Low)</option>
                                <option value='name'>Name (A-Z)</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Freelancer Cards Grid: Responsive design with hiding on small screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 py-3 sm:py-5">
                        {currentItems.length > 0 ? (
                            currentItems.map((value) => (
                                <div 
                                    key={value.id} 
                                    className="bg-yellow-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden md:flex"
                                >
                                    {/* Freelancer Image: Responsive sizing with stable proportions */}
                                    <div className="md:flex-shrink-0 p-3 sm:p-5 flex items-center justify-center">
                                        <img
                                            src={value.images}
                                            alt='avatar'
                                            className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover"
                                        />
                                    </div>
                                    
                                    {/* Card Content: Responsive padding and typography */}
                                    <div className="p-3 sm:p-5 flex-grow">
                                        {/* Header with name, occupation and rating: Responsive text sizing */}
                                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                                            <div>
                                                <div className="text-lg sm:text-xl font-bold text-gray-800">{value.name} {value.surname}</div>
                                                <p className="text-sm sm:text-md font-semibold text-orange-600">{value.occupation}</p>
                                            </div>
                                            <div className="flex-shrink-0 ml-2 sm:ml-4">
                                                <StarRating rating={value.rating} />
                                            </div>
                                        </div>

                                        {/* Status and availability info: Responsive text sizing */}
                                        <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 space-y-1">
                                            <div className="flex items-center">
                                                <p>Status: {value.status}</p>
                                                <span className={`ml-2 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ${value.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            </div>
                                            <p>Availability: {value.isavailable ? 'Available' : 'Not Available'}</p>
                                        </div>
                                        
                                        {/* Response status: Responsive text sizing */}
                                        <div className="mt-1.5 sm:mt-2 text-xs sm:text-sm">
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

                                        {/* Action buttons: Responsive sizing and layout */}
                                        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-4">
                                            <button
                                                className="w-full sm:w-auto px-4 sm:px-5 py-1.5 sm:py-2 bg-orange-500 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors"
                                                onClick={() => handleSendLocation(value.id)}
                                            >
                                                Connect
                                            </button>
                                            <button
                                                className="w-full sm:w-auto text-teal-600 hover:underline font-medium text-sm sm:text-base"
                                                onClick={() => handleOpenCommentsModal(value.id)}
                                            >
                                                Comments
                                            </button>
                                        </div>
                                    </div>
                                </div>
                           ))
                        ) : (
                            <div className="col-span-full text-center py-12 sm:py-16">
                                <div className="text-4xl sm:text-6xl mb-4">🔍</div>
                                <div className="text-lg sm:text-2xl font-semibold text-teal-800 mb-2">No workers found</div>
                                <div className="text-sm sm:text-base text-gray-500">Try adjusting your search criteria</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
   
            {/* Pagination: Responsive design with proper mobile handling */}
            {totalPages > 1 && (
                <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center p-2 sm:p-4 bg-white shadow-lg rounded-t-lg z-50 max-w-full overflow-x-auto">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageClick(page)}
                                className={`px-2 sm:px-4 py-1.5 sm:py-2 mx-0.5 sm:mx-1 rounded text-xs sm:text-sm min-w-[2rem] sm:min-w-[2.5rem] ${
                                    currentPage === page
                                    ? 'bg-teal-500 text-white shadow-md'
                                    : 'bg-yellow-200 text-teal-800 hover:bg-yellow-300 transition-colors'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
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