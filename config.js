// For connection.js , connection to MongoDB 
module.exports = {
    mongoURI: process.env.MONGO_URI,        // MongoDB URL
    port: process.env.PORT || 5000,         // Default port
    sessionKey: process.env.SESSION_SECRET  // For using sessions
};
