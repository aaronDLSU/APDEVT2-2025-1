const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/LabReservationDB')

const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');

const path = require('path');


const hbs = require('hbs');
app.set('view engine', 'hbs');
const exphbs = require("express-handlebars");
app.engine('hbs', require('exphbs'));

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static('public'));// Serve static files from the 'root' directory

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


// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'root', 'html', 'signup-homepage.html'));
});

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

