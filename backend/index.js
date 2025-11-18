const express = require('express');
const fs = require('fs');
const multer = require('multer');
const {v2: cloudinary} = require('cloudinary');
const {Pool} = require('pg');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
require('dotenv').config();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');
const { json, urlencoded } = require('express');
const { diskStorage } = require('multer');
const { hash, compare } = require('bcrypt');
const { extname } = require('path');
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
//console.log(secret);
const session = require('express-session');
const passport = require('passport');
const http = require('http')
const socketIo = require('socket.io')
const server = http.createServer(app)
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { check, validationResult } = require('express-validator');
const { error } = require('console');
const connectedUsers = new Map();
const userRooms = new Map();
const isProduction = process.env.NODE_ENV === 'production';
const rateLimit = require('express-rate-limit');


const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://baxmthembu.github.io",
      "https://taskify.co.za",
      "https://www.taskify.co.za"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
   pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false
});

const validateRoomName = (room) => {
  const parts = room.split('-');
  if (parts.length !== 2) return false;
  return parts.every(id => typeof id === 'string' && id.length > 0);
};

const updateFreelancerAvailability = async (freelancerId, isAvailable) => {
  try {
    await db('freelancers')
      .where('id', freelancerId)
      .update({ isavailable: isAvailable, status: isAvailable ? 'online' : 'offline' });

    console.log(`Freelancer ${freelancerId} availability updated to ${isAvailable}`);

    // Broadcast the change to all connected clients
    io.emit('freelancer-status-changed', {
      freelancerId,
      isAvailable,
    });
    
  } catch (error) {
    console.error(`Error updating availability for freelancer ${freelancerId}:`, error);
  }
};



