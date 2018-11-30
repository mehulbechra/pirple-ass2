/*
*   Primary file for the API
*/

// Dependencies
const server = require('./lib/server');
const cli = require('./lib/cli');

// Container for the app
const app = {};

// Init function
app.init = () => {
  // Start server and background workers
  server.init();

  // AT last start the cli
  setTimeout(() => {
    cli.init();
  }, 50);
};

// Execute init function
app.init();

// Export the app
module.exports = app;
