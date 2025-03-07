// app.js file
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

//DB
const labRoutes = require("./server/routes/lab_routes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());                          // use json
app.use(express.urlencoded({ extended: true })); // files consist of more than strings
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)
app.use(cors());                                //

// Routes
app.use("/labs", labRoutes); // Mount the lab routes

// Set up Handlebars as the view engine
const hbs = require('hbs');
app.set('view engine', 'hbs');                    // Use Handlebars for templating
app.set('views', path.join(__dirname, 'views'));  // Define the views directory
hbs.registerPartials(path.join(__dirname, 'views/partials')); // Register Handlebars partials

// Set up Handlebars with a default layout
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'index',       // This makes index.hbs the default layout before login layout
  layoutsDir: 'views/layouts',   // Ensure layouts are stored here
  helpers: {
    formatDate: function(date) { //hbs helper to format Date into String
      console.log(date)
      if (!date) return "";
      return new Date(date).toDateString();
    },
    eq: function (a, b) {
      return a === b;
    }
  }
}));

// Use Routes from `main.js`
app.use('/', mainRoutes); // routes moved to `routes/main.js`

// Start Server
const PORT = process.env.PORT || 3000;
                                    // Just for colored text in console log
app.listen(PORT, () => console.log(`\x1b[34mapp.js\x1b[0m : Server running on port ${PORT}`));