io.on('connection', (socket) => {
  console.log('New client connected');
  console.log(`User Connected: ${socket.id}`)

  /*new*/
  const userData = {
    id: null, // Will be set when user authenticates
    type: null, // 'client' or 'freelancer'
    rooms: new Set(),
    connectedAt: Date.now()
  };

  connectedUsers.set(socket.id, userData);
  
  // Handle authentication
  socket.on('authenticate', ({ userId, userType }) => {
    userData.id = userId;
    userData.type = userType;
    
    // Join user-specific room
    const userRoom = `${userType}-${userId}`;
    socket.join(userRoom);
    userData.rooms.add(userRoom);
    
    console.log(`User ${userId} (${userType}) authenticated`);

    // Notify client of successful auth
    socket.emit('authentication_success', { userId, userType });
  });

  //custom socket event you're emitting from the freelancer side
  //put that freelancers socket into private room with specific name freelancer-${freelancerId}
  //allow backend to target specific freelancer when needed
  socket.on("join_freelancer_room", (freelancerId) => {
    try {
      if (!freelancerId) throw new Error('Missing freelancerId');
      
      const roomName = `freelancer-${freelancerId}`;
      socket.join(roomName);
      socket.freelancerId = freelancerId;
      
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        userData.freelancerId = freelancerId;
        userData.rooms.add(roomName);
      }
      
      console.log(`Freelancer ${freelancerId} joined room ${roomName}`);
    } catch (error) {
      console.error('Error in join_freelancer_room:', error);
    }
  });


  socket.on("sendLocation", ({ location, freelancerId, serviceRequest }) => {
    const roomName = `freelancer-${freelancerId}`;
    io.to(roomName).emit("receiveLocation", { ...location, serviceRequest });
    console.log(`Location and service request sent to ${roomName}`);
});

  //listen from the frontend so we can emit all the messages th"at were submitted by the people
  socket.on("send_message", (data) => {
    console.log(`Message received in room ${data.room}:`, data);
    // Emit to the specific room
    io.to(data.room).emit("receive_message", data);
  });

/*new*/
socket.on('mark_as_read', async ({ messageId, room }) => {
  try {
    await db('message')
      .where({ id: messageId })
      .update({ is_read: true });
    
    io.to(room).emit('message_read', { messageId });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
});


 socket.on("request_to_join", ({ client, room, workerId }) => {
    // Send request to freelancer only
    io.emit("request_to_join", { client, room, workerId });
  });

  // In your Node.js backend
socket.on("freelancer_decision", async ({ clientId, workerId, decision, room }) => {
  try {
    // Verify both users exist first
    const [client, freelancer] = await Promise.all([
      db('user_info').where('id', clientId).first(),
      db('freelancers').where('id', workerId).first()
    ]);

    if (!client || !freelancer) {
      throw new Error('Client or freelancer not found');
    }

    if (decision === "accepted") {
      // Create or get existing chat
      const [chat] = await db('chat')
        .insert({
          client_id: clientId,
          freelancer_id: workerId,
          client_name: client.name,
          freelancer_name: freelancer.name,
          room_id: room
        })
        .onConflict('room_id')
        .merge()
        .returning('*');

      io.to(room).emit("chat_created", chat);

      const clientSocket = Array.from(io.sockets.sockets.values()).find(
        s => s.userId === clientId
      );

      if (clientSocket) {
        clientSocket.emit('chat_created', chat);
        clientSocket.join(room);
      } else {
        console.log(`Client ${clientId} not connected`);
      }

      const freelancerSocket = Array.from(io.sockets.sockets.values()).find(
        s => s.userId === workerId
      );
    
      if (freelancerSocket) {
        freelancerSocket.emit('chat_created', chat);
        freelancerSocket.join(room);
      }
    }

    io.to(room).emit("freelancer_decision", { 
      clientId, 
      workerId, 
      decision, 
      room 
    });
  } catch (error) {
    console.error('Error handling freelancer decision:', error);
    // Send error back to sender
    socket.emit('chat_error', { error: error.message });
  }
});


// Add this new handler for joining multiple rooms
socket.on("join_chat_room", (room) => {
  // Leave only other chat rooms, not notification rooms
  const roomsToLeave = [...socket.rooms].filter(r => 
    r !== socket.id && 
    r !== `client-${socket.userId}` && 
    r !== `freelancer-${socket.userId}` &&
    r.startsWith('chat-')
  );
  
  roomsToLeave.forEach(r => socket.leave(r));
  
  socket.join(room);
  console.log(`User ${socket.userId} joined chat room ${room}`);
});

socket.on("join_room", async (data, callback) => {
  const room = typeof data === "string" ? data : data.room;
  if (!room) {
    console.error(`Failed to join room: invalid room data`, data);
    return;
  }

  // Only join the new room without leaving others
  socket.join(room);
  console.log(`User ${socket.id} joined room ${room}`);

  // Notify client of successful room join
  if (callback) callback({ success: true });

  // Force refresh the chat list
  const userId = socket.userId;
  if (userId) {
    socket.emit("refresh_chats", { userId });
  }
});

socket.on('leave_specific_room', (room) => {
  socket.leave(room);
  const userData = connectedUsers.get(socket.id);
  if (userData) {
    userData.rooms.delete(room);
  }
  console.log(`User left room ${room}`);
});


// Add this new handler
socket.on("request_chat_update", (userId) => {
  // Force client to refresh their chat list
  socket.emit("refresh_chats", { userId });
});

socket.on('leave_room', (room) => {
    socket.leave(room);
    userData.rooms.delete(room);
    if (userRooms.has(socket.id)) {
      userRooms.get(socket.id).delete(room);
    }
  });


  socket.on('freelancer-offline', async ({ freelancerId }) => {
    if (freelancerId) {
      console.log(`freelancer-offline event received for freelancer ID: ${freelancerId}`);
      await updateFreelancerAvailability(freelancerId, false);
    }
  });

  socket.on('disconnect', async (reason) => {
    console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
    // The freelancerId is attached to the socket object upon authentication/identification
    if (socket.freelancerId) {
      console.log(`Freelancer ${socket.freelancerId} disconnected.`);
      await updateFreelancerAvailability(socket.freelancerId, false);
    }
    connectedUsers.delete(socket.id);
  });

  socket.on('update_availability', ({ freelancerId, isAvailable }) => {
    updateFreelancerAvailability(freelancerId, isAvailable);
  });

  // Store freelancer ID when they identify themselves
  
  socket.on('freelancer_identify', async (freelancerId) => {
    try {
      // Store freelancer ID on the socket
      socket.freelancerId = freelancerId;
      
      // Get current availability status from DB
      const freelancer = await db('freelancers')
        .where('id', freelancerId)
        .first();
      
      if (freelancer) {
        // Notify all clients of current status
        io.emit('availability_changed', {
          freelancerId,
          isAvailable: freelancer.isavailable
        });
      }
    } catch (error) {
      console.error('Error identifying freelancer:', error);
    }
  });

  socket.on('create_chat', async ({ clientId, freelancerId, clientName, freelancerName, room }) => {
  try {
    const [chat] = await db('chat')
      .insert({
        client_id: clientId,
        freelancer_id: freelancerId,
        client_name: clientName,
        freelancer_name: freelancerName,
        room_id: room,
        updated_at: db.fn.now()
      })
      .onConflict('room_id')
      .merge()
      .returning('*');

    // Notify both parties
    io.to(room).emit('chat_created', chat);
    io.to(`user_${clientId}`).emit('chat_created', chat);
    io.to(`user_${freelancerId}`).emit('chat_created', chat);
  } catch (error) {
    console.error('Error creating chat:', error);
  }
});

  setInterval(() => {
    io.emit('heartbeat', { timestamp: Date.now() });
  }, 30000); // Every 30 seconds


  socket.on('accept_task', async ({ room, task }) => {
    const clientId = room.split('-').find(id => id != socket.freelancerId);
    try {
        const currentTask = await db('task').where({ task_id: task.id }).first();
        if (currentTask.status === 'pending') {
            await db('task').where({ task_id: task.id }).update({ status: 'accepted', freelancer_id: socket.freelancerId });
            io.to(room).emit('task_accepted', task);
            if(clientId) {
                const freelancer = await db('freelancers').where({ id: socket.freelancerId }).first();
                const message = `${freelancer.name} ${freelancer.surname} has accepted your '${task.description}' task.`;
                io.to(`client-${clientId}`).emit('task_accepted_notification', { message });
                io.to(`client-${clientId}`).emit('update_task_counter', { action: 'increment' });
            }
        } else {
            socket.emit('task_already_accepted', { message: 'This task has already been accepted.' });
        }
    } catch(error) {
      console.error('Error accepting task:', error);
    }
  });

  socket.on('decline_task', async ({ room, taskId }) => {
    const clientId = room.split('-').find(id => id != socket.freelancerId);
    io.to(room).emit('task_declined', { taskId });
    if(clientId) {
        const freelancer = await db('freelancers').where('id', socket.freelancerId).first();
        const task = await db('task').where('task_id', taskId).first();
        const message = `${freelancer.name} ${freelancer.surname} has declined your '${task.description}' task.`;
        io.to(`client-${clientId}`).emit('task_declined_notification', { message });
    }
  });

  socket.on('finish_task', async ({ room, taskId }) => {
      const clientId = room.split('-').find(id => id != socket.freelancerId);
      try {
          await db('task').where({ task_id: taskId }).update({ status: 'finished' });

          const task = await db('task').where({ task_id: taskId }).first();
          const user = await db('user_info').where({ id: clientId }).first();
          const freelancer = await db('freelancers').where({ id: socket.freelancerId }).first();

          await db('history').insert({
              task_id: taskId,
              user_id: user.id,
              freelancer_id: freelancer.id,
              task_title: task.description,
              date_finished: new Date(),
              amount: task.price_per_hour,
          });

          io.to(room).emit('task_finished', { task });
          if(clientId) {
              const message = `Task '${task.description}' was marked as finished.`;
              io.to(`client-${clientId}`).emit('task_finished_notification', { message, task });
              io.to(`client-${clientId}`).emit('task_updated', task);
          }
      } catch (error) {
          console.error('Error finishing task:', error);
      }
  });
});


