/*
*   Server Code
*/

// Dependencies
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const handlers = require('./handlers');
const helpers = require('./helpers');
const config = require('./config');

// Container for the module
const server = {};

// Instantite http server
server.httpServer = http.createServer((req,res) => server.unifiedServer(req,res));

// Instantite https server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, (req,res) => server.unifiedServer(req,res));

// Unified Server Code
server.unifiedServer = (req,res) => {

    // Get the trimmed path
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g,'');
    // Get query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = req.headers;

    // Get the payload if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', data => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // Choosing the handler based on router
        const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // Constructing data object
        const data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        // Call the chosenHandler
        chosenHandler(data, (statusCode, payload) => {

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            const payloadString = JSON.stringify(payload);

            // Sending the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log(statusCode, payloadString);
        });
    });
};

// Router
server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'menu' : handlers.menu,
    'cart' : handlers.cart,
    'checkout' : handlers.checkout
};

// Init 
server.init = () => {
    // Start the http server
    server.httpServer.listen(config.httpPort, () => console.log('\x1b[36m%s\x1b[0m','The server is listening on port'+config.httpPort));
    
    // Start the https server
    server.httpsServer.listen(config.httpsPort, () => console.log('\x1b[35m%s\x1b[0m','The server is listening on port'+config.httpsPort));
};

// Export the module
module.exports = server;