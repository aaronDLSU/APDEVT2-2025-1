require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');


const app = express();
const port = process.env.PORT || 3000;

//Change to public if chaging the folder location
app.use(express.static('root'));

// Template
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./server/routes/main'))