app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://baxmthembu.github.io',
    'https://taskify.co.za',
    'https://www.taskify.co.za'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json());
app.use('/chat-images', express.static('public/chat-images'));

/*new*/
app.use('/uploads', express.static('public/uploads', {
  maxAge: '365d',
  immutable: true,
  setHeaders: (res, path) => {
    if (path.includes('compressed-')) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

setInterval(() => {
  fs.readdir('public/chat-images', (err, files) => {
    if (err) {
      console.error("Failed to read chat-images directory:", err);
      return;
    }
    files.forEach(file => {
      if (!file.startsWith('compressed-')) {
        const filePath = path.join('public/chat-images', file);
        fs.stat(filePath, (statErr, stat) => {
          if (statErr) {
            console.error(`Failed to get stats for file ${filePath}:`, statErr);
            return;
          }
          if (Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`Failed to delete file ${filePath}:`, unlinkErr);
              }
            });
          }
        });
      }
    });
  });
}, 24 * 60 * 60 * 1000); // Run daily

/*const db = knex({
  client: 'pg',
  connection: {
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE,
  },
});*/

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
});



console.log('Using DATABASE_URL:', process.env.DATABASE_URL);


const storage = diskStorage({
  destination: (req,file,cb) => {
    cb(null, 'public/images')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage
})

const chatImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/chat-images');
  },
  filename: (req, file, cb) => {
    cb(null, 'chat_' + Date.now() + path.extname(file.originalname));
  }
});

const uploadChatImage = multer({ storage: chatImageStorage });

//loginLimiter helps protect against abuse such as brute force attacks or excessive API requests
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes amount of time to retry again
  max: 5, // Limit each IP to 5 login requests per 10 minutes
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res) => {
    res.status(429).json({
        message: 'Too many requests, please try again later.',
    });
},
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = req.cookies.token || (authHeader && authHeader.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  });
};

app.get('/protected', authenticateToken, (req, res) => {
  res.send('This is a protected route');
});

//POST: Post user info into database
app.post('/register', async (req, res) => {
  const {name,surname,password,email,phone,username,latitude,longitude} = req.body;
  try {
     // Hash the password using bcrypt
     const hashedPassword = await hash(password, 10); // 10 is the number of salt rounds

     // Insert the user data with the hashed password into the database
     await db('user_info').insert({
       name: name,
       surname: surname,
       password: hashedPassword, // Store the hashed password
       email: email,
       phone: phone,
       username: username,
       latitude: latitude,
       longitude: longitude,
       role: 'client',
     });
 
     console.log('Registration successful');
     return res.json({ msg: 'Registration successful' });
   } catch (error) {
     console.error('Error:', error);
     return res.status(500).json({ msg: 'An error occurred' });
   }
})

app.post('/registerWorker',upload.single('images'), async (req, res) => {
  const {name,surname,password,email,phone,occupation,latitude,longitude} = req.body;
  const images = /*req.file ? req.file.filename:null;*/ req.file.filename;

  if (!password || password.trim() === '') {
    return res.status(400).json({ msg: 'Password is required' });
  }

  try{
    const hashedPassword = await hash(password, 10); // 10 is the number of salt rounds

    if (!req.file) {
      // No image was provided
      return res.status(400).json({ msg: 'No image selected' });
    }


    await db('freelancers').insert({
      name: name,
      surname: surname,
      password: hashedPassword, // Store the hashed password
      email: email,
      phone: phone,
      occupation: occupation,
      latitude: latitude,
      longitude: longitude,
      images: images,
      status: 'offline',
      role: 'freelancer',
      isavailable: false
    });

    console.log('Registration successful');
     return res.json({ msg: 'Registration successful' })
    }catch (error) {
     console.error('Error:', error);
     return res.status(500).json({ msg: 'An error occurred' });
    }
})

