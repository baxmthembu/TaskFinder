import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import './ChatWidget.css'; // We'll create this CSS file
import { io } from 'socket.io-client';
import { FaSync } from 'react-icons/fa'; // Refresh icon
import { set } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperclip, 
  faMapMarkerAlt, 
  faTimes,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

//const socket = io('http://localhost:3001');
/*const socket = io('http://localhost:3001', {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});*/

/*const ChatWidget = ({ currentUser, onClose, room, setActiveChat, otherUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChats, setActiveChats] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const fetchMessages = async (roomId) => {
  try {
    setIsLoading(true);
    const response = await fetch(`http://localhost:3001/chats/${roomId}/messages`);
    if (response.ok) {
      const data = await response.json();
      const formattedMessages = data.map(msg => ({
        ...msg,
        sender: msg.sender || msg.sender_id,
        room: roomId,
        timestamp: msg.timestamp || msg.created_at
      }));
      setMessages(formattedMessages);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    setIsLoading(false);
  }
};

const handleSelectConversation = (conversation) => {
  // Leave all other chat rooms before joining the new one
  if (selectedConversation?.room_id) {
    socket.emit('leave_room', { room: selectedConversation.room_id });
  }
  
  setSelectedConversation(conversation);
  
  // Join the new room
  socket.emit("join_room", { room: conversation.room_id });
  
  // Fetch messages for this specific conversation
  fetchMessages(conversation.room_id);
};
  


  const socket = useMemo(() => io('http://localhost:3001'), []);


  // old Fetch conversations for current user
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/chats/${currentUser.id}`);
        const data = await response.json();
        setConversations(data);
        
        // If there's no selected conversation, select the first one
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser.id]);

  useEffect(() => {
  const handleReceiveMessage = (data) => {
    if (data.room === selectedConversation?.room_id) {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => 
          msg.timestamp === data.timestamp && 
          msg.sender === data.sender
        );
        return exists ? prev : [...prev, data];
      });
    }
  };

  socket.on('receive_message', handleReceiveMessage);
  return () => {
    socket.off('receive_message', handleReceiveMessage);
  };
}, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

useEffect(() => {
  const handleNewChat = (newChat) => {
    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.room_id === newChat.room_id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newChat;
        return updated;
      }
      
      // Add new chat and select it if it's for the current user
      const newConversations = [newChat, ...prev];
      if (newChat.client_id === currentUser.id || newChat.freelancer_id === currentUser.id) {
        setSelectedConversation(newChat);
        socket.emit("join_room", { room: newChat.room_id });
      }
      return newConversations;
    });
  };

  socket.on('chat_created', handleNewChat);
  return () => socket.off('chat_created', handleNewChat);
}, [currentUser.id]);

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'F5') {
      e.preventDefault();
      handleRefresh();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);

  const handleSendMessage = async () => {
  if ((newMessage.trim() === '' && !file) || !selectedConversation) return;

  const tempId = Date.now().toString();
  
  try {
    const formData = new FormData();
    formData.append('roomId', selectedConversation.room_id);
    formData.append('senderId', currentUser.id);
    formData.append('message', newMessage);
    
    if (file) {
      formData.append('chatImage', file); // Must match the multer field name
    }

    // Optimistic update
    const messageData = {
      id: tempId,
      room: selectedConversation.room_id,
      sender: currentUser.id,
      message: newMessage || (file ? 'Shared an image' : ''),
      timestamp: new Date().toISOString(),
      type: file ? 'image' : 'text',
      content: file ? URL.createObjectURL(file) : null
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setFile(null);
    setPreview(null);
    setIsTyping(false);

    const response = await fetch('http://localhost:3001/messages', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to send message');

    const data = await response.json();
    
    // Replace optimistic update with actual message from server
    setMessages(prev => prev.map(msg => 
      msg.id === tempId ? {
        ...msg,
        id: data.id,
        type: data.message_type,
        image_path: data.image_path,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.created_at
      } : msg
    ));

  } catch (error) {
    console.error('Error sending message:', error);
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (e) => {
  setNewMessage(e.target.value);
  
  if (!isTyping && e.target.value.length > 0 && selectedConversation) {
    setIsTyping(true);
    socket.emit('typing', {
      room: selectedConversation.room_id,
      sender: currentUser.id,
      isTyping: true
    });
  } else if (isTyping && e.target.value.length === 0 && selectedConversation) {
    setIsTyping(false);
    socket.emit('typing', {
      room: selectedConversation.room_id,
      sender: currentUser.id,
      isTyping: false
    });
  }
};

useEffect(() => {
  const handleTypingEvent = (data) => {
    if (data.room === selectedConversation?.room_id && data.sender !== currentUser.id) {
      if (data.isTyping) {
        setTypingStatus(`${getPartnerInfo(selectedConversation).name} is typing...`);
      } else {
        setTypingStatus('');
      }
    }
  };

  socket.on('typing', handleTypingEvent);
  return () => socket.off('typing', handleTypingEvent);
}, [selectedConversation]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp);
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const getPartnerInfo = (conversation) => {
    if (currentUser.role === 'client') {
      return {
        id: conversation.freelancer_id,
        name: `${conversation.freelancer_name + conversation.freelancer_surname}` || 'Freelancer',
        image: conversation.freelancer_images || null,
        role: 'freelancer'
      };
    } else {
      return {
        id: conversation.client_id,
        name: `${conversation.client_name + conversation.client_surname}` || 'Client',
        image: null,
        role: 'client'
      };
    }
  };

  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear the message history? This will only clear your view.')) {
      setMessages([]); // This clears the messages in the frontend only
    }
  };

  const handleRefresh = async () => {
  try {
    setIsLoading(true);
    
    // Refresh conversations
    const convResponse = await fetch(`http://localhost:3001/chats/${currentUser.id}`);
    const convData = await convResponse.json();
    setConversations(convData);
    
    // Refresh messages if a conversation is selected
    if (selectedConversation) {
      const msgResponse = await fetch(
        `http://localhost:3001/chats/${selectedConversation.room_id}/messages`
      );
      const msgData = await msgResponse.json();
      setMessages(msgData.map(msg => ({
        ...msg,
        sender: msg.sender || msg.sender_id,
        room: selectedConversation.room_id,
        timestamp: msg.timestamp || msg.created_at
      })));
    }
  } catch (error) {
    console.error('Error refreshing:', error);
  } finally {
    setIsLoading(false);
  }
};

  const handleFileChange = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }
};

// Add location sharing handler
const handleShareLocation = async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const locationData = {
      room: selectedConversation.room_id,
      sender: currentUser.id,
      type: 'location',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, locationData]);

    // Save to server
    await fetch('http://localhost:3001/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: selectedConversation.room_id,
        senderId: currentUser.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        message: 'Shared location'
      })
    });

    // Socket emit handled by backend
  } catch (error) {
    console.error("Location error:", error);
    alert("Could not get your location");
  }
};

const renderMessageContent = (message) => {
  if (message.type === 'location' || message.message_type === 'location') {
    return (
      <div className="location-message">
        <a 
          href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img 
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.latitude},${message.longitude}&zoom=15&size=300x200&markers=color:red%7C${message.latitude},${message.longitude}&key=AIzaSyBn12Rfh5u3y0myZ__u7B2fsl9IvLSzJr0`}
            alt="Location"
            style={{ maxWidth: '100%', borderRadius: '8px' }}
          />
          <span style={{ display: 'block', marginTop: '5px' }}>
            {message.message || 'Shared location'}
          </span>
        </a>
      </div>
    );
  } else if (message.type === 'image' || message.message_type === 'image') {
    const imageUrl = message.content?.startsWith('blob:') 
      ? message.content 
      : message.image_path 
        ? `http://localhost:3001/uploads/chat-images/${message.image_path}`
        : null;

    return (
      <div className="image-message">
        {imageUrl && (
          <img 
            src={imageUrl}
            alt={message.message || 'Shared image'}
            style={{ maxWidth: '100%', borderRadius: '8px' }}
            onLoad={() => {
              if (message.content?.startsWith('blob:')) {
                URL.revokeObjectURL(message.content);
              }
            }}
          />
        )}
        {message.message && message.message !== 'Shared an image' && (
          <p>{message.message}</p>
        )}
      </div>
    );
  }
  return <p>{message.message}</p>;
};

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>Messages</h3>
        <div className='chat-header-actions'>
          <button 
            className="refresh-button" 
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the header click
              handleRefresh();
            }}
            title="Refresh conversations"
          >
          <FaSync className={isLoading ? 'spin' : ''} />
          </button>
          <button className="close-chat" onClick={onClose}>×</button>
        </div>
      </div>

      {isOpen && (
        <div className="chat-content">
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map(conversation => {
                const partner = getPartnerInfo(conversation);
                const isActive = selectedConversation?.room_id === conversation.room_id;
                
                return (
                  <div 
                    key={conversation.room_id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      handleSelectConversation(conversation)
                    }}
                  >
                    <div className="conversation-avatar">
                      {partner.image ? (
                        <img 
                          src={`http://localhost:3001/images/${partner.image}`} 
                          alt={partner.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="default-avatar">
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4>{partner.name} {partner.surname}</h4>
                        <span className="message-time">{formatDate(conversation.last_message_time)}</span>
                      </div>
                      <p className="message-preview">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="message-area">
            {selectedConversation ? (
              <>
                <div className="message-header">
                  {(() => {
                    const partner = getPartnerInfo(selectedConversation);
                    return (
                      <>
                        <div className="message-avatar">
                          {partner.image ? (
                            <img 
                              src={`http://localhost:3001/images/${partner.image}`} 
                              alt={partner.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'default-avatar.png';
                              }}
                            />
                          ) : (
                            <div className="default-avatar">
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="message-partner-info">
                          <h3>{partner.name}</h3>
                          <p>{partner.role}</p>
                        </div>
                        <button 
                          onClick={handleClearMessages}
                          className="clear-messages-button"
                          title="Clear messages from view"
                        >
                          Clear Messages
                        </button>
                      </>
                    );
                  })()}
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="empty-messages">
                      <p>Start your conversation with {getPartnerInfo(selectedConversation).name}</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isSent = String(message.sender) === String(currentUser.id);
                      return (
                      <div 
                        key={index} 
                        className= {`message ${isSent ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">
                          {renderMessageContent(message)}
                          <span className="message-time">{formatTime(message.timestamp)}</span>
                        </div>
                      </div>
                      );
                    })
                  )}
                  {/* Add typing status here *}
                  {typingStatus && (
                    <div className="typing-status">
                      {typingStatus}
                    </div>
                  )}  
                  <div ref={messagesEndRef} />
                </div>
                <div className="message-input">
                  <div className="input-actions">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      id="file-upload" 
                      style={{ display: 'none' }}
                      name='chatImage'
                    />
                    <label htmlFor="file-upload" className="file-upload-button">
                      <FontAwesomeIcon icon={faPaperclip} />
                    </label>
                    <button onClick={handleShareLocation} className="location-button">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                    </button>
                  </div>
                  {preview && (
                    <div className="image-preview">
                      <img src={preview} alt="Preview" />
                      <button onClick={() => {
                        setPreview(null);
                        setFile(null);
                      }} className="remove-image">
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={newMessage}
                    onChange=/*{handleTyping}* {(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                  />
                  <button onClick={handleSendMessage}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19,15H15A3,3 0 0,1 12,18A3,3 0 0,1 9,15H5V5H19M19,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,8A2,2 0 0,0 10,10A2,2 0 0,0 12,12A2,2 0 0,0 14,10A2,2 0 0,0 12,8Z" />
                  </svg>
                </div>
                <h4>Select a conversation</h4>
                <p>Choose a chat from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};*/

