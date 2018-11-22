/*
*   Request Handlers
*/

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Container for the module
const handlers = {};

// Users handler
handlers.users = (data,callback) => {
    const allowedMethods = ['post','put','delete'];
    if(allowedMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};

// Users - post
// Required data - fullName, email, streetAddress, password
// Optional data - none
handlers._users.post = (data, callback) => {
    const fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? data.payload.tosAgreement : false;

    console.log(fullName,email,streetAddress,password,tosAgreement,data.payload);
    if(fullName && email && streetAddress && password && tosAgreement){
        _data.read('users',email,(err,data) => {
            if(err){
                // Hash the password
                const hashedPassword = helpers.hash(password);

                // Store the user
                if(hashedPassword) {
                    const obj = {
                        'fullName':fullName,
                        'email': email,
                        'streetAddress':streetAddress,
                        'hashedPassword':hashedPassword,
                        'tosAgreement':true
                    };

                    _data.create('users', email, obj, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error':'Could not create new user'});
                        }
                    });
                } else {
                    callback(500, {'Error':'Could not hash user password'});
                }
            } else {
                callback(400, {'Error': 'User with that email already exists'});
            }
        })
    } else {
        callback(400, {'Error': 'Missing required fields'});
    }
};

// Users - put
// Required data: email
// Optional data: fullName, streetAdress, password (at least one req.)
handlers._users.put = (data, callback) => {
    // Check the required field
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    // Check for optional field
    const fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
    const streetAddress = typeof(data.payload.streetAddress) == 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    
    if(email){
        // Error if nothing is available to update
        if(fullName || streetAddress || password){

            // Get the token from the headers
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that token matches email
            handlers.tokens.verifyToken(token, email,(tokenIsValid) => {
                if(tokenIsValid){
                    // Look up the user
                    _data.read('users',email,(err,userData) => {
                        if(!err && userData){
                            // Update the necessary fields
                            if(fullName) {
                                userData.fullName = fullName;
                            }
                            if(streetAddress) {
                                userData.streetAddress = streetAddress;
                            }
                            if(password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new update
                            _data.update('users', email, userData, (err) => {
                                if(!err){
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, {'Error': 'Could not update the user'});
                                }
                            });
                        } else {
                            callback(400, {'Error': 'The specified user does not exist'});
                        }
                    });
                } else {
                    callback(403, {'Error': 'Missing required token in header, or token is invalid'});
                }
            });
            
        } else {
            callback(400, {'Error':'Missing field to update'});
        }
    } else {
        callback(400, {'Error':'Missing required field'});
    }
};

// Users - delete
// Required data: email
handlers._users.delete = (data, callback) => {
    // Check that the email is valid
    const email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if(email) {

        // Get the token from the headers
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that token matches email
        handlers.tokens.verifyToken(token, email,(tokenIsValid) => {
            if(tokenIsValid){
                _data.read('users', email, (err, userData) => {
                    if(!err && userData) {
                        _data.delete('users',email,(err) => {
                            if(!err){
                                callback(200);
                            } else {
                                callback(500, {'Error': 'Could not delete the specified user'});
                            }
                        });
                    } else {
                        callback(400, {'Error':'Could not find the specified user'});
                    }
                });
            } else {
                callback(403, {'Error': 'Missing required token in header, or token is invalid'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};

// Tokens
handlers.tokens = (data, callback) => {
    const acceptableMethods = ['post','delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data,callback);
    } else {
        callback(405);
    }
};

// Container for the tokens submethods
handlers._tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    const email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    console.log(email,password);
    if(email && password){
        // Looking the user that matches the email
        _data.read('users',email,(err,userData) => {
            if(!err && userData) {
                // Hash the sent password and compare
                const hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // Create a token with random name. Exp date is 1 hour
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now() + 1000*60*60;
                    const tokenObject = {
                        'id': tokenId,
                        'email':email,
                        'expires': expires
                    };

                    // Store the token
                    _data.create('tokens',tokenId, tokenObject, (err) => {
                        if(!err){
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error':'Could not create new token'});
                        }
                    });
                } else {
                    callback(400,{'Error':'Password did not match the specified user\'s stored password'});
                }
            } else {
                callback(400, {'Error':'Could not find the specified user'});
            }
        });
    } else {
        callback(400, {'Error':'Missing Required fields'});
    }
};

// Tokens - delete
// Required data - id
// Optional Data - none
handlers._tokens.delete = (data, callback) => {
    // Check that the id is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        _data.read('tokens', id, (err, data) => {
            if(!err && data) {
                _data.delete('tokens',id,(err) => {
                    if(!err){
                        callback(200);
                    } else {
                        callback(500, {'Error': 'Could not delete the specified token'});
                    }
                });
            } else {
                callback(400, {'Error':'Could not find the specified token'});
            }
        });
    } else {
        callback(400, {'Error': 'Missing required field'})
    }
};

// Verify if a given token id is currently valid for a given user
handlers.tokens.verifyToken = (id, email, callback) => {
    // Lookup the token
    _data.read('tokens',id,(err, tokenData) => {
        if(!err && tokenData){
            // Check that the token is for the given user and has not expired
            if(tokenData.email == email && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Ping handler
handlers.ping = (data, callback) => callback(200);

// Not Fonund Handler
handlers.notFound = (data, callback) => callback(404);

// Export the module
module.exports = handlers;