app.post('/imageupload', async(req,res) => {
  const {cloudinary_url} = req.body

  try {
    await db('freelancers').insert({
      cloudinaryPublicId: cloudinary_url
    }); 
    console.log('Image data saved to database')
    return res.json({ msg: 'Image data saved to database'})
  }catch (err) {
    console.error('An error occurred ', err)
    return res.status(500).json({ msg: 'An error occurred' });
  }
})

// index.js
app.get('/clientlocation', async(req, res) => {
  try {
    const clientId = req.query.clientId
    if (!clientId) {
      return res.status(400).json({ msg: 'Client ID is required' });
    }
    const clientLocation = await db('user_info')
      .select('id', 'latitude', 'longitude')
      .where('id', clientId)
      .first();
      
    if (!clientLocation) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    return res.json(clientLocation);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'An error occurred' });
  }
});

app.get('/workers', async (req, res) => {
  try {
    const data = await db.select('*').from('freelancers');
    const workersData = data.map((worker) => ({
      id: worker.id,
      name: worker.name,
      surname: worker.surname,
      password: worker.password,
      email: worker.email,
      phone: worker.phone,
      occupation: worker.occupation,
      latitude: worker.latitude,
      longitude: worker.longitude,
      images: worker.images.toString('base64'), // Convert Buffer to base64 if 'image' is a Buffer
      // Add other properties as needed
      status: worker.status,
      isavailable: worker.isavailable,
      rating: worker.rating
    }));
    res.json(workersData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/clients', async (req, res) => {
  try {
    const data = await db.select('*').from('user_info');
    const clientsData = data.map((worker) => ({
      name: worker.name,
      surname: worker.surname,
      password: worker.password,
      email: worker.email,
      phone: worker.phone,
      username: worker.username,
      id: worker.id,
      latitude: worker.latitude,
      longitude: worker.longitude,
      role: worker.role
    }));
    res.json(clientsData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Assuming you have already configured `db` with Knex
// Route: GET /freelancers/:id

app.get("/workers/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const data = await db.select("*").from("freelancers").where({ id });

    if (data.length === 0) {
      return res.status(404).json({ error: "Freelancer not found" });
    }

    res.json(data[0]); // Return the freelancer object
  } catch (error) {
    console.error("Error fetching freelancer:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Add this route in your index.js
app.get('/clients/:id', async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await db('user_info')
      .where({ id: clientId, role: 'client' })
      .first();
    
    if (client) {
      res.json({
        name: client.name,
        surname: client.surname,
        id: client.id
        // Add other fields you need
      });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/login',[
  check('username').isLength({min:3}).trim().escape(),
  check('password').isLength({min:6}).trim()
], loginLimiter, async (req, res) => {
  console.log('log in endpoint hit')
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log('validation errors: ', errors.array())
    return res.status(400).json({errors: errors.array()})
  }

  const { password, username, latitude, longitude } = req.body;
  console.log('request body:', req.body)

  if(!username || !password){
    console.log('missing credintials')
    return res.status(400).json({msg:'Please provide both name and password'})
  }
  console.log('Login request body:', req.body);
  console.log("This is a test log")
  try {
    const user = await db
      .select('id','password', 'username','role')
      .from('user_info')
      .where({username})
      .first();

      console.log('testing db connection')
      await db.raw('select 1+1 as result')
      console.log('db connection ok')

    if (!user) {
      console.log('user not found')
      return res.status(401).json({ msg: 'Invalid username or password' });
    }

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
      await db('user_info')
        .where('id', user.id)
        .update({ latitude, longitude, status: 'online' });

      const token = jwt.sign(
        {id:user.id, name:user.username, role: user.role},
        process.env.JWT_SECRET_KEY,
        {expiresIn: '4h'}
      )

      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 4 * 60 * 60 * 1000 // 4 hours
      });

      const userChats = await db('chats')
        .where('client_id', user.id)
        .orWhere('freelancer_id', user.id)
        .orderBy('created_at', 'desc');


      console.log('login successful')

      res.json({
        msg: 'Authentication Successful',
        user: {
          id: user.id,
          name: user.username,
          status: 'online',
          role: user.role,
          //token: token,
          chats: userChats
          // Add other user details if needed
        }
      });
      console.log('User logged in successfuly')
    } else {
      console.log('invalid password')
      // Authentication failed
      res.status(401).json({ msg: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error:', error);
    console.log("This is a test log")
    res.status(500).json({ msg: 'An error occurred' });
  }
});


app.get('/nearbyWorkers', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Define a radius for nearby workers (in meters)
    const radius = 1000;

    // Use the ST_DWithin function provided by PostGIS to find nearby workers
    const query = `
      SELECT * FROM workers
      WHERE ST_DWithin(
        ST_GeographyFromText('POINT(${longitude} ${latitude})'),
        location::geography,
        ${radius}
      )
    `;

    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error retrieving nearby workers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Login Endpoint
app.post('/workerlogin',[
  check('name').isLength({min:3}).trim().escape(),
  check('password').isLength({min: 6}).trim(),
],loginLimiter, async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()})
  }

  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ msg: 'Please provide both name and password' });
  }


  try {
    const user = await db('freelancers')
      .select('id','name','password','role')
      .where('name', name) // Simplified for demo purposes, use hashed passwords in production
      .first();
      

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
      await db('freelancers')
        .where({ id: user.id })
        .update({ status: 'online' });

      const token = jwt.sign(
        {id: user.id, name: user.name, role: user.role},
        process.env.JWT_SECRET_KEY,
        {expiresIn: '4h'}
      )

      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 4 * 60 * 60 * 1000 // 4 hours
      });

      res.json({
        msg: 'Authentication Successful',
        user: {
          id: user.id,
          name: user.name,
          status: 'online',
          role: user.role,
          //token: token,
          // Add other user details if needed
        }
      });
    } else {
      res.status(401).json({ msg: 'Invalid name or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

      if (decoded.role === 'client') {
        await db('user_info')
          .where('id', decoded.id)
          .update({ status: 'offline' });
      } else if (decoded.role === 'freelancer') {
        await db('freelancers')
          .where('id', decoded.id)
          .update({ status: 'offline', isavailable: false });
        
        // Notify all clients that this freelancer is now offline
        io.emit('freelancer-status-changed', {
          freelancerId: decoded.id,
          isAvailable: false,
        });
      }
    }
  } catch (error) {
    // Ignore errors if token is invalid or expired
    console.error('Error during logout:', error.message);
  } finally {
    // Always clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
      domain: process.env.NODE_ENV === "production" ? '.taskify.co.za' : undefined,
    }).json({ msg: 'Logout Successful' });
  }
});

