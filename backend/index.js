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

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');
  console.log(`User Connected: ${socket.id}`)

  socket.on('sendLocation', (location) => {
    console.log('Location received:', location);
    // Send the location data to the freelancer
    io.emit('receiveLocation', location);
    // Broadcast the location to all connected clients
    //io.emit('locationUpdate', location);
  });

  socket.on('updateAvailability', (availabilityData) => {
    console.log('Availability update received:', availabilityData);
    io.emit('receiveAvailability', availabilityData);
  });

  socket.on("join_room", (data) => {
    socket.join(data)
    console.log(`User with id: ${socket.id} joined room: ${data}`)
})

  //listen from the frontend so we can emit all the messages that were submitted by the people
  socket.on("send_message", (data) => {
      //to specifies where you wanna emit this event
      socket.to(data.room).emit("recieve_message", data)
        
})        


  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use(json());
//app.use(_json())
app.use(urlencoded({ extended: false }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers');
  next();
});
app.use(express.static('public'));

const db = knex({
  client: 'pg',
  connection: {
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE,
  },
});

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
    const workersData = data.map((worker) => ({
      name: worker.name,
      surname: worker.surname,
      password: worker.password,
      email: worker.email,
      phone: worker.phone,
      username: worker.username,
      id: worker.id,
      latitude: worker.latitude,
      longitude: worker.longitude,
    }));
    res.json(workersData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/login', async (req, res) => {
  const { password, username, latitude, longitude } = req.body;

  if(!username || !password){
    return res.status(400).json({msg:'Please provide both name and password'})
  }

  try {
    const user = await db
      .select('id','password', 'username')
      .from('user_info')
      .where('username',username)
      .first();

    if (!user) {
      return res.status(401).json({ msg: 'Authentication Failed' });
    }

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
      await db('user_info')
        .where('id', user.id)
        .update({ latitude, longitude, status: 'online' });

      res.json({
        msg: 'Authentication Successful',
        user: {
          id: user.id,
          name: user.username,
          status: 'online',
          role: 'client'
          // Add other user details if needed
        }
      });
    } else {
      // Authentication failed
      res.status(401).json({ msg: 'Authentication Failed' });
    }
  } catch (error) {
    console.error('Error:', error);
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
app.post('/workerlogin', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ msg: 'Please provide both name and password' });
  }


  try {
    const user = await db('freelancers')
      .select('id','name','password')
      .where('name', name) // Simplified for demo purposes, use hashed passwords in production
      .first();
      

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
      await db('freelancers')
        .where({ id: user.id })
        .update({ status: 'online' });

      res.json({
        msg: 'Authentication Successful',
        user: {
          id: user.id,
          name: user.name,
          status: 'online',
          role: 'freelancer',
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
      .update({status: 'offline'})

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

const port = 3001
server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
