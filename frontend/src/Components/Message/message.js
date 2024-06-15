import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Axios from 'axios';

const socket = io('http://localhost:3002');

const Chat = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const clientId = 5; // Replace with actual client ID
        const freelancerId = 160; // Replace with actual freelancer ID

        const joinChat = () => {
        socket.emit('join', { clientId, freelancerId });

        socket.on('chat message', (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        fetchExistingMessages(clientId, freelancerId);
        };

        joinChat();

        return () => {
            socket.off('chat message');
        };
    }, []);

    const fetchExistingMessages = async (clientId, freelancerId) => {
        try {
            // Fetch chat session ID
            const response = await Axios.get(`http://localhost:3002/api/chat-session?clientId=${clientId}&freelancerId=${freelancerId}`);
            if(!response.ok){
                console.error('failed')
            }
            const chatSession = response.data;
            if (chatSession && chatSession.id) {
                const responseMessages = await fetch(`http://localhost:3002/api/messages?chatSessionId=${chatSession.id}`);
                const data = await responseMessages.json();
                if (Array.isArray(data)) {
                    setMessages(data);
                } else {
                    console.error('Fetched messages data is not an array:', data);
                    setMessages([]);
                }
            } else {
                console.error('No chat session found:', chatSession);
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
        }
    };

    const sendMessage = () => {
        const clientId = 5; // Replace with actual client ID
        const freelancerId = 160; // Replace with actual freelancer ID

        // Emit message
        socket.emit('chat message', {
            chatSessionId: 1, // Replace with actual chat session ID
            senderType: 'client', // 'client' or 'freelancer'
            senderId: clientId,
            messageText: message,
        });

        setMessage('');
    };

    return (
        <div>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>{msg.message_text}</div>
                ))}
            </div>
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