// Assuming you have a configured Express app and a database connection

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/available', async (req, res) => {
  const { freelancerId, isAvailable } = req.body;

  try {
    const id = Number(freelancerId);

    if (isNaN(id)) {
      throw new Error('Invalid freelancer ID');
    }

    await updateFreelancerAvailability(id, isAvailable);

    res.json({ msg: 'Availability status updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'An error occurred' });
  }
});

app.get('/freelancer/:id/availability', async (req, res) => {
  const { id } = req.params;

  try {
    const freelancer = await db('freelancers')
      .where('id', id)
      .select('isavailable')
      .first();

    if (freelancer) {
      res.json({ isAvailable: freelancer.isavailable });
    } else {
      res.status(404).json({ msg: 'Freelancer not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'An error occurred' });
  }
});

app.delete('/freelancers/:freelancerId', async (req, res) => {
  const freelancerId = parseInt(req.params.freelancerId, 10);

  if (isNaN(freelancerId)) {
    return res.status(400).json({ message: 'Invalid freelancer ID' });
  }

  try {
    const deletedUser = await db('freelancers').where('id', freelancerId).del();

    if (deletedUser) {
      res.status(200).json({ message: 'Freelancer deleted successfully' });
    } else {
      res.status(404).json({ message: 'Freelancer not found' });
    }
  } catch (error) {
    console.error('Error deleting freelancer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/clients/:clientId', async(req,res) => {
  const clientId = parseInt(req.params.clientId, 10)
  if(isNaN(clientId)){
    return res.status(400).json({message: 'Invalid client ID'})
  }

  try{
    const deletedUser = await db('user_info').where('id', clientId).del()

    if(deletedUser) {
      res.status(200).json({message: 'User deleted successfully'})
    }else{
      res.status(404).json({message: 'User not found'})
    }
  }catch (error) {
    console.error('Error deleting user:', error)
    return res.status(400).json({message: 'Internal server error'})
  }
})

app.put('/freelancers/:freelancerId/status', async (req, res) => {
  const freelancerId = parseInt(req.params.freelancerId, 10);

  if (isNaN(freelancerId)) {
    return res.status(400).json({ message: 'Invalid freelancer ID' });
  }

  try {
    await db('freelancers')
      .where('id', freelancerId)
      .update({
        status: 'offline',
        isavailable: false,
      });

    res.status(200).json({ message: 'Freelancer status updated to offline' });
  } catch (error) {
    console.error('Error updating freelancer status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/tasks', async (req, res) => {
    const { id, task, time, completed,date_preference,custom_date,time_preference,specific_time,is_flexible,price_range } = req.body;

    try {
        await db('task')
            .insert({
                client_id: id, // Use client_id instead of id
                description: task,
                estimated_duration: time,
                completed: completed,
                created_at: new Date(),
                date_preference: date_preference,
                custom_date: custom_date,
                time_preference: time_preference,
                specific_time: specific_time,
                flexible: is_flexible,
                price_per_hour: price_range,
                status: 'pending'
            });

        console.log("Task submitted successfully");
        return res.json({ success: true, msg: "Task submitted successfully" });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, msg: "An error occurred" });
    }
});

// Add this endpoint to fetch tasks
app.get('/tasks/:clientId', async (req, res) => {
    try {
        const tasks = await db('task')
            .where('client_id', req.params.clientId)
            .select('*');

        if (tasks.length) {
            return res.json(tasks);
        }
        return res.status(404).json({ msg: "No task found" });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ msg: "An error occurred" });
    }
});

app.get('/task-details/:clientId', async (req, res) => {
    const { clientId } = req.params;
    try {
        const tasks = await db('task').where({ client_id: clientId });
        if (!tasks.length) {
            return res.status(200).json([]);
        }

        const taskDetails = await Promise.all(tasks.map(async (task) => {
            const freelancer = task.freelancer_id ? await db('freelancers').where({ id: task.freelancer_id }).first() : null;
            return { task, freelancer };
        }));
        
        res.json(taskDetails);

    } catch (error) {
        console.error('Error fetching task details:', error);
        res.status(500).json({ msg: "An error occurred" });
    }
});

app.post('/tasks/:taskId/complete', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await db('task').where({ task_id: taskId }).first();
    if(task){
      await db('task').where({ task_id: taskId }).update({ completed: true });
      // Emit to a room specific to the client
      io.to(`client-${task.client_id}`).emit('task_completed', { taskId });
      res.json({ success: true, msg: "Task marked as complete" });
    } else {
      res.status(404).json({ success: false, msg: "Task not found" });
    }
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ success: false, msg: "An error occurred" });
  }
});

app.post('/tasks/:taskId/pay', async (req, res) => {
    const { taskId } = req.params;
    const { clientId } = req.body;
    try {
        await db('task').where({ task_id: taskId }).update({ status: 'paid' });

        const task = await db('task').where({ task_id: taskId }).first();
        const user = await db('user_info').where({ id: clientId }).first();

        await db('payment').insert({
            task_id: taskId,
            user_id: user.id,
            amount: task.price_per_hour,
        });

        await db('history').insert({
            task_id: taskId,
            user_id: user.id,
            freelancer_id: task.freelancer_id,
            task_title: task.description,
            date_finished: new Date(),
            amount: task.price_per_hour,
        });

        io.to(`client-${clientId}`).emit('update_task_counter', { action: 'decrement' });
        res.json({ success: true, msg: "Payment successful" });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, msg: "An error occurred" });
    }
});

