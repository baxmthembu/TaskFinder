import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import ScrollToBottom from 'react-scroll-to-bottom';
import './Components/Message/message2.css'

const socket = io.connect('http://localhost:3001');

const Chat = () => {
    const location = useLocation();
    const { workerId, workerName, roomId } = location.state || {};
    //currentMessage stores the current messages being typed by user
    const [currentMessage, setCurrentMessage] = useState("");
    //messageList stores the list of all exhanged messages in the chat
    const [messageList, setMessageList] = useState([]);

        useEffect(() => {
            if(roomId) {
            socket.emit("join_room", roomId);

            socket.on("reveive_message", (data) => {
                setMessageList((list) => [...list,data])
            })
        }
    }, [roomId])

    //This function constructs a messageData object containing room ID, author name, message and the current time
    //Sends this data to the server using socket.emit("send_message", messageData)
    //Updates the messageList state to include the new message and clears the currentMessage state.
    const sendMessage = async () => {
        if (currentMessage !== "") {
            const room = `room-${workerId}`;
            const messageData = {
                room: room,
                author: workerName,
                message: currentMessage,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            };
            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
        }
    };

    return (
        <div className="App">
        <div className="chat-window">
            <div className="chat-header">
                <p>Live Chat</p>
            </div>
            <div className="chat-body">
                <ScrollToBottom className="message-container">
                {/*Maps over messageList to render each message with conditional styling based on whether the message 
                  author is the current user or someone else.*/}
                    {messageList.map((messageContent, index) => {
                        return (
                            <div
                                key={index}
                                className="message"
                                id={workerName === messageContent.author ? "you" : "other"}
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
                    value={currentMessage}
                    placeholder="Text Message"
                    onChange={(event) => {
                        setCurrentMessage(event.target.value);
                    }}
                    onKeyPress={(event) => {
                        event.key === 'Enter' && sendMessage();
                    }}
                />
                <button onClick={sendMessage}>&#9658;</button>
            </div>
        </div>
        </div>
    );
}

export default Chat;


    /*useEffect(() => {
        //If workerId and workerName are present, it subscribes to the reacive_message event from the Socket.IO server
        //and updates the message list whenever a new message is recieved
        if (freelancerId && freelancerName) {
            const room = `room-${freelancerId}`;
            console.log(`Worker Name: ${freelancerName}`)
            console.log(`Worker Id: ${freelancerId}`)
            socket.on("receive_message", (data) => {
                setMessageList((list) => [...list, data]);
            });
        }
    }, [freelancerId, freelancerName]);*/