/*
 * Frontend Logic for application
*/

// Container for frontend application
const app = {};

// Config
app.config = {
  sessionToken: false,
};

// AJAX Client (for RESTful API)
app.client = {};

// Interface for making API calls
app.client.request = (headers, path, method, queryStringObject, payload, callback) => {
  // Set defaults
  headers = typeof (headers) === 'object' && headers !== null ? headers : {};
  path = typeof (path) === 'string' ? path : '/';
  method = typeof (method) === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
  queryStringObject = typeof (queryStringObject) === 'object' && queryStringObject !== null ? queryStringObject : {};
  payload = typeof (payload) === 'object' && payload !== null ? payload : {};
  callback = typeof (callback) === 'function' ? callback : false;

  // For each query string parameter sent, add it to the path
  let requestUrl = `${path}?`;
  let counter = 0;

  Object.keys(queryStringObject).forEach((queryKey) => {
    if (Object.hasOwnProperty.call(queryStringObject, queryKey)) {
      counter += 1;
      // If at least one query string parameter has already been added, preprend new ones with an ampersand
      if (counter > 1) {
        requestUrl += '&';
      }
      // Add the key and value
      requestUrl += `${queryKey}=${queryStringObject[queryKey]}`;
    }
  });

  // Form the http request as a JSON type
  const xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader('Content-type', 'application/json');

  // For each header sent, add it to the request
  Object.keys(headers).forEach((headerKey) => {
    if (Object.hasOwnProperty.call(headers, headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  });

  // If there is a current session token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader('token', app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const statusCode = xhr.status;
      const responseReturned = xhr.responseText;

      // Callback if requested
      if (callback) {
        try {
          const parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  };

  // Send the payload as JSON
  const payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
};

function onSubmit(e) {
  // Stop it from submitting
  e.preventDefault();
  const formId = this.id;
  const path = this.action;
  const method = this.method.toUpperCase();

  // Hide the error message (if it's currently shown due to a previous error)
  document.querySelector(`#${formId} .formError`).style.display = 'hidden';

  // Turn the inputs into a payload
  const payload = {};
  const { elements } = this;
  for (let i = 0; i < elements.length; i += 1) {
    if (elements[i].type !== 'submit') {
      const valueOfElement = elements[i].type === 'checkbox' ? elements[i].checked : elements[i].value;
      payload[elements[i].name] = valueOfElement;
    }
  }

  // Call the API
  app.client.request(undefined, path, method, undefined, payload, (statusCode, responsePayload) => {
    // Display an error on the form if needed
    if (statusCode !== 200) {
      // Try to get the error from the api, or set a default error message
      const error = typeof (responsePayload.Error) === 'string' ? responsePayload.Error : 'An error has occured, please try again';

      // Set the formError field with the error text
      document.querySelector(`#${formId} .formError`).innerHTML = error;

      // Show (unhide) the form error field on the form
      document.querySelector(`#${formId} .formError`).style.display = 'block';
    } else {
      // If successful, send to form response processor
      app.formResponseProcessor(formId, payload, responsePayload);
    }
  });
}

// Bind the forms
app.bindForms = () => {
  if (document.querySelector('form')) {
    document.querySelector('form').addEventListener('submit', onSubmit);
  }
};

// Bind the logout button
app.bindLogoutButton = () => {
  document.getElementById('logoutButton').addEventListener('click', (e) => {
    // Stop it from redirecting anywhere
    e.preventDefault();

    // Log the user out
    app.logUserOut();
  });
};

// Log the user out then redirect them
app.logUserOut = () => {
  // Get the current token id
  const tokenId = typeof (app.config.sessionToken.id) === 'string' ? app.config.sessionToken.id : false;

  // Send the current token to the tokens endpoint to delete it
  const queryStringObject = {
    id: tokenId,
  };
  app.client.request(undefined, 'api/tokens', 'DELETE', queryStringObject, undefined, (statusCode, responsePayload) => {
    // Set the app.config token as false
    app.setSessionToken(false);

    // Send the user to the logged out page
    window.location = '/session/deleted';
  });
};

// Form response processor
app.formResponseProcessor = (formId, requestPayload, responsePayload) => {
  const functionToCall = false;
  if (formId === 'accountCreate') {
    // Log in the user
    const newPayload = {
      email: requestPayload.email,
      password: requestPayload.password,
    };

    app.client.request(undefined, 'api/tokens', 'POST', undefined, newPayload, (newStatusCode, newResponsePayload) => {
      if (newStatusCode !== 200) {
        document.querySelector(`#${formId} .formError`).innerHTML = 'Sorry, an error has occured. Please try again.';
        document.querySelector(`#${formId} .formError`).style.display = 'block';
      } else {
        app.setSessionToken(newResponsePayload);
        window.location = '/edit/cart';
      }
    });
  }
  if (formId === 'sessionCreate') {
    app.setSessionToken(responsePayload);
    window.location = '/edit/cart';
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = (token) => {
  app.config.sessionToken = token;
  const tokenString = JSON.stringify(token);
  localStorage.setItem('token', tokenString);
  if (typeof (token) === 'object') {
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = (add) => {
  const target = document.querySelector('body');
  if (add) {
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = () => {
  const tokenString = localStorage.getItem('token');
  if (typeof (tokenString) === 'string') {
    try {
      const token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      if (typeof (token) === 'object') {
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    } catch (e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Renew the token
app.renewToken = (callback) => {
  const currentToken = typeof (app.config.sessionToken) === 'object' ? app.config.sessionToken : false;
  if (currentToken) {
    // Update the token with a new expiration
    const payload = {
      id: currentToken.id,
      extend: true,
    };
    app.client.request(undefined, 'api/tokens', 'PUT', undefined, payload, (statusCode, responsePayload) => {
      // Display an error on the form if needed
      if (statusCode === 200) {
        // Get the new token details
        const queryStringObject = { id: currentToken.id };
        app.client.request(undefined, 'api/tokens', 'GET', queryStringObject, undefined, (newStatusCode, newResponsePayload) => {
          // Display an error on the form if needed
          if (newStatusCode === 200) {
            app.setSessionToken(newResponsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Loop to renew token often
app.tokenRenewalLoop = () => {
  setInterval(() => {
    app.renewToken((err) => {
      if (!err) {
        console.log(`Token renewed successfully @ ${Date.now()}`);
      }
    });
  }, 1000 * 60);
};

// Init (bootstrapping)
app.init = () => {
  // Bind all form submissions
  app.bindForms();

  // Get the token from localStorage
  app.getSessionToken();

  // Bind logout logout button
  app.bindLogoutButton();

  // Renew token
  app.tokenRenewalLoop();
};

// Call the init processes after the window loads
window.onload = () => {
  app.init();
};