app.get('/tasks/:clientId/in-progress-count', async (req, res) => {
    const { clientId } = req.params;
    try {
        const count = await db('task')
            .where({ client_id: clientId, status: 'in-progress' })
            .count('task_id as count')
            .first();
        res.json(count);
    } catch (error) {
        console.error('Error fetching in-progress task count:', error);
        res.status(500).json({ error: 'Failed to fetch in-progress task count' });
    }
});
app.post('/tasks/:taskId/rate', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { rating, comments } = req.body;
    const { id: userId } = req.user; // Assuming user ID is in the token

    try {
        // 1. Find the task and check if the user is authorized to rate it
        const task = await db('task').where({ task_id: taskId, client_id: userId }).first();

        if (!task) {
            return res.status(404).json({ msg: 'Task not found or you are not authorized to rate it.' });
        }
        
        // Prevent re-rating
        if (task.rating !== null) {
            return res.status(400).json({ msg: 'This task has already been rated.' });
        }

        // 2. Update the task with the new rating and comments
        await db('task')
            .where({ task_id: taskId })
            .update({
                rating: rating,
                comments: comments,
            });
        
        const freelancerId = task.freelancer_id;
        if (!freelancerId) {
             // Handle case where there is no freelancer associated, although this should not happen for a completed task
            return res.json({ success: true, msg: "Rating submitted successfully." });
        }

        // 3. Recalculate freelancer's average rating
        const result = await db('task')
            .where({ freelancer_id: freelancerId })
            .andWhereNotNull('rating')
            .avg('rating as averageRating')
            .first();

        const newAverageRating = result.averageRating ? parseFloat(result.averageRating).toFixed(2) : 0;

        // 4. Update the freelancer's rating
        await db('freelancers')
            .where({ id: freelancerId })
            .update({ rating: newAverageRating });

        // 5. Emit real-time updates
        io.emit('new_rating', {
            freelancerId,
            newAverageRating,
        });

        // Also fetch the new comment to broadcast
         const ratedTask = await db('task')
            .select(
                'task.comments',
                'user_info.name as user_name'
             )
            .join('user_info', 'task.client_id', 'user_info.id')
            .where('task.task_id', taskId)
            .first();
            
        io.emit('new_comment', {
            freelancerId: freelancerId,
            comment: ratedTask.comments,
            userName: ratedTask.user_name,
        });


        res.json({ success: true, msg: "Rating submitted successfully." });

    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ success: false, msg: "An error occurred while submitting the rating." });
    }
});

app.get('/freelancers/:freelancerId/comments', async (req, res) => {
    const { freelancerId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const comments = await db('task')
            .select(
                'task.comments',
                'task.rating',
                'user_info.name as user_name',
                'task.created_at'
            )
            .join('user_info', 'task.client_id', 'user_info.id')
            .where({ 'task.freelancer_id': freelancerId })
            .andWhereNotNull('task.comments')
            .orderBy('task.created_at', 'desc')
            .limit(limit)
            .offset(offset);
        
        const totalComments = await db('task')
            .where({ freelancer_id: freelancerId })
            .andWhereNotNull('comments')
            .count('task_id as count')
            .first();

        res.json({
            comments,
            total: totalComments.count,
            page: Number(page),
            limit: Number(limit)
        });

    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ msg: 'An error occurred while fetching comments.' });
    }
});

