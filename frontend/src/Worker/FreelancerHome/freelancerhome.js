import Axios from 'axios';
import React, { useState, useContext, useEffect } from 'react';
import './freelancerhome.css';
import FreelancerMap from '../FreelancerMap/freelancermap';
import io from 'socket.io-client';
import Sidebar from '../Freelancer_Sidebar/freelancer_sidebar';
import { useAuth } from '../../provider/Authprovider';
import logo from '../../Components/Images/taskaroo.svg'
import Logout from '../Logout/logout';
import ChatWidget from '../../ChatWidget';
import TaskStatus from '../../Components/TaskStatus/TaskStatus';
import History from '../../Components/History/History';

//const socket = io('https://taskfinder.onrender.com')
const socket = io('http://localhost:3001');


const FreelancerHome = () => {
    const {user} = useAuth()
    const [isAvailable, setIsAvailable] = useState(false); // Default to false initially
    const [clientLocation,setClientLocation] = useState(null)
    const [clientsData, setClientsData] = useState([])
    const [loading, setLoading] = useState(true);
    const [activeChat, setActiveChat] = useState(null);
    const [activeChats, setActiveChats] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [currentTask, setCurrentTask] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        socket.on('task_accepted', (task) => {
          setTasks((prevTasks) => [...prevTasks, { ...task, status: 'in_progress' }]);
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

        socket.on('receiveLocation', (data) => {
          if (data?.latitude && data?.longitude) {
            setClientLocation({
              lat: parseFloat(data.latitude),
              lng: parseFloat(data.longitude),
              serviceRequest: data.serviceRequest
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
                    },
                    task: {
                      ...selectedMarker.serviceRequest,
                      description: selectedMarker.serviceRequest.task,
                      status: 'pending'
                    }
                }];
            });
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await Axios.post(`http://localhost:3001/tasks/${taskId}/complete`);
            alert('Task marked as complete!');
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Failed to mark task as complete.');
        }
    };

    const handleAcceptTask = (task, clientName, room) => {
        const newTask = {
          id: task.id,
          description: task.task,
          clientName: clientName,
          timer: '00:00:00',
          room: room
        };
        socket.emit('accept_task', { room, task: newTask });
        setTasks((prevTasks) => [...prevTasks, { ...newTask, status: 'in_progress' }]);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
  {/* Enhanced Header */}
  {/*<header className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-200/60 py-8">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold text-slate-800">Freelancer Dashboard</h1>
          <p className="text-slate-600 text-base">Manage your availability and client requests</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="hidden sm:flex items-center space-x-3 bg-slate-100/80 rounded-full px-4 py-3">
          <div className={`w-4 h-4 rounded-full animate-pulse ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-base font-medium text-slate-700">
            {isAvailable ? 'Online & Available' : 'Offline'}
          </span>
        </div>
        
        <div className="freelancerhome-logout">
          <Logout />
        </div>
      </div>
    </div>
  </div>
</header>*/}
<header className="bg-white/95 backdrop-blur-lg shadow-sm border-b border-slate-200/60 py-6 relative z-30">
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex items-center justify-between">
      {/* Logo with Branding */}
      <div className="flex items-center space-x-4">
        <div className="request-form-logo">
          <img src={logo} alt='logo' className="h-24 w-auto object-contain" />
        </div>
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-slate-800">Freelancer Dashboard</h1>
          <p className="text-slate-600 text-sm">Manage your availability and client requests</p>
        </div>
      </div>
      
      {/* Status & Logout Grouped Together */}
      <div className="flex items-center bg-slate-100/80 rounded-full pl-4 pr-2 py-2 shadow-sm">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full animate-pulse ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-base font-medium text-slate-700">
            {isAvailable ? 'Online & Available' : 'Offline'}
          </span>
        </div>
        
        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-300 mx-3"></div>

        <TaskStatus
            tasks={tasks}
            userType={user.role}
            onFinishTask={handleFinishTask}
            onPay={handlePayTask}
        />
        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-300 mx-3"></div>
        <History userType="freelancer" userId={user.id} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
        
        {/* Logout */}
        <div className="freelancerhome-logout">
          <Logout />
        </div>
      </div>
    </div>
  </div>
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

    {/* Map Container */}
    <div className="h-[calc(100vh-5rem)] relative">
      <FreelancerMap 
        initialLocation={clientsData.map(client => ({
          lat: client.latitude,
          lng: client.longitude,
        }))}
        onDecision={handleDecisionFromMap}
      />
      {/*<button onClick={() => handleCompleteTask(clientLocation?.serviceRequest?.id)}>Complete Task</button>*/}
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


