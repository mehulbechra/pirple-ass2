/*
*   Request Handlers
*/

/* eslint-disable no-console,no-lonely-if */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Container for the module
const handlers = {};

/*
*   HTML Handlers
*/

// Index handler
handlers.index = (data, callback) => {
  // Reject request other than GET
  if (data.method === 'get') {
    // Prepare data for interpolation
    const templateData = {
      'head.title': 'Pizza on the rocks - Free Delivery',
      'head.description': 'Cheeseburst pizzas delivered at your door step',
      'body.class': 'index',
    };

    // Read index template as string
    helpers.getTemplate('index', templateData, (indexErr, indexStr) => {
      if (!indexErr && indexStr) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(indexStr, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Create Account handler
handlers.accountCreate = (data, callback) => {
  // Reject request other than GET
  if (data.method === 'get') {
    // Prepare data for interpolation
    const templateData = {
      'head.title': 'Create an Account',
      'head.description': 'Signup is easy and only takes a few seconds.',
      'body.class': 'accountCreate',
    };

    // Read index template as string
    helpers.getTemplate('accountCreate', templateData, (accCreateErr, accCreateStr) => {
      if (!accCreateErr && accCreateStr) {
        // Add the universal header and footer
        helpers.addUniversalTemplates(accCreateStr, templateData, (err, str) => {
          if (!err && str) {
            callback(200, str, 'html');
          } else {
            callback(500, undefined, 'html');
          }
        });
      } else {
        callback(500, undefined, 'html');
      }
    });
  } else {
    callback(405, undefined, 'html');
  }
};

// Favicon Handler
handlers.favicon = (data, callback) => {
  // Reject request other than GET
  if (data.method === 'get') {
    // Read in the favicons data
    helpers.getStaticAsset('favicon.ico', (err, faviconData) => {
      if (!err && faviconData) {
        callback(200, faviconData, 'favicon');
      } else {
        callback(500);
      }
    });
  } else {
    callback(405);
  }
};

// Public Assets
handlers.public = (data, callback) => {
  // Reject request other than GET
  if (data.method === 'get') {
    // Get the fileName being requesting
    const trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
    if (trimmedAssetName.length > 0) {
      // Read in the assets data
      helpers.getStaticAsset(trimmedAssetName, (err, assetData) => {
        if (!err && assetData) {
          // Determine the content type; default to plain text
          let contentType = 'plain';

          if (trimmedAssetName.indexOf('.css') > -1) {
            contentType = 'css';
          }
          if (trimmedAssetName.indexOf('.png') > -1) {
            contentType = 'png';
          }
          if (trimmedAssetName.indexOf('.jpeg') > -1) {
            contentType = 'jpg';
          }
          if (trimmedAssetName.indexOf('.ico') > -1) {
            contentType = 'favicon';
          }

          // Callback the data
          callback(200, assetData, contentType);
        } else {
          callback(404);
        }
      });
    } else {
      callback(404);
    }
  } else {
    callback(405);
  }
};


/*
*   JSON API Handlers
*/

// Users handler
handlers.users = (data, callback) => {
  const allowedMethods = ['post', 'put', 'delete'];
  if (allowedMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
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
  const fullName = typeof (data.payload.fullName) === 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
  const email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  const streetAddress = typeof (data.payload.streetAddress) === 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof (data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? data.payload.tosAgreement : false;

  if (fullName && email && streetAddress && password && tosAgreement) {
    _data.read('users', email, (readErr) => {
      if (readErr) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Store the user
        if (hashedPassword) {
          const obj = {
            fullName,
            email,
            streetAddress,
            hashedPassword,
            tosAgreement: true,
          };

          _data.create('users', email, obj, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not create new user' });
            }
          });
        } else {
          callback(500, { Error: 'Could not hash user password' });
        }
      } else {
        callback(400, { Error: 'User with that email already exists' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Users - put
// Required data: email
// Optional data: fullName, streetAdress, password (at least one req.)
handlers._users.put = (data, callback) => {
  // Check the required field
  const email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  // Check for optional field
  const fullName = typeof (data.payload.fullName) === 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
  const streetAddress = typeof (data.payload.streetAddress) === 'string' && data.payload.streetAddress.trim().length > 0 ? data.payload.streetAddress.trim() : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email) {
    // Error if nothing is available to update
    if (fullName || streetAddress || password) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
      // Verify that token matches email
      handlers.tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          // Look up the user
          _data.read('users', email, (readErr, userData) => {
            if (!readErr && userData) {
              // Update the necessary fields
              if (fullName) {
                userData.fullName = fullName;
              }
              if (streetAddress) {
                userData.streetAddress = streetAddress;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new update
              _data.update('users', email, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the user' });
                }
              });
            } else {
              callback(400, { Error: 'The specified user does not exist' });
            }
          });
        } else {
          callback(403, { Error: 'Missing required token in header, or token is invalid' });
        }
      });
    } else {
      callback(400, { Error: 'Missing field to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - delete
// Required data: email
handlers._users.delete = (data, callback) => {
  // Check that the email is valid
  const email = typeof (data.queryStringObject.email) === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that token matches email
    handlers.tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', email, (readErr, userData) => {
          if (!readErr && userData) {
            _data.delete('users', email, (err) => {
              if (!err) {
                callback(200);
              } else {
                callback(500, { Error: 'Could not delete the specified user' });
              }
            });
          } else {
            callback(400, { Error: 'Could not find the specified user' });
          }
        });
      } else {
        callback(403, { Error: 'Missing required token in header, or token is invalid' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
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
  const email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    // Looking the user that matches the email
    _data.read('users', email, (readErr, userData) => {
      if (!readErr && userData) {
        // Hash the sent password and compare
        const hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.hashedPassword) {
          // Create a token with random name. Exp date is 1 hour
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            id: tokenId,
            email,
            expires,
          };
          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: 'Could not create new token' });
            }
          });
        } else {
          callback(400, { Error: 'Password did not match the specified user\'s stored password' });
        }
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing Required fields' });
  }
};

// Tokens - delete
// Required data - id
// Optional Data - none
handlers._tokens.delete = (data, callback) => {
  // Check that the id is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('tokens', id, (readErr, userData) => {
      if (!readErr && userData) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified token' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the specified token' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Verify if a given token id is currently valid for a given user email
handlers.tokens.verifyToken = (id, email, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email === email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Menu
handlers.menu = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the menu submethods
handlers._menu = {};

// Menu - get
// Required data: email
// Optional data: none
handlers._menu.get = (data, callback) => {
  // Check that the email is valid
  const email = typeof (data.queryStringObject.email) === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    // Verify that token matches phone
    handlers.tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('menu', 'menu', (err, userData) => {
          if (!err && userData) {
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: 'Missing required token in header, or token is invalid' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Cart Handler
handlers.cart = (data, callback) => {
  const acceptableMethods = ['get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the cart submethods
handlers._cart = {};

// Cart - put
// Required data - itemId, quantity
// Optional data - none
handlers._cart.put = (data, callback) => {
  const itemId = typeof (data.payload.itemId) === 'string' && data.payload.itemId.trim().length > 0 ? data.payload.itemId.trim() : false;
  const quantity = typeof (data.payload.quantity) === 'string' && data.payload.quantity >= 0 ? data.payload.quantity : false;

  if (itemId && quantity) {
    // Get the token from headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    // Lookup the user by reading the token
    _data.read('tokens', token, (readTokenErr, tokenData) => {
      if (!readTokenErr && tokenData) {
        const userEmail = tokenData.email;

        _data.read('users', userEmail, (readUserErr, userData) => {
          if (!readUserErr && userData) {
            // User Exists, verifying token validity
            handlers.tokens.verifyToken(token, userEmail, (tokenIsValid) => {
              if (tokenIsValid) {
                const cart = typeof (userData.cart) === 'object' && userData.cart instanceof Array ? userData.cart : [];

                // Get the menuData
                _data.read('menu', 'menu', (err, menuData) => {
                  if (!err && menuData) {
                    // Get the itemObj if correct
                    const itemObj = menuData.find(item => item.itemId === itemId);
                    if (itemObj) {
                      // Check if itemObj exists in cart
                      const userItemObj = cart.find(item => item.itemId === itemId);

                      if (userItemObj) {
                        // itemObj already exists, simply change quantity or delete if quantity = 0
                        if (quantity === 0) {
                          cart.splice(cart.findIndex(item => item.itemId === itemId), 1);
                          userData.cart = cart;
                        } else {
                          userItemObj.quantity = quantity;
                        }
                      } else {
                        // itemObj doesn't exist, add quantity to itemObj and push
                        if (quantity !== 0) {
                          itemObj.quantity = quantity;
                          userData.cart = cart;
                          userData.cart.push(itemObj);
                        }
                      }

                      // Update the new userData
                      _data.update('users', userEmail, userData, (updateErr) => {
                        if (!updateErr) {
                          callback(200);
                        } else {
                          callback(500, { Error: 'Could not update the user object with cart' });
                        }
                      });
                    } else {
                      callback(400, { Error: 'Could not find the item id' });
                    }
                  } else {
                    callback(500, { Error: 'Could not get menu data' });
                  }
                });
              } else {
                callback(403, { Error: 'Token has expired' });
              }
            });
          } else {
            callback(400, { Error: 'Could not find the user' });
          }
        });
      } else {
        callback(400, { Error: 'Missing token in header or invalid token' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Cart - get
// Required Data: none
// Optional Data: none
handlers._cart.get = (data, callback) => {
  const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

  // Lookup the user by reading the token
  _data.read('tokens', token, (readTokenErr, tokenData) => {
    if (!readTokenErr && tokenData) {
      const userEmail = tokenData.email;
      handlers.tokens.verifyToken(token, userEmail, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', userEmail, (readUserErr, userData) => {
            if (!readUserErr && userData) {
              callback(200, userData.cart);
            } else {
              callback(400, { Error: 'Could not find the user' });
            }
          });
        } else {
          callback(400, { Error: 'Token has expired' });
        }
      });
    } else {
      callback(403, { Error: 'Missing required token in header, or token is invalid' });
    }
  });
};

// Cart - delete (deletes all items)
// Required Data: none
// Optional Data: none
handlers._cart.delete = (data, callback) => {
  const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;

  // Lookup the user by reading the token
  _data.read('tokens', token, (readTokenErr, tokenData) => {
    if (!readTokenErr && tokenData) {
      const userEmail = tokenData.email;

      // Check if token is valid
      handlers.tokens.verifyToken(token, userEmail, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', userEmail, (readUserErr, userData) => {
            if (!readUserErr && userData) {
              // Remove all items from cart
              userData.cart = [];
              _data.update('users', userEmail, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not remove items from cart' });
                }
              });
            } else {
              callback(400, { Error: 'Could not find the user' });
            }
          });
        } else {
          callback(400, { Error: 'Token has expired' });
        }
      });
    } else {
      callback(403, { Error: 'Missing required token in header, or token is invalid' });
    }
  });
};

// Checkout Handler
handlers.checkout = (data, callback) => {
  const acceptableMethods = ['post'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checkout[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the checkout submethods
handlers._checkout = {};

// Checkout - POST
// Required Data: stripeToken
// Optional Data: none
handlers._checkout.post = (data, callback) => {
  const stripeToken = typeof (data.payload.stripeToken) === 'string' && data.payload.stripeToken.trim().length > 0 ? data.payload.stripeToken.trim() : false;

  if (stripeToken) {
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false;
    // Lookup the user by reading the token
    _data.read('tokens', token, (readTokenErr, tokenData) => {
      if (!readTokenErr && tokenData) {
        const userEmail = tokenData.email;
        // Check that the user exists
        _data.read('users', userEmail, (readUserErr, userData) => {
          if (!readUserErr && userData) {
            // User Exists, verifying token validity
            handlers.tokens.verifyToken(token, userEmail, (tokenIsValid) => {
              if (tokenIsValid) {
                // Check if cart is not empty
                if (userData.cart.length > 0) {
                  // Getting the amount and description from cart
                  let amountInCents = 0;
                  let description = 'Payment for items: ';
                  userData.cart.forEach((orderItem) => {
                    amountInCents += orderItem.price * 100 * parseFloat(orderItem.quantity);
                    description += `${orderItem.description}, `;
                  });

                  // Creating payment
                  helpers.createPayment(amountInCents, description, stripeToken, (paymentErr) => {
                    if (!paymentErr) {
                      // Empty the cart
                      userData.cart = [];
                      _data.update('users', userEmail, userData, (updateErr) => {
                        if (!updateErr) {
                          // Send email to user
                          helpers.sendEmail(userEmail, 'Payment Receipt for Pizza', description, (err) => {
                            if (!err) {
                              callback(200);
                            } else {
                              callback(500, { Error: 'Error sending email to client' });
                            }
                          });
                        } else {
                          callback(500, { Error: 'Could not update the userData' });
                        }
                      });
                    } else {
                      callback(500, { Error: 'Could not process payment' });
                    }
                  });
                } else {
                  callback(403, { Error: 'Cart is Empty.' });
                }
              } else {
                callback(400, { Error: 'Token has expired' });
              }
            });
          } else {
            callback(403, { Error: 'User does not exist' });
          }
        });
      } else {
        callback(403, { Error: 'Token does not exist' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Ping handler
handlers.ping = (data, callback) => callback(200);

// Not Fonund Handler
handlers.notFound = (data, callback) => callback(404);

// Export the module
module.exports = handlers;
