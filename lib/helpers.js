/*
*   Helper methods
*/

// Dependencies
const crypto = require('crypto');
const queryString = require('querystring');
const https = require('https');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Container for the module
const helpers = {};

// Converts string to JSON Object
helpers.parseJsonToObject = (jsonString) => {
  try {
    const jsonObj = JSON.parse(jsonString);
    return jsonObj;
  } catch (e) {
    return {};
  }
};

// Hashes a given string
helpers.hash = (password) => {
  if (typeof (password) === 'string' && password.length > 0) {
    const hashedPassword = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
    return hashedPassword;
  }
  return false;
};

// Create a random string of alphanumeric characters of a given length
helpers.createRandomString = (strLength) => {
  strLength = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define possible characters that could go in a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890';

    // Start the final string
    let str = '';
    for (let i = 1; i <= strLength; i += 1) {
      // Get and append a character from the possibleCharacters
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }

    return str;
  }
  return false;
};

// Make payment using stripe
helpers.createPayment = (amountInCents, description, token, callback) => {
  amountInCents = typeof (amountInCents) === 'number' && amountInCents > 0 ? amountInCents : false;
  description = typeof (description) === 'string' && description.trim().length > 0 ? description.trim() : false;
  if (amountInCents && description) {
    // Configure the request payload
    const payload = {
      amount: amountInCents,
      currency: config.stripe.currency,
      description,
      source: token,
    };

    // Stringify the payload
    const stringPayload = queryString.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.stripe.com',
      method: 'POST',
      path: '/v1/charges',
      auth: config.stripe.apiKey,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const { statusCode: status } = res;
      // Callback successfully if request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback('Status code returned was:', status);
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
helpers.sendEmail = (recipient, subject, textContent, callback) => {
  recipient = typeof (recipient) === 'string' && recipient.trim().length > 0 ? recipient.trim() : false;
  subject = typeof (subject) === 'string' && subject.trim().length > 0 ? subject.trim() : false;
  textContent = typeof (textContent) === 'string' && textContent.trim().length > 0 ? textContent.trim() : false;

  if (recipient && subject && textContent) {
    // Configure the request payload
    const payload = {
      from: config.mailgun.from,
      to: recipient,
      subject,
      text: textContent,
    };

    // Stringify the payload
    const stringPayload = queryString.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.mailgun.net',
      method: 'POST',
      path: `/v3/${config.mailgun.domain}/messages`,
      auth: config.mailgun.apiKey,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const { statusCode: status } = res;
      // Callback successfully if request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback('Status code returned was:', status);
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

// Get the string content of a template
helpers.getTemplate = (templateName, data, callback) => {
  templateName = typeof (templateName) === 'string' && templateName.length > 0 ? templateName : false;
  data = typeof (data) === 'object' && data !== null ? data : {};
  if (templateName) {
    const templatesDir = path.join(__dirname, '/../templates/');
    fs.readFile(`${templatesDir + templateName}.html`, 'utf-8', (err, str) => {
      if (!err && str && str.length > 0) {
        // Do interpolation on string
        const finalString = helpers.interpolate(str, data);
        callback(false, finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('Valid template name was not specified');
  }
};

// Add the header and footer to a string, and pass provided data object to the header and footer for interpolation
helpers.addUniversalTemplates = (str, data, callback) => {
  // Get Header
  helpers.getTemplate('_header', data, (headerErr, headerString) => {
    if (!headerErr && headerString) {
      // Get the footer
      helpers.getTemplate('_footer', data, (footerErr, footerString) => {
        if (!footerErr && footerString) {
          const fullString = headerString + str + footerString;
          callback(false, fullString);
        } else {
          callback('Could not find the footer string');
        }
      });
    } else {
      callback('Could not find the header template');
    }
  });
};

// Take a string and a data object and find/replace all the keys within it
helpers.interpolate = (str, data) => {
  str = typeof (str) === 'string' && str.length > 0 ? str : '';
  data = typeof (data) === 'object' && data !== null ? data : {};

  // Add the template globals to data object, prepending their key name with global
  Object.keys(config.templateGlobals).forEach((keyName) => {
    if (Object.prototype.hasOwnProperty.call(config.templateGlobals, keyName)) {
      data[`global.${keyName}`] = config.templateGlobals[keyName];
    }
  });

  // For each key in the data object, insert its value into the string at the corresponding placeholder
  Object.keys(data).forEach((key) => {
    const replace = data[key];
    const find = `{${key}}`;
    str = str.replace(find, replace);
  });

  return str;
};

// Get the contents of static asset
helpers.getStaticAsset = (fileName, callback) => {
  fileName = typeof (fileName) === 'string' && fileName.length > 0 ? fileName : false;
  if (fileName) {
    const publicDir = path.join(__dirname, '/../public/');
    fs.readFile(publicDir + fileName, (err, data) => {
      if (!err && data) {
        callback(false, data);
      } else {
        callback('No file could be found');
      }
    });
  } else {
    callback('Valid file name was not specified');
  }
};

// Export the module
module.exports = helpers;
