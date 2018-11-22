/*
*   Helper methods
*/ 

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for the module
const helpers = {};

// Converts string to JSON Object
helpers.parseJsonToObject = (jsonString) => {
    try {
        const jsonObj = JSON.parse(jsonString);
        return jsonObj;
    } catch(e) {
        return {};
    }
};

// Hashes a given string
helpers.hash = (password) => {
    if(typeof(password) == 'string' && password.length > 0){
        const hashedPassword = crypto.createHmac('sha256',config.hashingSecret).update(password).digest('hex');
        return hashedPassword;
    } else {
        return false;
    }
};

// Create a random string of alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength>0 ? strLength : false;
    if(strLength){
        // Define possible characters that could go in a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';

        // Start the final string
        let str = '';
        for(let i=1; i<=strLength;i++){
            // Get and append a character from the possibleCharacters
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            str += randomCharacter;
        }

        return str;

    } else {
        return false;
    }
}

// Export the module
module.exports = helpers;