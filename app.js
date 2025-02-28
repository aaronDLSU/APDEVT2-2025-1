const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/LabResDB');

const express = require('express');
const app = express();
const path = require('path');
const exphbs = require('express-handlebars');

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static(path.join(__dirname, 'public')));

const User = require("./db/models/DB_users");

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

// Homepage
app.get('/', (req, res) => {
  res.render('homepage', {
    title: "Homepage"
  });
});

//login-signup
app.get('/signup-login', (req,res) => {
  res.render('signup-login', {
    title: "Signup | Login",
    layout: "signup-login"
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

const student = {
  name: "Charlie"
}; 

const labtech = {
  name: "Adrian"
}



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
    res.render('homepage', {
      title: "Homepage",
      student
    });
    console.log(student);
  }else if(email === 'labtech@dlsu.edu.ph' && password === 'labtech'){
    res.render('homepage', {
      title: "Homepage",
      labtech
    });
  }else{
    res.send('Invalid Credentials. <p style="color:blue; text-decoration: underline; display:inline-block" onclick= history.back()>Try Again</p>');
  }
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


//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

