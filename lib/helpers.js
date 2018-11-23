/*
*   Helper methods
*/ 

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const queryString = require('querystring');
const https = require('https');

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
};

// Make payment using stripe
helpers.createPayment = (amountInCents,description,token,callback) => {
    amountInCents = typeof(amountInCents) == 'number' && amountInCents > 0 ? amountInCents : false;
    description = typeof(description) == 'string' && description.trim().length > 0 ? description.trim() : false;
    if(amountInCents && description) {

        // Configure the request payload
        const payload = {
            'amount': amountInCents,
            'currency': config.stripe.currency,
            'description': description,
            'source': token
        };

        // Stringify the payload
        const stringPayload = queryString.stringify(payload);

        // Configure the request details
        const requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.stripe.com',
            'method': 'POST',
            'path': '/v1/charges',
            'auth' : config.stripe.apiKey,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        const req = https.request(requestDetails,(res) => {
            // Grab the status of the sent request
            const status = res.statusCode;
            // Callback successfully if request went through
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was:',statusCode);
            }
        });

        // Bind to the error event so it doesn't get thrown & kills the server
        req.on('error', (e) => {
            callback(e);
        });

        // Add the payload to the request
        req.write(stringPayload);

        // End and send the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }
};

// Send email with mailgun
helpers.sendEmail = (recipient,subject,textContent,callback) => {
    recipient = typeof(recipient) == 'string' && recipient.trim().length > 0 ? recipient.trim() : false;
    subject = typeof(subject) == 'string' && subject.trim().length > 0 ? subject.trim() : false;
    textContent = typeof(textContent) == 'string' && textContent.trim().length > 0 ? textContent.trim() : false;
    
    if(recipient && subject && textContent) {

        // Configure the request payload
        const payload = {
            'from': config.mailgun.from,
            'to': recipient,
            'subject': subject,
            'text': textContent
        };

        // Stringify the payload
        const stringPayload = queryString.stringify(payload);

        // Configure the request details
        const requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.mailgun.net',
            'method': 'POST',
            'path': '/v3/'+config.mailgun.domain+'/messages',
            'auth' : config.mailgun.apiKey,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        const req = https.request(requestDetails,(res) => {
            // Grab the status of the sent request
            const status = res.statusCode;
            // Callback successfully if request went through
            if(status == 200 || status == 201){
                callback(false);
            } else {
                callback('Status code returned was:',statusCode);
            }
        });

        // Bind to the error event so it doesn't get thrown & kills the server
        req.on('error', (e) => {
            callback(e);
        });

        // Add the payload to the request
        req.write(stringPayload);

        // End and send the request
        req.end();

    } else {
        callback('Given parameters were missing or invalid');
    }
};

// Export the module
module.exports = helpers;