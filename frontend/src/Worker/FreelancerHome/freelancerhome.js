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
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';



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
          //const response = await Axios.get(`http://localhost:3001/freelancer/${user.id}/availability`);
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
                    //const response = await fetch(`http://localhost:3001/chats/${userId}`);
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
        <div className="min-h-screen bg-teal-50 pb-24 overflow-x-hidden">
{/* Header positioned exactly like home.js with centered title */}
<header className="bg-transparent py-4 px-6 flex items-center">
  {/* Logo with Branding */}
  <div className="logo ml-10 mt-6">
    <img src={logo} alt="Logo" className="max-w-[20rem] drop-shadow-md" />
  </div>
  
  {/* Centered Title */}
  <div className="flex-1 flex justify-center items-center">
    <h1 className="text-3xl font-bold text-teal-700 text-slate-800 text-center">
      Freelancer Dashboard
    </h1>
  </div>
  
  <nav className="hidden md:flex items-center space-x-4 mr-20 bg-white rounded-full shadow-lg px-6 py-2">
    <ul className="flex items-center space-x-8">
      {/* Status Indicator */}
      <li>
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full animate-pulse ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-base font-medium text-slate-700">
            {isAvailable ? 'Online & Available' : 'Offline'}
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
      <li className='flex items-center'>
        <Logout />
      </li>
    </ul>
  </nav>
  <div className="md:hidden mr-4">
    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
        <Bars3Icon className="h-8 w-8" />
    </button>
  </div>
  {isMobileMenuOpen && (
    <div className="absolute top-0 left-0 w-full h-full bg-yellow-50 z-50">
        <div className="flex justify-end p-4">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600">
                <XMarkIcon className="h-8 w-8" />
            </button>
        </div>
        <ul className="flex flex-col items-center space-y-8 mt-16">
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
            <li className='flex items-center'>
                <Logout />
            </li>
        </ul>
    </div>
  )}
</header>

{/* Main Content */}
<div className="relative">
  {/* Enhanced Availability Toggle */}
  <div className="absolute top-8 left-8 z-20 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
    <div className="flex items-center space-x-4">
      {/* Icon */}
      <div className={`p-3 rounded-xl ${isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      
      {/* Toggle and Text */}
      <div className="flex-1">
        <label htmlFor="availability-toggle" className="block text-sm font-semibold text-slate-700 mb-2">
          Work Availability
        </label>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
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
            <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isAvailable ? 'You will receive new job requests' : 'You will not receive new requests'}
        </p>
      </div>
    </div>
  </div>

  {/* Enhanced Map Container with Modern Design */}
  <div className="relative h-screen">
    {/* Main map container with enhanced styling */}
    <div className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden border border-slate-200/80 backdrop-blur-sm">
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
      
      {/* Subtle corner accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/20 rounded-tl-lg"></div>
      <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr-lg"></div>
      <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/20 rounded-bl-lg"></div>
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/20 rounded-br-lg"></div>
    </div>
  </div>
</div>

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


