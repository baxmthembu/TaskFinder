const knex = require('knex');
const express = require('express');
const http = require('http');
//const socketIo = require('socket.io');
const cors = require('cors');
const { json, urlencoded } = require('express');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
//const io = socketIo(server);
const {Server} = require('socket.io')
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
})

app.use(json());
app.use(cors())
  

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
    },
  });

  io.on('connection', (socket) => {
    console.log('a user connected');
    io.on('connection', (socket) => {
        socket.on('join', async ({ clientId, freelancerId }) => {
            try {
                let chatSession = await db('chat_sessions')
                    .where({ client_id: clientId, freelancer_id: freelancerId })
                    .first();
    
                if (!chatSession) {
                    const [newChatSession] = await db('chat_sessions')
                        .insert({ client_id: clientId, freelancer_id: freelancerId })
                        .returning('*');
                    chatSession = newChatSession;
                }
    
                socket.join(`chat_${chatSession.id}`);
            } catch (err) {
                console.error('Error handling join event:', err);
            }
        });
    
        socket.on('chat message', (msg) => {
            const { chatSessionId, senderType, senderId, messageText } = msg;
            // Handle message sending logic here...
        });
    });

    socket.on('chat message', async ({ chatSessionId, senderType, senderId, messageText }) => {
        try {
            const [newMessage] = await db('messages')
                .insert({
                    chat_session_id: chatSessionId,
                    sender_type: senderType,
                    sender_id: senderId,
                    message_text: messageText,
                })
                .returning('*');
    
            io.to(`chat_${chatSessionId}`).emit('chat message', newMessage);
        } catch (err) {
            console.error('Error handling chat message:', err);
        }
    });
    

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3002, () => {
    console.log('listening on port 3002');
});

app.get('/api/chat-session', (req, res) => {
    const { clientId, freelancerId } = req.query;
  
    db('chat_sessions')
      .where({
        client_id: clientId,
        freelancer_id: freelancerId
      })
      .first()
      .then((chatSession) => {
        if (chatSession) {
          res.json(chatSession);
        } else {
          res.status(404).json({ error: 'Chat session not found' });
        }
      })
      .catch((err) => {
        console.error('Error fetching chat session:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });  

  app.get('/api/messages', (req, res) => {
    const { chatSessionId } = req.query;
  
    db('messages')
      .where({ chat_session_id: chatSessionId })
      .orderBy('sent_at', 'asc')
      .then((messages) => {
        res.json(messages);
      })
      .catch((err) => {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  });
  