const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const { isObject } = require('util');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["Get", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`)

    //listen to the room thats assigned in the frontend and join it
    socket.on("join_room", (data) => {
        socket.join(data)
        console.log(`User with id: ${socket.id} joined room: ${data}`)
    })

    //listen from the frontend so we can emit all the messages that were submitted by the people
    socket.on("send_message", (data) => {
        //to specifies where you wanna emit this event
        socket.to(data.room).emit("recieve_message", data)
        
    })        

    socket.on("disconnect", () => {
        console.log('User disconnected', socket.id)
    })
})

server.listen(3003, () => {
    console.log("Server is running port 3003")
})