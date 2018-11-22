/*
*   Primary file for the API
*/

// Dependencies
const server = require('./lib/server');
//const workers = require('./lib/workers');

// Container for the app
const app = {};

// Init function
app.init = () => {
    // Start server and background workers
    server.init();
    //workers.init();
};

// Execute init function
app.init();

// Export the app
module.exports = app;