const mongoose = require('mongoose');
const { mongoURI } = require('../config');  // Import config file

const connectDB = async () => {
    try {                                   // Check config.js file
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
