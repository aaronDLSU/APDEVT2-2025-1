// Load environment variables from .env file
// .env is local file only and not uploaded in git
require('dotenv').config();

// modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const exphbs = require('express-handlebars');
const connectDB = require('./db/models/connection');             // Import MongoDB connection (connection file)
const mainRoutes = require('./server/routes/main');        // Import all routes (routes file)

const app = express();

<<<<<<< HEAD
const User = require("./db/models/DB_users");
const Reservation = require("./db/models/DB_reservation");
const Labs = require("./db/models/DB_labs");
=======
// Connect to MongoDB
connectDB();
>>>>>>> routes

// Middleware
app.use(express.json());                          // use json
app.use(express.urlencoded({ extended: true })); // files consist of more than strings
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)
app.use(cors());                                //

// Set up Handlebars as the view engine
const hbs = require('hbs');
<<<<<<< HEAD
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'))
hbs.registerPartials(path.join(__dirname, 'views/partials'));

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

const student = {
  name: "Charlie",
  type: "student"
}; 

const labtech = {
  name: "Sir",
  type: "labtech"
}

var user = '';
=======
app.set('view engine', 'hbs');                    // Use Handlebars for templating
app.set('views', path.join(__dirname, 'views'));  // Define the views directory
hbs.registerPartials(path.join(__dirname, 'views/partials')); // Register Handlebars partials
>>>>>>> routes

// Set up Handlebars with a default layout
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'index',       // This makes index.hbs the default layout before login layout
  layoutsDir: 'views/layouts'   // Ensure layouts are stored here
}));

// Use Routes from `main.js`
app.use('/', mainRoutes); // routes moved to `routes/main.js`

<<<<<<< HEAD
//login-signup
app.get('/signup-login', (req,res) => {
  res.render('signup-login', {
    title: "Signup | Login",
    pageStyle: "login-signup",
    pageScripts:["login-signup"],
    layout:"signup-login"
  })
});

app.post('/signup', (req, res) => {
  //console.log('Request Body:', req.body);
  const email = req.body['signup-email']; // Match form name
  const password = req.body['signup-password']; // Match form name
  const role = req.body['signup-role'];

  try {
    User.create({
          email: email,
          password: password,
          role: role// Add role field
      });
      res.redirect('/signup-login');
  } catch (err) {
      console.error('Signup error:', err);
      res.status(500).send('Error creating user');
  }
});


app.post('/login', express.urlencoded({extended:true}), (req, res) => {
  const email = req.body['email-input']; // Match form name
  const password = req.body['password-input']; // Match form name
  const remembered = req.body['login-checkbox'];

  console.log(email);
  console.log(password);

  if (!email || !password) {
    return res.status(400);
  }

  if(email === 'student@dlsu.edu.ph' && password === 'student'){
    user = student;
    res.redirect('/');
    console.log(user);
  }else if(email === 'labtech@dlsu.edu.ph' && password === 'labtech'){
    user = labtech;
    res.redirect('/');
    console.log(user);
  }else{
    res.send('Invalid Credentials. <p style="color:blue; text-decoration: underline; display:inline-block" onclick= history.back()>Try Again</p>');
  }
});

//calendar
app.get('/calendar', (req,res) => {
  res.render('calendar', {
    title: "Reserve your lab room!",
    pageStyle: "calendar",
    pageScripts:["header-dropdowns","calendar"],
    user:user,
    labtech: user.type === 'labtech',
    student: user.type === 'student'
  })
});

//help support
app.get('/help-support', (req,res) => {
  res.render('help-support', {
    title: "Help & Support",
    pageStyle: "help-support",
    pageScripts:["header-dropdowns"],
    user:user,
    labtech: user.type === 'labtech',
    student: user.type === 'student'
  })
});

app.get('/profile', (req,res) => {
  res.render('profile', {
    title: "Profile Page",
    pageStyle: "profile",
    pageScripts:["header-dropdowns"],
    user:user,
    labtech: user.type === 'labtech',
    student: user.type === 'student'
  })
});

//have yet to test
app.get('/reservation-list', isAuthenticated, async (req, res) => {
  try {
    const {room, building, date} = req.query;
    if (!room || !building || !date) {
      res.send("Missing parameters");
    }
    else {
      const roomData = await Labs.findOne({name: room, building: building});

      if (!roomData) {
        res.send("Room not found!");
      }
      else {
        const reservations = await Reservation.find({lab: roomData._id, date: date});

        if (!reservations.length) {
          res.send("No Reservation Found!");
        }
        else {
          res.render('reservation-list', {roomData, reservations, date, cssFile: 'public/css/labtech-reservation-list.css'});
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error loading reservation list');
  }
});

/*WIP
app.get('/edit-reservation', isAuthenticated, function (req, res) {
  try{
    userData = req.session.user;
    if (userData.role === 'labtech') {

    }
    else {

    }
  }
  catch(err){
    res.status(500).send('Error loading edit reservation');
  }
});
*/

/*
app.get('/edit-reservation', (req,res) => {
  res.render('edit-reservation', {
    title: "Edit Reservation",
    pageStyle: "edit-reservation",
    pageScripts:["header-dropdowns", "edit-reservation"],
    user:user,
    labtech: user.type === 'labtech',
    student: user.type === 'student'
  })
});*/

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
=======
// Start Server
const PORT = process.env.PORT || 3000;
                                    // Just for colored text in console log
app.listen(PORT, () => console.log(`\x1b[34mapp.js\x1b[0m : Server running on port ${PORT}`));
>>>>>>> routes
