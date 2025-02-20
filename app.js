const express = require('express');
const path = require('path');
const app = express();
const exphbs = require("express-handlebars");
const hbs = require('hbs');

app.use(express.json()) // use json
app.engine('hbs', require('exphbs'));
app.set('view engine', 'hbs');


// Serve static files from the 'root' directory
app.use(express.static(path.join(__dirname, 'root')));
console.log(__dirname);

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'root', 'html', 'signup-homepage.html'));
});

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

