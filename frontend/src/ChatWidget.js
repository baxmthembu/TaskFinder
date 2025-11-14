import { useState, useEffect, useRef, useCallback } from 'react';
import { FaSync, FaPaperclip, FaMapMarkerAlt, FaTimes, FaCamera, FaPlus } from 'react-icons/fa';
import './ChatWidget.css';
import io from 'socket.io-client';
import PayPal from './Components/Paypal/paypal';

//const socket = io('http://localhost:3001');
const socket = io.connect('https://taskfinder.onrender.com');

const ChatWidget = ({ currentUser, onClose, room, task, onAcceptTask, onDeclineTask }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [, setPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const dropdownRef = useRef(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  // Add this function to fetch initial unread counts
const fetchUnreadCounts = useCallback(async () => {
  try {
    //const response = await fetch(`http://localhost:3001/chats/${currentUser.id}/unread-counts`);
    const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${currentUser.id}/unread-counts`);
    if (response.ok) {
      const data = await response.json();
      setUnreadCounts(data);

      // Calculate total unread count
      const total = Object.values(data).reduce((sum, count) => sum + count, 0);
      setTotalUnread(total);
    }
  } catch (error) {
    console.error('Error fetching unread counts:', error);
  }
}, [currentUser.id]);

const fetchMessages = async (roomId) => {
    try {
      setIsLoading(true);
      //const response = await fetch(`http://localhost:3001/chats/${roomId}/messages`);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map(msg => ({
          ...msg,
          sender: String(msg.sender || msg.sender_id),
          room: roomId,
          timestamp: msg.timestamp || msg.created_at,
          //image_url: msg.image_path ? `http://localhost:3001/chat-images/${msg.image_path}` : null
          image_url: msg.image_path ? `${process.env.REACT_APP_API_URL}/chat-images/${msg.image_path}` : null
        }));
        setMessages(formattedMessages);
        
        // Mark messages as read when they are fetched
        if (formattedMessages.length > 0) {
          markMessagesAsRead(roomId);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async (roomId) => {
  try {
    /*const response = await fetch('http://localhost:3001/messages/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        userId: currentUser.id
      })
    });*/
    const response = await fetch(`${process.env.REACT_APP_API_URL}/messages/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        userId: currentUser.id
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      setTotalUnread(data.unreadCount);
      
      // Update the unread count for this specific conversation
      setUnreadCounts(prev => ({
        ...prev,
        [roomId]: 0
      }));
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

const handleSelectConversation = (conversation) => {
    if (selectedConversation?.room_id) {
      socket.emit('leave_room', { room: selectedConversation.room_id });
    }
    
    setSelectedConversation(conversation);
    socket.emit("join_room", { room: conversation.room_id });
    
    // Fetch messages and mark as read
    fetchMessages(conversation.room_id);

    //Mark messages as read when selecting conversation
    markMessagesAsRead(conversation.room_id);
  };

  // Add useEffect for handling notifications
  useEffect(() => {
  const handleNewNotification = (data) => {
    setUnreadCounts(prev => ({
      ...prev,
      [data.roomId]: data.unreadCount
    }));
    setTotalUnread(data.totalUnread);
  };

  socket.on('new_notification', handleNewNotification);
  
  return () => {
    socket.off('new_notification', handleNewNotification);
  };
}, []);

  // Fetch conversations for current user
  useEffect(() => {
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      //const response = await fetch(`http://localhost:3001/chats/${currentUser.id}`);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chats/${currentUser.id}`);
      const data = await response.json();
      setConversations(data);

      // Fetch unread counts after loading conversations
      await fetchUnreadCounts();

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
}, [currentUser.id, fetchUnreadCounts, selectedConversation]);

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
            //image_url: `http://localhost:3001/chat-images/${data.image_path}`
            image_url: `${process.env.REACT_APP_API_URL}/chat-images/${data.image_path}`
          } : data;
          
          return [...prev, messageWithImageUrl];
        }
        return prev;
      });
    }

    if (data.sender !== currentUser.id && data.room !== selectedConversation?.room_id) {
      setUnreadCounts(prev => ({
        ...prev,
        [data.room]: (prev[data.room] || 0) + 1
      }));
      setTotalUnread(prev => prev + 1);
    }
  };

  socket.on('receive_message', handleReceiveMessage);
  
  return () => {
    socket.off('receive_message', handleReceiveMessage);
  };
}, [selectedConversation, currentUser.id]);


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
  }, [handleRefresh]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      formData.append('image', file);
    }

    // Optimistic update
    const messageData = {
      id: tempId,
      room: selectedConversation.room_id,
      sender: currentUser.id,
      message: newMessage || (file ? 'Shared an image' : ''),
      timestamp: new Date().toISOString(),
      type: file ? 'image' : newMessage.includes('📍') ? 'location' : 'text',
      content: file ? URL.createObjectURL(file) : null
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setFile(null);
    setPreview(null);
    setIsTyping(false);

    /*const response = await fetch('http://localhost:3001/messages', {
      method: 'POST',
      body: formData
    });*/
    const response = await fetch(`${process.env.REACT_APP_API_URL}/messages`, {
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
        content: data.message_type === 'image' ? `chat-images/${data.content}` : null,
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

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);

      // Refresh conversations
      //const convResponse = await fetch(`http://localhost:3001/chats/${currentUser.id}`);
      const convResponse = await fetch(`${process.env.REACT_APP_API_URL}/chats/${currentUser.id}`);
      const convData = await convResponse.json();
      setConversations(convData);

      // Refresh messages if a conversation is selected
      if (selectedConversation) {
        /*const msgResponse = await fetch(
          `http://localhost:3001/chats/${selectedConversation.room_id}/messages`
        );*/
        const msgResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/chats/${selectedConversation.room_id}/messages`
        );
        const msgData = await msgResponse.json();
        setMessages(msgData.map(msg => ({
          ...msg,
          sender: String(msg.sender || msg.sender_id),
          room: selectedConversation.room_id,
          timestamp: msg.timestamp || msg.created_at,
          // Ensure image_url is properly set
          //image_url: msg.image_path ? `http://localhost:3001/chat-images/${msg.image_path}` : null
          image_url: msg.image_path ? `${process.env.REACT_APP_API_URL}/chat-images/${msg.image_path}` : null
        })));
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, selectedConversation]);

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
    
    // Set the file and immediately send it
    setFile(selectedFile);
    
    // Create a temporary message for immediate sending
    const tempId = Date.now().toString();
    const messageData = {
      id: tempId,
      room: selectedConversation.room_id,
      sender: currentUser.id,
      message: 'Shared an image',
      timestamp: new Date().toISOString(),
      type: 'image',
      content: URL.createObjectURL(selectedFile)
    };

    // Add to messages immediately
    setMessages(prev => [...prev, messageData]);
    
    // Create form data and send
    const formData = new FormData();
    formData.append('roomId', selectedConversation.room_id);
    formData.append('senderId', currentUser.id);
    formData.append('message', 'Shared an image');
    formData.append('chatImage', selectedFile);

    // Send to server
    /*fetch('http://localhost:3001/messages', {
      method: 'POST',
      body: formData
    })*/
    fetch(`${process.env.REACT_APP_API_URL}/messages`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to send image');
      return response.json();
    })
    .then(data => {
      // Replace temporary message with server response
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {
          ...msg,
          id: data.id,
          type: data.message_type,
          image_path: data.image_path,
          //image_url: data.image_path ? `http://localhost:3001/chat-images/${data.image_path}` : null,
          image_url: data.image_path ? `${process.env.REACT_APP_API_URL}/chat-images/${data.image_path}` : null,
          timestamp: data.created_at
        } : msg
      ));
    })
    .catch(error => {
      console.error('Error sending image:', error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to send image');
    });
    
    // Reset the file input
    e.target.value = '';
  }
};

  // FIXED: Improved location sharing with better error handling
  const handleShareLocation = async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  // Create timestamp outside the try block so it's accessible in catch
  const timestamp = new Date().toISOString();

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: true
      });
    });

    // Optimistic update
    setMessages(prev => [...prev, {
      room: selectedConversation.room_id,
      sender: currentUser.id,
      type: 'location',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: timestamp,
      message: 'Shared location'
    }]);

    // Save to server
    /*const response = await fetch('http://localhost:3001/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: selectedConversation.room_id,
        senderId: currentUser.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        message: 'Shared location'
      })
    });*/
    const response = await fetch(`${process.env.REACT_APP_API_URL}/messages`, {
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
    // Remove the optimistic update using the timestamp
    setMessages(prev => prev.filter(msg => msg.timestamp !== timestamp));
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
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${message.latitude},${message.longitude}&zoom=15&size=300x200&markers=color:red%7C${message.latitude},${message.longitude}&key=AIzaSyC9jEINsXbkly2I3jIyNH8eHJ6J19De-2w`}
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
                      //(message.image_path ? `http://localhost:3001/chat-images/${message.image_path}` : null));
                      (message.image_path ? `${process.env.REACT_APP_API_URL}/chat-images/${message.image_path}` : null));

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

  // Function to start the camera
  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  // Function to stop the camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Function to capture image from camera
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a file from the blob
          const file = new File([blob], `camera_${Date.now()}.jpg`, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          // Stop the camera
          stopCamera();
          
          // Send the image immediately
          sendImageFile(file);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Function to send image file (similar to handleFileChange but for camera)
  const sendImageFile = (file) => {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }
    
    // Create a temporary message for immediate sending
    const tempId = Date.now().toString();
    const messageData = {
      id: tempId,
      room: selectedConversation.room_id,
      sender: currentUser.id,
      message: 'Shared an image',
      timestamp: new Date().toISOString(),
      type: 'image',
      content: URL.createObjectURL(file)
    };

    // Add to messages immediately
    setMessages(prev => [...prev, messageData]);
    
    // Create form data and send
    const formData = new FormData();
    formData.append('roomId', selectedConversation.room_id);
    formData.append('senderId', currentUser.id);
    formData.append('message', 'Shared an image');
    formData.append('chatImage', file);

    // Send to server
    /*fetch('http://localhost:3001/messages', {
      method: 'POST',
      body: formData
    })*/
    fetch(`${process.env.REACT_APP_API_URL}/messages`, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to send image');
      return response.json();
    })
    .then(data => {
      // Replace temporary message with server response
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? {
          ...msg,
          id: data.id,
          type: data.message_type,
          image_path: data.image_path,
          //image_url: data.image_path ? `http://localhost:3001/chat-images/${data.image_path}` : null,
          image_url: data.image_path ? `${process.env.REACT_APP_API_URL}/chat-images/${data.image_path}` : null,
          timestamp: data.created_at
        } : msg
      ));
    })
    .catch(error => {
      console.error('Error sending image:', error);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to send image');
    });
  };

  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
  };

  // Handle file selection from dropdown
  const handleFileSelect = (e) => {
    setShowAttachmentMenu(false);
    handleFileChange(e);
  };

  // Handle camera from dropdown
  const handleCameraSelect = () => {
    setShowAttachmentMenu(false);
    startCamera();
  };

  // Handle location from dropdown
  const handleLocationSelect = () => {
    setShowAttachmentMenu(false);
    handleShareLocation();
  };

  const handleAccept = () => {
    if (task && task.task_id) {
      onAcceptTask(task, getPartnerInfo(selectedConversation).name, room);
    }
  };

  const handleDecline = () => {
    if (task && task.task_id) {
      onDeclineTask(task.task_id, room);
    }
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setShowPayment(false);
    console.log(paymentDetails);
  };

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>Messages {totalUnread > 0 && <span className="total-unread-badge">{totalUnread}</span>}</h3>
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
                const unreadCount = unreadCounts[conversation.room_id] || 0;
                
                return (
                  <div 
                    key={conversation.room_id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="conversation-avatar">
                      {partner.image ? (
                        <img 
                          /*src={`http://localhost:3001/images/${partner.image}`}*/
                          src={`${process.env.REACT_APP_API_URL}/images/${partner.image}`} 
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
                      {unreadCount > 0 && !isActive && (
                        <span className="unread-badge">{unreadCount}</span>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4>{partner.name} {partner.surname}</h4>
                        <span className="message-time">{formatDate(conversation.last_message_time)}</span>
                      </div>
                      <p className="message-preview">
                        {conversation.last_message || 'No messages yet'}
                        {/*{unreadCount > 0 && !isActive && (
                          <span className="unread-indicator"> • </span>
                        )}*/}{unreadCount > 0 && !isActive && (
                          <span className="total-unread-badge">{totalUnread}</span>
                        )}
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
                              //src={`http://localhost:3001/images/${partner.image}`} 
                              src={`${process.env.REACT_APP_API_URL}/images/${partner.image}`}
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

                {currentUser.role === 'freelancer' && task.status === 'pending' && (
                  <div className="task-actions">
                    <button className="accept-button" onClick={handleAccept}>Accept</button>
                    <h3>or</h3>
                    <button className="decline-button" onClick={handleDecline}>Decline</button>
                    <h3>task</h3>
                  </div>
                )}


                {showPayment && (
                  <PayPal
                    amount="$100" // Example amount
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                )}
          
                <div className="message-input">
                  <div className="input-actions">
                  {/* Attachment menu button */}
          <div className="attachment-menu-container" ref={dropdownRef}>
            <button 
              onClick={toggleAttachmentMenu}
              className="attachment-menu-button"
              title="Attachments"
            >
              {showAttachmentMenu ? <FaTimes /> : <FaPlus />}
            </button>
            
            {/* Attachment dropdown menu */}
            {showAttachmentMenu && (
              <div className="attachment-dropdown">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  id="file-upload" 
                  style={{ display: 'none' }}
                  name='chatImage'
                />
                <label htmlFor="file-upload" className="attachment-option" title="Upload photo">
                  <div className='icon-container'>
                  <FaPaperclip />
                  </div>
                  <span>Photo</span>
                </label>
                
                <button onClick={handleCameraSelect} className="attachment-option" title="Take photo">
                  <div className='icon-container'>
                  <FaCamera />
                  </div>
                </button>
                <span>camera</span>
                
                <button onClick={handleLocationSelect} className="attachment-option" title="Share location">
                  <div className='icon-container'>
                  <FaMapMarkerAlt />
                  </div>
                  
                </button>
                <span>Location</span>
              </div>
            )}
            </div>
            </div>

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
                {showCamera && (
                  <div className="camera-modal">
                    <div className="camera-content">
                      <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
                      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                      <div className="camera-controls">
                        <button onClick={captureImage} className="capture-button">
                          <FaCamera />
                        </button>
                        <button onClick={stopCamera} className="close-camera">
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