app.get('/history/:userType/:userId', async (req, res) => {
    const { userType, userId } = req.params;
    try {
        let query = db('history');
        if (userType === 'client') {
            query = query.where({ user_id: userId }).join('freelancers', 'history.freelancer_id', 'freelancers.id').select('history.*', 'freelancers.name as freelancer_name', 'freelancers.images as freelancer_image');
        } else if (userType === 'freelancer') {
            query = query.where({ freelancer_id: userId }).join('user_info', 'history.user_id', 'user_info.id').select('history.*', 'user_info.name as user_name');
        }
        const history = await query;
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Create or get chat room
app.post('/chats', async (req, res) => {
  const { clientId, freelancerId, clientName, freelancerName } = req.body;
  const roomId = [clientId, freelancerId].sort().join('-');

  try {
    // Upsert chat (create or update if exists)
    const [chat] = await db('chat')
      .insert({
        client_id: clientId,
        freelancer_id: freelancerId,
        client_name: clientName,
        freelancer_name: freelancerName,
        room_id: roomId,
        updated_at: db.fn.now()
      })
      .onConflict('room_id')
      .merge()
      .returning('*');

    // Notify both parties
    io.to(roomId).emit('new_chat_created', chat);
    
    // Also emit to individual user sockets
    io.to(`user_${clientId}`).emit('new_chat_created', chat);
    io.to(`user_${freelancerId}`).emit('new_chat_created', chat);
    
    res.json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});


app.get('/chats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const conversations = await db('chat')
      .select(
        'chat.*',
        'freelancers.name as freelancer_name',
        'freelancers.surname as freelancer_surname',
        'freelancers.images as freelancer_images',
        'user_info.name as client_name',
        'user_info.surname as client_surname'
      )
      .leftJoin('freelancers', 'chat.freelancer_id', 'freelancers.id')
      .leftJoin('user_info', 'chat.client_id', 'user_info.id')
      .where('chat.client_id', userId)
      .orWhere('chat.freelancer_id', userId)
      .orderBy('chat.created_at', 'desc');

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get messages for a chat
/*app.get('/chats/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const chat = await db('chat').where({ room_id: roomId }).first();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const messages = await db('message')
      .where({ chat_id: chat.id })
      .select(
        'message.*',
        //db.raw('sender_id as sender') // Ensure this is named 'sender' to match frontend
        db.raw('CAST(sender_id AS TEXT) as sender')
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(messages.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});*/
app.get('/chats/:roomId/messages', async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const chat = await db('chat').where({ room_id: roomId }).first();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const messages = await db('message')
      .where({ chat_id: chat.id })
      .select(
        'message.*',
        db.raw('CAST(sender_id AS TEXT) as sender')
      )
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Save a message
/*app.post('/messages', uploadChatImage.single('image'), async (req, res) => {
  const { roomId, senderId, message, latitude, longitude } = req.body;
  
  try {
    const chat = await db('chat')
      .where({ room_id: roomId })
      .first();
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    let messageData = {
      chat_id: chat.id,
      sender_id: senderId,
      message: message || '',
      message_type: 'text',
    };

    // Handle image upload
    if (req.file) {
      messageData.message_type = 'image';
      messageData.message = message || 'Shared an image';
      messageData.image_path = req.file.filename;
    }

    // Handle location
    if (latitude && longitude) {
      messageData.message_type = 'location';
      messageData.latitude = latitude;
      messageData.longitude = longitude;
      messageData.message = message || 'Shared location';
    }

    const [savedMessage] = await db('message')
      .insert(messageData)
      .returning('*');
    
    // Format the response for Socket.io
    const socketMessage = {
      id: savedMessage.id,
      sender: savedMessage.sender_id.toString(),
      message: savedMessage.message,
      timestamp: savedMessage.created_at,
      type: savedMessage.message_type,
      latitude: savedMessage.latitude,
      longitude: savedMessage.longitude,
      image_path: savedMessage.image_path,
      room: roomId // Add room to the message
    };

    // Emit the message via Socket.io to the room
    io.to(roomId).emit('receive_message', socketMessage);
    
    res.json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/api/chats/:roomId/participants', async (req, res) => {
  try {
    const chat = await db('chat')
      .where({ room_id: req.params.roomId })
      .first();
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    res.json({
      clientId: chat.client_id,
      freelancerId: chat.freelancer_id,
      clientName: chat.client_name,
      freelancerName: chat.freelancer_name
    });
  } catch (error) {
    console.error('Error fetching chat participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});*/
app.post('/messages', uploadChatImage.single('chatImage'), async (req, res) => {
  const { roomId, senderId, message, latitude, longitude } = req.body;
  
  try {
    const chat = await db('chat').where({ room_id: roomId }).first();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    let messageData = {
      chat_id: chat.id,
      sender_id: senderId,
      message: message || '',
      message_type: 'text',
      is_read: false
    };

    // Handle image upload and location
    if (req.file) {
      messageData.message_type = 'image';
      messageData.message = message || 'Shared an image';
      messageData.image_path = req.file.filename;
    }

    if (latitude && longitude) {
      messageData.message_type = 'location';
      messageData.latitude = latitude;
      messageData.longitude = longitude;
      messageData.message = message || 'Shared location';
    }

    const [savedMessage] = await db('message').insert(messageData).returning('*');
    
    // Format the response for Socket.io
    const socketMessage = {
      id: savedMessage.id,
      sender: savedMessage.sender_id.toString(),
      message: savedMessage.message,
      timestamp: savedMessage.created_at,
      type: savedMessage.message_type,
      latitude: savedMessage.latitude,
      longitude: savedMessage.longitude,
      image_path: savedMessage.image_path,
      room: roomId,
      is_read: savedMessage.is_read
    };

    // Emit the message via Socket.io to the room
    io.to(roomId).emit('receive_message', socketMessage);
    
    // Also emit a notification event to update unread counts
    const recipientId = senderId == chat.client_id ? chat.freelancer_id : chat.client_id;
    
    // Get updated unread counts for the recipient
    const unreadCounts = await db('message')
      .join('chat', 'message.chat_id', 'chat.id')
      .select(
        'chat.room_id',
        db.raw('COUNT(*) as unread_count')
      )
      .where(function() {
        this.where('chat.client_id', recipientId).orWhere('chat.freelancer_id', recipientId);
      })
      .andWhere('message.sender_id', '!=', recipientId)
      .andWhere('message.is_read', false)
      .groupBy('chat.room_id');
    
    // Convert to a simple object
    const countsObj = {};
    let totalUnread = 0;
    
    unreadCounts.forEach(item => {
      const count = parseInt(item.unread_count);
      countsObj[item.room_id] = count;
      totalUnread += count;
    });
    
    // Emit notification to the recipient
    io.to(`user_${recipientId}`).emit('new_notification', {
      roomId,
      unreadCount: countsObj[roomId] || 0,
      totalUnread
    });
    
    res.json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Add a function to get unread count for a user
// Update the getUnreadCount function to be more reliable
async function getUnreadCount(userId) {
  try {
    const result = await db('message')
      .join('chat', 'message.chat_id', 'chat.id')
      .where(function() {
        this.where('chat.client_id', userId).orWhere('chat.freelancer_id', userId);
      })
      .andWhere('message.sender_id', '!=', userId)
      .andWhere('message.is_read', false)
      .count('* as unread_count')
      .first();
    
    return parseInt(result.unread_count) || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Add a new endpoint to get unread counts per conversation
app.get('/chats/:userId/unread-counts', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const unreadCounts = await db('message')
      .join('chat', 'message.chat_id', 'chat.id')
      .select(
        'chat.room_id',
        db.raw('COUNT(*) as unread_count')
      )
      .where(function() {
        this.where('chat.client_id', userId).orWhere('chat.freelancer_id', userId);
      })
      .andWhere('message.sender_id', '!=', userId)
      .andWhere('message.is_read', false)
      .groupBy('chat.room_id');
    
    // Convert to a simple object
    const countsObj = {};
    unreadCounts.forEach(item => {
      countsObj[item.room_id] = parseInt(item.unread_count);
    });
    
    res.json(countsObj);
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
});

app.post('/messages/mark-read', async (req, res) => {
  const { roomId, userId } = req.body;
  
  try {
    const chat = await db('chat').where({ room_id: roomId }).first();
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    // Mark all messages in this chat as read for this user
    await db('message')
      .update({ is_read: true })
      .where('chat_id', chat.id)
      .andWhere('sender_id', '!=', userId);
    
    // Get updated unread count
    const unreadCount = await getUnreadCount(userId);
    
    // Emit notification update
    io.to(`user_${userId}`).emit('notification_update', { unreadCount });
    
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

app.get('/api/user-image/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is client or freelancer
    let user = await db('user_info').where('id', userId).first();
    let userType = 'client';
    
    if (!user) {
      user = await db('freelancers').where('id', userId).first();
      userType = 'freelancer';
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      imageUrl: user.images || 'default-avatar.png',
      userType
    });
  } catch (error) {
    console.error('Error fetching user image:', error);
    res.status(500).json({ error: 'Failed to fetch user image' });
  }
});


// Validation endpoint to check if user is authenticated
app.get('/validate', authenticateToken, async (req, res) => {
  // If authenticateToken middleware succeeds, req.user is populated.
  const { id, role } = req.user;
  let user;

  try {
    if (role === 'client') {
      user = await db('user_info')
        .select('id', 'username as name', 'role', 'status')
        .where('id', id)
        .first();
    } else if (role === 'freelancer') {
      user = await db('freelancers')
        .select('id', 'name', 'role', 'status', 'isavailable')
        .where('id', id)
        .first();
    }

    if (!user) {
      // This case should be rare if token is valid but user is not in DB
      return res.status(404).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: user
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ authenticated: false, error: 'Internal server error' });
  }
});


const port = process.env.PORT || 3001
server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
