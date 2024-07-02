const express = require('express');
const multer = require('multer');
const {v2: cloudinary} = require('cloudinary');
const {Pool} = require('pg');
const app = express();
const port = 3001;
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
const ws = require('ws');

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

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db('users').where({ id }).first().then(user => {
    done(null, user);
  }).catch(err => {
    done(err, null);
  });
});

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

const wss = new ws.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

const broadcast = (message) => {
  clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// GET: Fetch all users from the database
app.get('/', (req, res) => {
  db.select('*')
      .from('user_info')
      .where('id', 3)
      .then((data) => {
          console.log(data);
          res.json(data);
      })
      .catch((err) => {
          console.log(err);
      });
});

app.get('/users', (req,res) => {
  db.select('*')
    .from('user_info')
    .then((data) => {
      console.log(data);
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
    })
})

app.get('/searchFreelancers', (req,res) => {
  db.select('*')
    .from('freelancers')
    .where('occupation=${type}')
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.log(err)
    })
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

/*app.get('/workers', async (req, res) => {
  db.select('*')
    .from('freelancers')
    .then((data) => {
      console.log(data);
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
    })
})*/

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


app.post('/login', async (req, res) => {
  const { password, username } = req.body;

  if(!username || !password){
    return res.status(400).json({msg:'Please provide both name and password'})
  }

  try {
    const user = await db
      .select('password', 'username')
      .from('user_info')
      .where('username',username)
      .first();

    if (!user) {
      return res.status(401).json({ msg: 'Authentication Failed' });
    }

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) {
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

// Assuming you have initialized Knex and named the instance as 'knex'

// Endpoint to update freelancer's location
app.post('/api/updateLocation', (req, res) => {
  const { freelancerId, latitude, longitude } = req.body;

  db('freelancers')
    .where('freelancerid', freelancerId)
    .update({
      latitude: latitude,
      longitude: longitude
    })
    .then(() => {
      console.log('Location updated');
      res.send('Location updated');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error updating location');
    });
});

app.post('/location', (req, res) => {
  const { freelancerId, latitude, longitude } = req.body;

  // Insert the freelancer's location into the database
  db('freelancers')
    .where('freelancerid', freelancerId) // Assuming 'id' is the identifier column for freelancers
    .update({
      latitude: latitude,
      longitude: longitude
    })
    .then(() => {
      res.status(200).send('Location updated successfully');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error updating location');
    });
});

app.post('/api/freelancer/location', async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    await db('freelancers').insert({
      latitude: latitude,
      longitude: longitude 
    });

    res.status(201).json({ message: 'Freelancer location saved successfully' });
  } catch (error) {
    console.error('Error saving freelancer location:', error);
    res.status(500).json({ error: 'Error saving freelancer location' });
  }
});

app.get('/locations', (req, res) => {
  db.select('id', 'latitude', 'longitude')
      .from('freelancers')
      .then((data) => {
          res.json(data);
      })
      .catch((err) => {
          console.log('Error fetching locations:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      });
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


// Endpoint to Update Freelancer Status
app.post('/updateStatus', (req, res) => {
  const { freelancerId, status } = req.body;

  db('freelancers')
    .where('id', freelancerId)
    .update({ status })
    .then(() => {
      res.json({ msg: 'Status updated successfully' });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: 'An error occurred' });
    });
});

/*app.post('/workerlogin', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await db
      .select('id', 'name', 'password') // Assuming role distinguishes freelancers from clients
      .from('freelancers')
      .where('name', name)
      .first();

    if (!user) {
      return res.status(401).json({ msg: 'Authentication Failed' });
    }

    const isPasswordValid = await compare(password, user.password);

    if (isPasswordValid) { 
        await db('freelancers')
          .where('id', user.id)
          .update({
            status: 'online'
          })
          .then((data)=> {
            console.log(data.status)
          });

      res.json({ msg: 'Authentication Successful' });
    } else {
      res.status(401).json({ msg: 'Authentication Failed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ msg: 'An error occurred' });
  }
});*/

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

    broadcast({ id: id, isAvailable });

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