/*import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaSync, FaPaperclip, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import io from 'socket.io-client';*/

const ChatWidget = ({ currentUser, onClose, room, setActiveChat, otherUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChats, setActiveChats] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Socket connection - FIXED: Ensure proper connection handling
  const socket = useMemo(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    return newSocket;
  }, []);

  const fetchMessages = async (roomId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:3001/chats/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map(msg => ({
          ...msg,
          sender: String(msg.sender || msg.sender_id), // Ensure sender is string
          room: roomId,
          timestamp: msg.timestamp || msg.created_at,
          // Ensure image_url is properly set for existing images
          image_url: msg.image_path ? `http://localhost:3001/uploads/chat-images/${msg.image_path}` : null
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    // Leave all other chat rooms before joining the new one
    if (selectedConversation?.room_id) {
      socket.emit('leave_room', { room: selectedConversation.room_id });
    }
    
    setSelectedConversation(conversation);
    
    // Join the new room - FIXED: Ensure proper room joining
    socket.emit("join_room", { room: conversation.room_id, userId: currentUser.id });
    
    // Fetch messages for this specific conversation
    fetchMessages(conversation.room_id);
  };

  // Fetch conversations for current user
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/chats/${currentUser.id}`);
        const data = await response.json();
        setConversations(data);
        
        // If there's no selected conversation, select the first one
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0]);
          // Join the room for the first conversation
          socket.emit("join_room", { room: data[0].room_id, userId: currentUser.id });
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser.id]);

  // FIXED: Improved message reception handling
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      // Check if message is for the current conversation
      if (data.room === selectedConversation?.room_id) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(msg => msg.id === data.id);
          if (!exists) {
            // Ensure image_url is properly set for received images
            const messageWithImageUrl = data.image_path ? {
              ...data,
              image_url: `http://localhost:3001/uploads/chat-images/${data.image_path}`
            } : data;
            
            return [...prev, messageWithImageUrl];
          }
          return prev;
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleNewChat = (newChat) => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.room_id === newChat.room_id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newChat;
          return updated;
        }
        
        // Add new chat and select it if it's for the current user
        const newConversations = [newChat, ...prev];
        if (newChat.client_id === currentUser.id || newChat.freelancer_id === currentUser.id) {
          setSelectedConversation(newChat);
          socket.emit("join_room", { room: newChat.room_id, userId: currentUser.id });
        }
        return newConversations;
      });
    };

    socket.on('chat_created', handleNewChat);
    return () => socket.off('chat_created', handleNewChat);
  }, [currentUser.id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // FIXED: Improved message sending with better error handling
  const handleSendMessage = async () => {
    if ((newMessage.trim() === '' && !file) || !selectedConversation) return;

    const tempId = Date.now().toString();
    
    try {
      const formData = new FormData();
      formData.append('roomId', selectedConversation.room_id);
      formData.append('senderId', currentUser.id);
      formData.append('message', newMessage);
      
      if (file) {
        formData.append('chatImage', file);
      }

      // Optimistic update
      const messageData = {
        id: tempId,
        room: selectedConversation.room_id,
        sender: currentUser.id,
        message: newMessage || (file ? 'Shared an image' : ''),
        timestamp: new Date().toISOString(),
        type: file ? 'image' : 'text',
        content: file ? URL.createObjectURL(file) : null
      };

      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
      setFile(null);
      setPreview(null);
      setIsTyping(false);

      const response = await fetch('http://localhost:3001/messages', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      
      // Replace optimistic update with actual message from server
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {
          ...msg,
          id: data.id,
          type: data.message_type,
          image_path: data.image_path,
          image_url: data.image_path ? `http://localhost:3001/uploads/chat-images/${data.image_path}` : null,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: data.created_at
        } : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp);
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const getPartnerInfo = (conversation) => {
    if (currentUser.role === 'client') {
      return {
        id: conversation.freelancer_id,
        name: conversation.freelancer_name || 'Freelancer',
        surname: conversation.freelancer_surname || '',
        image: conversation.freelancer_images || null,
        role: 'freelancer'
      };
    } else {
      return {
        id: conversation.client_id,
        name: conversation.client_name || 'Client',
        surname: conversation.client_surname || '',
        image: null,
        role: 'client'
      };
    }
  };

  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear the message history? This will only clear your view.')) {
      setMessages([]);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Refresh conversations
      const convResponse = await fetch(`http://localhost:3001/chats/${currentUser.id}`);
      const convData = await convResponse.json();
      setConversations(convData);
      
      // Refresh messages if a conversation is selected
      if (selectedConversation) {
        const msgResponse = await fetch(
          `http://localhost:3001/chats/${selectedConversation.room_id}/messages`
        );
        const msgData = await msgResponse.json();
        setMessages(msgData.map(msg => ({
          ...msg,
          sender: String(msg.sender || msg.sender_id),
          room: selectedConversation.room_id,
          timestamp: msg.timestamp || msg.created_at,
          // Ensure image_url is properly set
          image_url: msg.image_path ? `http://localhost:3001/uploads/chat-images/${msg.image_path}` : null
        })));
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type and size
      if (!selectedFile.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // FIXED: Improved location sharing with better error handling
  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      const locationData = {
        room: selectedConversation.room_id,
        sender: currentUser.id,
        type: 'location',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        message: 'Shared location'
      };

      // Optimistic update
      setMessages(prev => [...prev, locationData]);

      // Save to server
      const response = await fetch('http://localhost:3001/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedConversation.room_id,
          senderId: currentUser.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          message: 'Shared location'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share location');
      }

      // Socket emit handled by backend
    } catch (error) {
      console.error("Location error:", error);
      setMessages(prev => prev.filter(msg => msg.timestamp !== locationData.timestamp));
      alert(`Could not share location: ${error.message}`);
    }
  };

  // FIXED: Improved message content rendering
  const renderMessageContent = (message) => {
    if (message.type === 'location' || message.message_type === 'location') {
      // Check if we have valid location data
      if (!message.latitude || !message.longitude) {
        return <p>Invalid location data</p>;
      }
      
      return (
        <div className="location-message">
          <a 
            href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.latitude},${message.longitude}&zoom=15&size=300x200&markers=color:red%7C${message.latitude},${message.longitude}&key=AIzaSyBn12Rfh5u3y0myZ__u7B2fsl9IvLSzJr0`}
              alt="Location"
              style={{ maxWidth: '100%', borderRadius: '8px' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=Map+Unavailable';
              }}
            />
            <span style={{ display: 'block', marginTop: '5px' }}>
              {message.message || 'Shared location'}
            </span>
          </a>
        </div>
      );
    } else if (message.type === 'image' || message.message_type === 'image') {
      // Use image_url if available, otherwise fall back to content or image_path
      const imageUrl = message.image_url || 
                      (message.content?.startsWith('blob:') ? message.content : 
                      (message.image_path ? `http://localhost:3001/uploads/chat-images/${message.image_path}` : null));

      return (
        <div className="image-message">
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={message.message || 'Shared image'}
              style={{ maxWidth: '100%', borderRadius: '8px' }}
              onLoad={() => {
                if (message.content?.startsWith('blob:')) {
                  URL.revokeObjectURL(message.content);
                }
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x150?text=Image+Not+Found';
              }}
            />
          ) : (
            <p>Image not available</p>
          )}
          {message.message && message.message !== 'Shared an image' && (
            <p>{message.message}</p>
          )}
        </div>
      );
    }
    return <p>{message.message}</p>;
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>Messages</h3>
        <div className='chat-header-actions'>
          <button 
            className="refresh-button" 
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            title="Refresh conversations"
            disabled={isLoading}
          >
            <FaSync className={isLoading ? 'spin' : ''} />
          </button>
          <button className="close-chat" onClick={onClose}>×</button>
        </div>
      </div>

      {isOpen && (
        <div className="chat-content">
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map(conversation => {
                const partner = getPartnerInfo(conversation);
                const isActive = selectedConversation?.room_id === conversation.room_id;
                
                return (
                  <div 
                    key={conversation.room_id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="conversation-avatar">
                      {partner.image ? (
                        <img 
                          src={`http://localhost:3001/images/${partner.image}`} 
                          alt={partner.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="default-avatar">
                          {partner.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4>{partner.name} {partner.surname}</h4>
                        <span className="message-time">{formatDate(conversation.last_message_time)}</span>
                      </div>
                      <p className="message-preview">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="message-area">
            {selectedConversation ? (
              <>
                <div className="message-header">
                  {(() => {
                    const partner = getPartnerInfo(selectedConversation);
                    return (
                      <>
                        <div className="message-avatar">
                          {partner.image ? (
                            <img 
                              src={`http://localhost:3001/images/${partner.image}`} 
                              alt={partner.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'default-avatar.png';
                              }}
                            />
                          ) : (
                            <div className="default-avatar">
                              {partner.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="message-partner-info">
                          <h3>{partner.name} {partner.surname}</h3>
                          <p>{partner.role}</p>
                        </div>
                        <button 
                          onClick={handleClearMessages}
                          className="clear-messages-button"
                          title="Clear messages from view"
                        >
                          Clear Messages
                        </button>
                      </>
                    );
                  })()}
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="empty-messages">
                      <p>Start your conversation with {getPartnerInfo(selectedConversation).name}</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isSent = String(message.sender) === String(currentUser.id);
                      return (
                        <div 
                          key={message.id || index} 
                          className={`message ${isSent ? 'sent' : 'received'}`}
                        >
                          <div className="message-content">
                            {renderMessageContent(message)}
                            <span className="message-time">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="message-input">
                  <div className="input-actions">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      id="file-upload" 
                      style={{ display: 'none' }}
                      name='chatImage'
                    />
                    <label htmlFor="file-upload" className="file-upload-button">
                      <FaPaperclip />
                    </label>
                    <button onClick={handleShareLocation} className="location-button">
                      <FaMapMarkerAlt />
                    </button>
                  </div>
                  {preview && (
                    <div className="image-preview">
                      <img src={preview} alt="Preview" />
                      <button onClick={() => {
                        setPreview(null);
                        setFile(null);
                      }} className="remove-image">
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isLoading}
                  />
                  <button onClick={handleSendMessage} disabled={isLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19,15H15A3,3 0 0,1 12,18A3,3 0 0,1 9,15H5V5H19M19,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,8A2,2 0 0,0 10,10A2,2 0 0,0 12,12A2,2 0 0,0 14,10A2,2 0 0,0 12,8Z" />
                  </svg>
                </div>
                <h4>Select a conversation</h4>
                <p>Choose a chat from the list to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
