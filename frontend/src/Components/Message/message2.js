import React, {useEffect, useState} from "react";
import io from 'socket.io-client';
import Chats from "../../Chat";
import './message2.css'

const socket = io.connect('http://localhost:3003');

const Chat = () => {
    const [username, setUsername] = useState("");
    const [room, setRoom] = useState("");
    const [showChat, setShowChat] = useState(false)

    //emit the event ans send the room the user writes into the input and backend
    const joinRoom = () => {
        if(room !== "" && username !== ""){
            socket.emit("join_room", room)
            setShowChat(true)
        }
    }

    
    //function that will run everytime an event is thrown to us on the socket io server.
    //whenever an event is emmited it will run again
    return (
        <div className="App">
            {/*if showChat is equal to false than show Join a chat*/ }
            {!showChat ? (
            <div className="joinChatContainer">
                <input type="text" placeholder="Username" onChange={(event) => {
                    setUsername(event.target.value)
                }} />
                <input type="text" placeholder="Room Number" onChange={(event) => {
                    setRoom(event.target.value);
                }} />
                <button onClick={joinRoom}>Join Room</button>
                {/*<button onClick={sendMessage}>Send</button>*/}
            </div>
            )
            : (
            <Chats socket={socket} username={username} room={room} />
            )}
        </div>
    )
}

//export default Chat