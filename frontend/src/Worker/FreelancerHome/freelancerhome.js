import Axios from 'axios';
import { useState, useEffect } from 'react';
import './freelancerhome.css';
import FreelancerMap from '../FreelancerMap/freelancermap';
import socket from '../../socket';
import { useAuth } from '../../provider/authProvider';
import logo from '../../Components/Images/taskaroo.svg'
import Logout from '../Logout/logout';
import ChatWidget from '../../ChatWidget';
import TaskStatus from '../../Components/TaskStatus/TaskStatus';
import History from '../../Components/History/History';
import { Bars3Icon, XMarkIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import BankDetails from '../../Components/BankDetails/BankDetails';


const FreelancerHome = () => {
    const {user} = useAuth()
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const [clientsData] = useState([])
    const [activeChats, setActiveChats] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [newTasksCount, setNewTasksCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isTaskStatusOpen, setIsTaskStatusOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('map'); // 'map' or 'bank'
 
     useEffect(() => {
         socket.on('task_accepted', (task) => {
            setTasks((prevTasks) => {
                if (prevTasks.some((t) => t.id === task.id)) {
                    return prevTasks;
                }
                setNewTasksCount((prev) => prev + 1);
                return [...prevTasks, { ...task, status: 'in_progress' }];
            });
         });
    
        socket.on('task_declined', (task) => {
          alert('Task declined');
        });
    
        socket.on('task_finished', ({ taskId }) => {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === taskId ? { ...task, status: 'finished' } : task
            )
          );
        });
    
        return () => {
          socket.off('task_accepted');
          socket.off('task_declined');
          socket.off('task_finished');
        };
      }, []);

      useEffect(() => {
        socket.on('task_already_accepted', (data) => {
            alert(data.message);
        });

        return () => {
            socket.off('task_already_accepted');
        };
      }, []);

      useEffect(() => {
        let interval;
        if (currentTask && currentTask.timer) {
          interval = setInterval(() => {
            setTasks((prevTasks) =>
              prevTasks.map((task) =>
                task.id === currentTask.id
                  ? { ...task, timer: formatTimer(task.timer) }
                  : task
              )
            );
          }, 1000);
        }
        return () => clearInterval(interval);
      }, [currentTask]);

    useEffect(() => {
    if (user && user.role === 'freelancer') {
      // Connect and identify the freelancer
      socket.connect();
      socket.emit('freelancer_identify', user.id);

      // Fetch initial availability status
      const fetchAvailability = async () => {
        try {
          const response = await Axios.get(`${process.env.REACT_APP_API_URL}/freelancer/${user.id}/availability`);
          if (response.status === 200) {
            setIsAvailable(response.data.isAvailable);
          } else {
            console.error('Failed to fetch availability');
          }
        } catch (error) {
          console.error('Error fetching availability:', error);
        }
      };

      fetchAvailability();

      // This will run when the component unmounts (e.g., tab close, navigation, logout)
      return () => {
        console.log(`Unmounting freelancerhome, emitting freelancer-offline for ${user.id}`);
        // Notify the backend that the freelancer is going offline
        socket.emit('freelancer-offline', { freelancerId: user.id });

        // Clean up socket listeners to prevent memory leaks
        socket.off('freelancer_identify');
        socket.off('receiveLocation');
        // Disconnect the socket when the component unmounts
        socket.disconnect();
      };
    }
  }, [user]);

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
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${userId}`);
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

    // Auto-close mobile menu on screen resize to larger screens (matching home.js)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobileMenuOpen]);

    // Reset mobile menu states when menu opens
    useEffect(() => {
        if (isMobileMenuOpen) {
            setIsTaskStatusOpen(false);
            setIsHistoryOpen(false);
        }
    }, [isMobileMenuOpen]);


    const toggleAvailability = async () => {
      if(user && user.role === 'freelancer') {
        const newAvailability = !isAvailable;
        setIsAvailable(newAvailability);
        socket.emit('update_availability', {
          freelancerId: user.id,
          isAvailable: newAvailability
        });
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
                    },
                    task: selectedMarker.serviceRequest
                }];
            });
        }
    };

    /*const handleCompleteTask = async (taskId) => {
        try {
            //await Axios.post(`http://localhost:3001/tasks/${taskId}/complete`);
            await Axios.post(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/complete`);
            alert('Task marked as complete!');
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Failed to mark task as complete.');
        }
    };*/

    const handleAcceptTask = (task, clientName, room) => {
        const newTask = {
          id: task.task_id,
          description: task.description,
          clientName: clientName,
          timer: '00:00:00',
          room: room
        };
        socket.emit('accept_task', { room, task: newTask });
      };
    
      const handleDeclineTask = (taskId, room) => {
        socket.emit('decline_task', { taskId, room });
      };
    
      const handleFinishTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task && task.room) {
            socket.emit('finish_task', { taskId, room: task.room });
            setTasks((prevTasks) =>
              prevTasks.map((t) =>
                t.id === taskId ? { ...t, status: 'finished' } : t
              )
            );
            setCurrentTask(null);
        } else {
            console.error("Could not find task or task room to finish.");
        }
      };

      const handlePayTask = async (task) => {
        try {
          console.log('Payment for task successful:', task);
          alert(`Payment for task "${task.description}" was successful.`);
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === task.id ? { ...t, status: 'paid' } : t
            )
          );
        } catch (error) {
          console.error('Error processing payment:', error);
          alert('Payment failed.');
        }
      };
    
      const formatTimer = (time) => {
        const [h, m, s] = time.split(':').map(Number);
        const totalSeconds = h * 3600 + m * 60 + s + 1;
        const newH = Math.floor(totalSeconds / 3600);
        const newM = Math.floor((totalSeconds % 3600) / 60);
        const newS = totalSeconds % 60;
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;
      };

    return (
      <>
        <div className="min-h-screen bg-teal-50 overflow-x-hidden">
            {/* Header: Enhanced responsive design matching home.js */}
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
                        {/* Status Indicator */}
                        <li>
                            <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full animate-pulse ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm xl:text-base font-medium text-slate-700">
                                    {isAvailable ? 'Available' : 'Unavailable'}
                                </span>
                            </div>
                        </li>
                        <li>
                            <TaskStatus
                                tasks={tasks}
                                userType={user.role}
                                onFinishTask={handleFinishTask}
                                onPay={handlePayTask}
                                newTasksCount={newTasksCount}
                                onViewTasks={() => setNewTasksCount(0)}
                            />
                        </li>
                        <li>
                            <History userType="freelancer" userId={user.id} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab(activeTab === 'map' ? 'bank' : 'map')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${activeTab === 'bank' ? 'bg-teal-100 text-teal-700' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <BanknotesIcon className="h-5 w-5" />
                                <span className="font-medium">Bank Details</span>
                            </button>
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
                
                {/* Mobile Menu Overlay: Centered responsive design matching home.js */}
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
                                    {/* Availability Status Section */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                                        <div className="p-4 border-b border-gray-100">
                                            <button
                                                onClick={toggleAvailability}
                                                className="w-full font-semibold text-gray-800 flex items-center justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                            >
                                                <div className={`w-4 h-4 rounded-full animate-pulse mr-3 ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                {isAvailable ? 'Available' : 'Unavailable'}
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm text-gray-600 text-center">
                                                {isAvailable ? 'You will receive new job requests' : 'You will not receive new requests'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Task Status Section */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                                        <div className="p-4 border-b border-gray-100">
                                            <button
                                                onClick={() => setIsTaskStatusOpen(!isTaskStatusOpen)}
                                                className="w-full font-semibold text-gray-800 flex items-center justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                            >
                                                <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                </svg>
                                                Task Status
                                                {newTasksCount > 0 && (
                                                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full min-w-[1.25rem] h-5">
                                                        {newTasksCount}
                                                    </span>
                                                )}
                                                {isTaskStatusOpen && (
                                                    <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            {isTaskStatusOpen ? (
                                                tasks.length > 0 ? (
                                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                                        {tasks.map((task, index) => (
                                                            <div key={task.id || index} className="p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex items-center mb-2">
                                                                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                                                                        <span className="text-teal-700 font-semibold text-sm">
                                                                            {task.clientName ? task.clientName.charAt(0).toUpperCase() : 'T'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-medium text-sm truncate">{task.clientName || 'Unknown Client'}</p>
                                                                        <p className="text-xs text-gray-600 truncate">{task.description || 'No description'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xs mt-1">
                                                                    <span className="font-medium">Status:</span> 
                                                                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                                                        task.status === 'finished' ? 'bg-green-100 text-green-800' :
                                                                        task.status === 'paid' ? 'bg-blue-100 text-blue-800' : 
                                                                        'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                        {task.status === 'finished' ? 'Completed' :
                                                                         task.status === 'paid' ? 'Paid' : 'In Progress'}
                                                                    </span>
                                                                </div>
                                                                {task.status !== 'finished' && task.status !== 'paid' && (
                                                                    <div className="mt-2 flex space-x-2">
                                                                        <button
                                                                            onClick={() => handleFinishTask(task.id)}
                                                                            className="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
                                                                        >
                                                                            Complete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <div className="text-gray-500 mb-2">No active tasks</div>
                                                        <p className="text-xs text-gray-400">New job requests will appear here</p>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="text-center py-4">
                                                    <button
                                                        onClick={() => setIsTaskStatusOpen(true)}
                                                        className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
                                                    >
                                                        {tasks.length > 0 ? 'View Tasks' : 'Check for Tasks'}
                                                    </button>
                                                    {isTaskStatusOpen && (
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
                                        <div className="p-4 border-b border-gray-100">
                                            <button
                                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                                className="w-full font-semibold text-gray-800 flex items-center justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                            >
                                                <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                History
                                                {isHistoryOpen && (
                                                    <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            {isHistoryOpen ? (
                                                <History
                                                    userType="freelancer"
                                                    userId={user.id}
                                                    isOpen={isHistoryOpen}
                                                    setIsOpen={setIsHistoryOpen}
                                                    isMobile={true}
                                                />
                                            ) : (
                                                <div className="text-center py-4">
                                                    <button
                                                        onClick={() => setIsHistoryOpen(true)}
                                                        className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-sm font-medium"
                                                    >
                                                        View History
                                                    </button>
                                                    {isHistoryOpen && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Tap anywhere outside to close
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bank Details Mobile Button */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
                                        <div className="p-4">
                                            <button
                                                onClick={() => {
                                                    setActiveTab('bank');
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className="w-full font-semibold text-gray-800 flex items-center justify-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                            >
                                                <BanknotesIcon className="w-5 h-5 mr-2 text-teal-600" />
                                                Bank Details
                                            </button>
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

{/* Main Content - Responsive Layout */}
{activeTab === 'map' ? (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Responsive Map Container with Maximum Width on Mobile */}
      <div className="w-full h-full relative">
        {/* Main map container - Full width on mobile, original spacing on desktop */}
        <div className="absolute inset-x-0 sm:inset-x-1 lg:inset-x-4 inset-y-2 sm:inset-y-4 lg:inset-y-6
                        rounded-none sm:rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden
                        border border-slate-200/80 backdrop-blur-sm bg-white">
          {/* Subtle background gradient for visual depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-blue-50/30 pointer-events-none"></div>
          
          {/* Map with loading state */}
          <FreelancerMap
            initialLocation={clientsData.map(client => ({
              lat: client.latitude,
              lng: client.longitude,
            }))}
            onDecision={handleDecisionFromMap}
          />
          
          {/* Subtle corner accents - responsive sizing */}
          <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-white/20 rounded-tl-lg"></div>
          <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-white/20 rounded-tr-lg"></div>
          <div className="absolute bottom-0.5 left-0.5 sm:bottom-1 sm:left-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-white/20 rounded-bl-lg"></div>
          <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-white/20 rounded-br-lg"></div>
        </div>
      </div>

      {/* Centered Availability Toggle - Responsive Design */}
      <div className="absolute top-4 sm:top-6 lg:top-8 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-sm sm:max-w-md lg:max-w-lg px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300 p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Icon */}
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            
            {/* Toggle and Text */}
            <div className="flex-1 w-full">
              <label htmlFor="availability-toggle" className="block text-sm font-semibold text-slate-700 mb-2 text-center sm:text-left">
                Work Availability
              </label>
              <div className="flex items-center justify-between">
                <span className={`text-base sm:text-lg font-bold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
                
                {/* Enhanced Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="availability-toggle"
                    type="checkbox"
                    checked={isAvailable}
                    onChange={toggleAvailability}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 sm:w-16 sm:h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-6 sm:after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-center sm:text-left">
                {isAvailable ? 'You will receive new job requests' : 'You will not receive new requests'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Bottom Padding for Chat Widgets */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 lg:h-28 bg-gradient-to-t from-teal-50/80 to-transparent pointer-events-none"></div>
    </div>
) : (
    <div className="w-full min-h-screen pt-4 pb-20 px-4 sm:px-6 lg:px-8">
        <BankDetails onBack={() => setActiveTab('map')} />
    </div>
)}

  {/* Chat Widgets */}
  {activeChats.map(chat => (
    <ChatWidget
        key={chat.room}
        room={chat.room}
        currentUser={chat.currentUser}
        otherUser={chat.otherUser}
        task={chat.task}
        onAcceptTask={handleAcceptTask}
        onDeclineTask={handleDeclineTask}
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


