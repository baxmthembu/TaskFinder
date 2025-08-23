import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import ScrollToBottom from 'react-scroll-to-bottom';
import '../src/chat.css';
import logo from "./Components/Images/taskaroo.svg"
import Sidebar from "./Worker/Freelancer_Sidebar/freelancer_sidebar";
import Axios from "axios";
/*import socket from "./socket";*/

const socket = io.connect('https://taskfinder.onrender.com');
//const socket = io.connect('http://localhost:3001');

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate()
    const { room,workerName, clientName, workerId, clientId } = location.state || { room: '', workerName: '', clientName: '', workerId: '', clientId: '' };
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentUserName, setCurrentUserName] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [workersName, setWorkersName] = useState({ name: '' });
    const [clientsName, setClientsName] = useState({ name: '' });

     
    useEffect(() => {
        const fetchNames = async () => {
            try {
                // Fetch worker name - try workerId first, then fallback to location.state.workerName as ID
                if (workerId) {
                    const workerResponse = await Axios.get(`http://localhost:3001/workers/${workerId}`);
                    setWorkersName({
                        name: `${workerResponse.data.name} ${workerResponse.data.surname}`
                    });
                } else if (location.state?.workerName) {
                    // Treat location.state.workerName as an ID if workerId isn't present
                    const workerResponse = await Axios.get(`http://localhost:3001/workers/${location.state.workerName}`);
                    setWorkersName({
                        name: `${workerResponse.data.name} ${workerResponse.data.surname}`
                    });
                } else {
                    setWorkersName({ name: 'Freelancer not specified' });
                }

                // Fetch client name - try clientId first, then fallback to location.state.clientName as ID
                if (clientId) {
                    try {
                        const clientResponse = await Axios.get(`http://localhost:3001/clients/${clientId}`);
                        setClientsName({
                            name: `${clientResponse.data.name} ${clientResponse.data.surname}`
                        });
                    } catch (error) {
                        if (error.response?.status === 404) {
                            console.log('Client not found, trying alternative approach');
                            const allClients = await Axios.get('http://localhost:3001/clients');
                            const client = allClients.data.find(c => c.id == clientId);
                            setClientsName({
                                name: client 
                                    ? `${client.name} ${client.surname}`
                                    : 'Client not found'
                            });
                        } else {
                            throw error;
                        }
                    }
                } else if (location.state?.clientName) {
                    // Treat location.state.clientName as an ID if clientId isn't present
                    try {
                        const clientResponse = await Axios.get(`http://localhost:3001/clients/${location.state.clientName}`);
                        setClientsName({
                            name: `${clientResponse.data.name} ${clientResponse.data.surname}`
                        });
                    } catch (error) {
                        if (error.response?.status === 404) {
                            const allClients = await Axios.get('http://localhost:3001/clients');
                            const client = allClients.data.find(c => c.id == location.state.clientName);
                            setClientsName({
                                name: client 
                                    ? `${client.name} ${client.surname}`
                                    : 'Client not found'
                            });
                        } else {
                            throw error;
                        }
                    }
                } else {
                    setClientsName({ name: 'Client not specified' });
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
                setWorkersName(prev => prev.name ? prev : { name: 'Freelancer not available' });
                setClientsName(prev => prev.name ? prev : { name: 'Client not available' });
            }
        };

        fetchNames();
    }, [workerId, clientId, location.state]);

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role === "client") {
            setCurrentUser({
                name: clientsName.name || clientName, 
                role: 'client'
            });
        } else {
            setCurrentUser({
                name: workersName.name || workerName, 
                role: 'freelancer'
            });
        }
    }, [clientName, workerName, clientsName, workersName]);

    useEffect(() => {
        if (room) {
            socket.emit("join_room", { room });
            console.log(`Joined room: ${room}`);

            socket.on("receive_message", (data) => {
                console.log('Received message:', data);
                setMessages((prevMessages) => [...prevMessages, data]);
            });

            // Handle back button (browser)
            const handlePopState = () => {
                socket.emit("leave_room", { room });
                console.log(`Left room: ${room}`);
            };

            window.addEventListener("popstate", handlePopState);

            // Cleanup
            return () => {
                socket.emit("leave_room", { room });
                socket.off("receive_message");
                window.removeEventListener("popstate", handlePopState);
                console.log(`Cleaned up and left room: ${room}`);
            };
        }
    }, [room]);

    useEffect(() => {
        if (clientName) {
            setCurrentUserName(clientName);
        } else if (workerName) {
            setCurrentUserName(workerName);
        }
    }, [clientName, workerName]);

    const messagesEndRef = useRef(null);
    
    // Add this scroll function
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Add this effect
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    //This function constructs a messageData object containing room ID, author name, message and the current time
    //Sends this data to the server using socket.emit("send_message", messageData)
    //Updates the messageList state to include the new message and clears the currentMessage state.
    const sendMessage = async () => {
        if (message!== "") {
            //const room = `room-${workerId}`;
            const messageData = {
                room: room,
                author: currentUser.name,
                message: message,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            };
            socket.emit("send_message", messageData);
            setMessages((list) => [...list, messageData]);
            setMessage("");
        }
    };

    // Function to end chat
    const endChat = () => {
        if (window.confirm("Are you sure you want to end this chat?")) {
            socket.emit('leave_room', { room });
        
            const role = localStorage.getItem('role');
            if (role === "client") {
                navigate('/home');
            } else {
                navigate('/freelancerhome');
            }
        }
    };

    const shareLocation = async () => {
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                const { latitude, longitude } = position.coords;
                
                // Get a static map image (using Google Maps Static API)
                const mapImageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=300x200&maptype=roadmap&markers=color:red%7C${latitude},${longitude}&key=AIzaSyC9jEINsXbkly2I3jIyNH8eHJ6J19De-2w`;
                
                // Create a Google Maps link
                const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                
                // Create a rich message object
                const locationMessage = {
                    type: 'location',
                    coordinates: { latitude, longitude },
                    mapImage: mapImageUrl,
                    link: mapsLink,
                    timestamp: new Date().toISOString()
                };

                const messageData = {
                    room: room,
                    author: currentUser.name,
                    message: '', // Empty for location messages
                    location: locationMessage, // Special location data
                    time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
                };
                
                socket.emit("send_message", messageData);
                setMessages((list) => [...list, messageData]);
                
                
            } catch (error) {
                console.error("Error getting location:", error);
                alert("Could not share location. Please enable location services.");
            }
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    // Modify your message rendering to handle location messages
    const renderMessageContent = (messageContent) => {
        if (messageContent.location) {
            return (
                <div className="location-message">
                    <a href={messageContent.location.link} target="_blank" rel="noopener noreferrer">
                        <img 
                            src={messageContent.location.mapImage} 
                            alt="Location map" 
                            className="location-map-image"
                        />
                        <div className="location-meta">
                            <span className="location-pin">📍</span>
                            <span className="location-text">Shared Location</span>
                        </div>
                    </a>
                </div>
            );
        }
        return <p>{messageContent.message}</p>;
    };

    return (
        <div className="chat-container">
            <header className="chat-header-container">
                <div className='header'>
                    <div className="chat-user-info">
                        <h2>
                            {currentUser?.role === 'client' 
                                ? `Chat with freelancer: ${workersName.name || "Loading..."}`
                                : `Chat with client: ${clientsName.name || "Loading..."}`}
                        </h2>
                        <p className="room-id">Chat ID: {room}</p>
                    </div>
                </div>
                <div className='chat-logo'>
                        <img src={logo} alt='logo'/>
                    </div>
            </header>
            
            <div className="chat-app-container">
                <div className="chat-window">
                    <div className="chat-header">
                        <p>Live Chat</p>
                        <div className="status-indicator">
                            <span className="status-dot active"></span>
                            <span>Online</span>
                        </div>
                    </div>
                    <div className="chat-body">
                        <ScrollToBottom className="message-container" followButtonClassName="scroll-follow">
                            {messages.map((messageContent, index) => {
                                const isCurrentUser = messageContent.author === currentUser?.name;
                                return (
                                    <div
                                        key={index}
                                        className="message"
                                        id={isCurrentUser ? "you" : "other"}
                                    >
                                        <div style={{width:'100%'}}>
                                            <div className="message-content">
                                                {/*<p>{messageContent.message}</p>*/}
                                                <p>{renderMessageContent(messageContent)}</p>
                                            </div>
                                            <div className="message-meta">
                                                <p id="time">{messageContent.time}</p>
                                                <p id="author">
                                                    {isCurrentUser 
                                                        ? 'You' 
                                                        : messageContent.author === currentUser.name 
                                                            ? workersName.name 
                                                            : clientsName.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </ScrollToBottom>
                    </div>
                    <div className="chat-footer">
                        <input
                            type="text"
                            value={message}
                            placeholder="Type your message here..."
                            onChange={(event) => {
                                setMessage(event.target.value);
                            }}
                            onKeyPress={(event) => {
                                event.key === 'Enter' && sendMessage();
                            }}
                        />
                        <button onClick={sendMessage} className="send-button">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="chat-sidebar">
                    <div className="sidebar-section">
                        <h3>Chat Participants</h3>
                        <div className="participant">
                            <div className="participant-role">Freelancer:</div>
                            <div className="participant-name">{workersName.name /*|| location.state?.workerName || 'Not available'*/}</div>
                        </div>
                        <div className="participant">
                            <div className="participant-role">Client:</div>
                            <div className="participant-name">{clientsName.name /*|| location.state?.clientName || 'Not available'*/}</div>
                        </div>
                    </div>
                    
                    <div className="sidebar-section">
                        <h3>Chat Details</h3>
                        <div className="detail-item">
                            <span className="detail-label">Started:</span>
                            <span className="detail-value">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Your role:</span>
                            <span className="detail-value">
                                {currentUser?.role === 'client' ? 'Client' : 'Freelancer'}
                            </span>
                        </div>
                    </div>
                    <div className="sidebar-section">
                        <h3>Quick Actions</h3>
                        <button className="action-button" onClick={shareLocation}>
                            Share Location
                        </button>
                        <button className="action-button">
                            Request Payment
                        </button>
                        <button className="action-button" onClick={endChat}>
                            End Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;

/*<div className="chat-container">
            <header className="chat-header-container">
                <div className='header'>
                    <div className='request-form-logo'>
                        <img src={logo} alt='logo'/>
                    </div>
                    <div className="chat-user-info">
                        <h2>Chat with {workerName || clientName}</h2>
                        <p className="room-id">Room ID: {room}</p>
                    </div>
                </div>
            </header>
            
            <div className="chat-app-container">
                <div className="chat-window">
                    <div className="chat-header">
                        <p>Live Chat</p>
                        <div className="status-indicator">
                            <span className="status-dot active"></span>
                            <span>Online</span>
                        </div>
                    </div>
                    <div className="chat-body">
                        <ScrollToBottom className="message-container">
                            {messages.map((messageContent, index) => {
                                return (
                                    <div
                                        key={index}
                                        className="message"
                                        id={messageContent.author === currentUserName ? "you" : "other"}
                                    >
                                        <div>
                                            <div className="message-content">
                                                <p>{messageContent.message}</p>
                                            </div>
                                            <div className="message-meta">
                                                <p id="time">{messageContent.time}</p>
                                                <p id="author">{messageContent.author}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </ScrollToBottom>
                    </div>
                    <div className="chat-footer">
                        <input
                            type="text"
                            value={message}
                            placeholder="Type your message here..."
                            onChange={(event) => {
                                setMessage(event.target.value);
                            }}
                            onKeyPress={(event) => {
                                event.key === 'Enter' && sendMessage();
                            }}
                        />
                        <button onClick={sendMessage} className="send-button">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="chat-sidebar">
                    <div className="sidebar-section">
                        <h3>Chat Details</h3>
                        <div className="detail-item">
                            <span className="detail-label">Started:</span>
                            <span className="detail-value">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Participants:</span>
                            <span className="detail-value">{workerName && clientName ? `${workerName}, ${clientName}` : 'Loading...'}</span>
                        </div>
                    </div>
                    
                    <div className="sidebar-section">
                        <h3>Quick Actions</h3>
                        <button className="action-button">
                            Share Location
                        </button>
                        <button className="action-button">
                            Request Payment
                        </button>
                        <button className="action-button">
                            End Chat
                        </button>
                    </div>
                </div>
            </div>
        </div>*/

        /*useEffect(() => {
        if (clientName) {
            setCurrentUser({ name: clientName, role: 'client' });
        } else if (workerName) {
            setCurrentUser({ name: workerName, role: 'freelancer' });
        }
    }, [clientName, workerName]);*/