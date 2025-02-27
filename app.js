const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/LabResDB');

const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static(path.join(__dirname, 'public')));

const User = require("./db/models/database");

const hbs = require('hbs');
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'))
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Set up Handlebars with a default layout
app.engine('hbs', exphbs.engine({ 
  extname: 'hbs', 
  defaultLayout: 'index',  // This makes index.hbs the default layout before login layout
  layoutsDir: 'views/layouts' // Ensure layouts are stored here
}));

app.use(
  session({
    secret: "secret-key",
    resave:false,
    saveUninitialized: false
  })  
);

app.use(cookieParser());

const isAuthenticated = (req,res,next) => {
  if(req.session.user){
    next();
  }else{
    res.redirect("/login");
  }
};

app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  console.log('Request Body:', req.body); // Log raw body
  next();
});

// Homepage
app.get('/', (req, res) => {
  res.render('homepage', {
    title: "Homepage"
  });
});

//login-signup
app.get('/signup-login', (req,res) => {
  res.render('signup-login', {
    title: "Signup | Login"
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

app.post('/login', async(req, res) => {
  const email = req.body['email-input']; // Match form name
  const password = req.body['password-input']; // Match form name
  const remembered = req.body['login-checkbox'];
  const user = await User.findOne({email:email, password: password});
  console.log('hello:'+ user);
  res.render('homepage',{
    user,
    title: "Homepage"
  });
});


//calendar
app.get('/calendar', (req,res) => {
  res.render('calendar', {
    title: "Reserve your lab room!"
  })
});

//help support
app.get('/help-support', (req,res) => {
  res.render('help-support', {
    title: "Help & Support"
  })
});

//student profile
app.get('/profile', (req,res) => {
  res.render('student-profile', {
    title: "Profile",
    layout: "student-login"
  }, function(err, user) {
    if (err) {
        console.error('Error creating user:', err);
        res.status(500).send('Internal Server Error');
    } else {
        res.redirect('/');
    }
});
});

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

