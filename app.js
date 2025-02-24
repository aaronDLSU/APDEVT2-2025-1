const express = require('express');
const app = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const exphbs = require('express-handlebars');

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html', 'css', 'js', 'png', 'jpeg']
}));

const hbs = require('hbs');
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'))
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Set up Handlebars with a default layout
app.engine('hbs', exphbs.engine({ 
  extname: 'hbs', 
  defaultLayout: 'index',  // This makes main.hbs the default layout
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


// Homepage
app.get('/', (req, res) => {
  res.render('homepage', {
    title: "Homepage"
  });
});

//login-signup
app.get('/login-signup', (req,res) => {
  res.render('login-signup', {
    title: "Login | Signup",
    layout: 'login-signup-layout'
  })
});

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

