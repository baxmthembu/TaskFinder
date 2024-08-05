import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import ScrollToBottom from 'react-scroll-to-bottom';
import '../src/chat.css'
import Nav from "./Components/Nav/nav";
import Sidebar from "./Worker/Freelancer_Sidebar/freelancer_sidebar";
//import socket from "./socket";

const socket = io.connect('http://localhost:3001');

const Chat = () => {
    const location = useLocation();
    const { room,workerName, clientName } = location.state || { room: '', workerName: '', clientName: '' };
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);


        useEffect(() => {
            if(room) {
            socket.emit("join_room", {room});
            console.log(`Joined room: ${room}`);

            socket.on("receive_message", (data) => {
                console.log('Received message:', data);
                setMessages((prevMessages) => [...prevMessages,data])
            })
        }

        return () => {
            socket.off("receive_message")
        };
    }, [room])

    //This function constructs a messageData object containing room ID, author name, message and the current time
    //Sends this data to the server using socket.emit("send_message", messageData)
    //Updates the messageList state to include the new message and clears the currentMessage state.
    const sendMessage = async () => {
        if (message!== "") {
            //const room = `room-${workerId}`;
            const messageData = {
                room: room,
                author: clientName,
                message: message,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            };
            await socket.emit("send_message", messageData);
            setMessages((list) => [...list, messageData]);
            setMessage("");
        }
    };

    const logo3 = require('./Components/Images/TalentTrove.png')

    return (
        <div>
            <header>
                <div className='header'>
                    <Sidebar />
                    <div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px",  }}>
                        <img src={logo3} />
                    </div>
                </div>
                </header>

        <div className="App">
        <div className="chat-window">
            <div className="chat-header">
                <p>Live Chat</p>
            </div>
            <div className="chat-body">
                <ScrollToBottom className="message-container">
                {/*Maps over messageList to render each message with conditional styling based on whether the message 
                  author is the current user or someone else.*/}
                    {messages.map((messageContent, index) => {
                        return (
                            <div
                                key={index}
                                className="message"
                                id={clientName === messageContent.author ? "you" : "other"}
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
                    placeholder="Text Message"
                    onChange={(event) => {
                        setMessage(event.target.value);
                    }}
                    onKeyPress={(event) => {
                        event.key === 'Enter' && sendMessage();
                    }}
                />
                <button onClick={sendMessage}>&#9658;</button>
            </div>
        </div>
        </div>
        </div>
    );
}

export default Chat;