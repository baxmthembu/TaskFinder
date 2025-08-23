const express = require('express');
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
const { check, validationResult } = require('express-validator');
const { error } = require('console');
const connectedUsers = new Map();
const userRooms = new Map();


const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", 'https://baxmthembu.github.io'],
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
    io.to(roomName).emit("receiveLocation", {...location, serviceRequest});
    console.log(`Location sent to ${roomName}`);
  });

  socket.on('updateAvailability', (availabilityData) => {
    console.log('Availability update received:', availabilityData);
    io.emit('receiveAvailability', availabilityData);
  });

  //listen from the frontend so we can emit all the messages that were submitted by the people
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


socket.on('disconnect', async (reason) => {
    console.log(`Disconnected: ${socket.id} (${reason})`);
    
    try {
      const userData = connectedUsers.get(socket.id);
      if (userData?.freelancerId) {
        await db('freelancers')
          .where('id', userData.freelancerId)
          .update({ isavailable: false });
        
        io.emit('availability_changed', {
          freelancerId: userData.freelancerId,
          isAvailable: false,
          reason: 'disconnect'
        });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      connectedUsers.delete(socket.id);
    }
  });

  socket.on('update_availability', async ({ freelancerId, isAvailable }) => {
    try {
      await db('freelancers')
        .where('id', freelancerId)
        .update({ isavailable: isAvailable });
      
      // Broadcast to all clients
      io.emit('availability_changed', {
        freelancerId,
        isAvailable
      });
    } catch (error) {
      console.error('Error updating availability:', error);
    }
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

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);
  });
});


app.use(json());
//app.use(_json())
app.use(urlencoded({ extended: false }));
app.use(cors({
  origin: "http://localhost:3000",
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});
app.use(express.static('public'));
app.use(express.json())

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
  fs.readdir('public/uploads/chat-images', (err, files) => {
    files.forEach(file => {
      if (!file.startsWith('compressed-')) {
        const filePath = `public/uploads/chat-images/${file}`;
        const stat = fs.statSync(filePath);
        if (Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
        }
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



const userAuthenticateToken = (req,res,next) => {
  const token = req.headers['userAuthorization'];

  if(!token) return res.sendStatus(401)

  jwt.verify(token,process.env.JWT_SECRET_KEY, (err,user) => {
    if(err) return res.sendStatus(403);
    req.user = user;
    next();
  })
}

const workerAuthenticateToken = (req,res,next) => {
  const token = req.headers['workerAuthorization']

  if(!token) return res.sendStatus(401)

  jwt.verify(token.process.env.JWT_SECRET_KEY, (err,next) => {
    if(err) return res.sendStatus(403)
      req.user = user;
      next()
  })
}

app.get('/protected', userAuthenticateToken, (req, res) => {
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
      isavailable: worker.isavailable
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
], async (req, res) => {
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
      return res.status(401).json({ msg: 'Authentication Failed' });
    }

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
      await db('user_info')
        .where('id', user.id)
        .update({ latitude, longitude, status: 'online' });

      const token = jwt.sign(
        {id:user.id, name:user.username, role: user.role},
        process.env.JWT_SECRET_KEY,
        {expiresIn: '1h'}
      )

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
          token: token,
          chats: userChats
          // Add other user details if needed
        }
      });
      console.log('User logged in successfuly')
    } else {
      console.log('invalid password')
      // Authentication failed
      res.status(401).json({ msg: 'Authentication Failed' });
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
], async (req, res) => {
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
        //{expiresIn: '1h'}
      )

      res.json({
        msg: 'Authentication Successful',
        user: {
          id: user.id,
          name: user.name,
          status: 'online',
          role: user.role,
          token: token,
          // Add other user details if needed
        }
      });
    } else {
      res.status(401).json({ msg: 'Invalid Credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/workerlogout', async (req, res) => {
  const { freelancerId } = req.body;

  try {
    // Convert freelancerId to a number to ensure it's properly formatted
    const id = Number(freelancerId);

    if (isNaN(id)) {
      throw new Error('Invalid freelancer ID');
    }

    await db('freelancers')
      .where('id', freelancerId)
      .update({
        status: 'offline',
        isavailable: false
      });

    res.json({ msg: 'Logout Successful' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'An error occurred' });
  }
});



app.post('/clientlogout', async (req, res) => {
  const { clientId } = req.body;

  try {
    // Convert freelancerId to a number to ensure it's properly formatted
    const id = Number(clientId);

    if (isNaN(id)) {
      throw new Error('Invalid freelancer ID');
    }

    await db('user_info')
      .where('id', clientId)
      .update({
        status: 'offline',
      });

    res.json({ msg: 'Logout Successful' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'An error occurred' });
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
    // Convert freelancerId to a number to ensure it's properly formatted
    const id = Number(freelancerId);

    if (isNaN(id)) {
      throw new Error('Invalid freelancer ID');
    }

    await db('freelancers')
      .where('id', id)
      .update({
        isavailable: isAvailable
      });

    io.emit('availability_changed', { 
      freelancerId: id, 
      isAvailable 
    });

    /*broadcast({ id: id, isAvailable });*/

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
    // Insert or update the task for this user
    await db('task')
      .insert({
        id: id,
        description: task,
        estimated_duration: time,
        completed: completed,
        created_at: new Date(),
        date_preference: date_preference,
        custom_date: custom_date,
        time_preference: time_preference,
        specific_time: specific_time,
        flexible: is_flexible,
        price_per_hour: price_range
      })
      .onConflict('id') // If task already exists for this user
      .merge(); // Update it instead

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
    const task = await db('task')
      .where('id', req.params.clientId)
      .first();
    
    if (task) {
      return res.json(task);
    }
    return res.status(404).json({ msg: "No task found" });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ msg: "An error occurred" });
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
});

// Save a message
/*app.post('/messages', async (req, res) => {
  const { roomId, senderId, message} = req.body;
  
  try {
    const chat = await db('chat')
      .where({ room_id: roomId })
      .first();
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const [savedMessage] = await db('message')
      .insert({
        chat_id: chat.id,
        sender_id: senderId,
        message: message,
      })
      .returning('*');
    
    // Emit the message via Socket.io
    io.to(roomId).emit('receive_message', {
      id: savedMessage.id,
      sender: senderId,
      message: message,
      timestamp: savedMessage.created_at
    });
    
    res.json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
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
    };

    // Handle image upload
    if (req.file) {
      messageData.message_type = 'image';
      messageData.message = message || 'Shared an image';
      messageData.image_path = req.file.filename; // Store the filename
    }

    // Handle location
    if (latitude && longitude) {
      messageData.message_type = 'location';
      messageData.latitude = latitude;
      messageData.longitude = longitude;
      messageData.message = message || 'Shared location';
    }

    const [savedMessage] = await db('message').insert(messageData).returning('*');
    
    // Format response for Socket.io
    const socketMessage = {
      id: savedMessage.id,
      sender: savedMessage.sender_id.toString(),
      message: savedMessage.message,
      timestamp: savedMessage.created_at,
      type: savedMessage.message_type,
      latitude: savedMessage.latitude,
      longitude: savedMessage.longitude,
      image_path: savedMessage.image_path // Include image path
    };

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

const port = process.env.PORT || 5000
server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
