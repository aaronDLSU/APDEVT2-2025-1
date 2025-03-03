const mongoose = require('mongoose');
const { mongoURI } = require('../../config');  // Import config file

const connectDB = async () => {
    try {                                   // Check config.js file
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
                    //Just coloring for text in console log, 32 for green, 34 for blue
        console.log(`\x1b[34mconnection.js\x1b[0m : MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
