/*
*   CLI Tasks
*/

/* eslint-disable no-console,consistent-return,array-callback-return */

// Dependencies
const util = require('util');
const readline = require('readline');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const _data = require('./data');
const helpers = require('./helpers');

class _events extends events {}
const e = new _events();

// Instantiate the cli module
const cli = {};

// Input Handlers
e.on('man', () => {
  cli.responders.help();
});

e.on('help', () => {
  cli.responders.help();
});

e.on('exit', () => {
  cli.responders.exit();
});

e.on('stats', () => {
  cli.responders.stats();
});

e.on('menu', () => {
  cli.responders.menu();
});

e.on('list users', () => {
  cli.responders.listUsers();
});

e.on('more user info', (str) => {
  cli.responders.moreUserInfo(str);
});

e.on('list orders', () => {
  cli.responders.listOrders();
});

e.on('more order info', (str) => {
  cli.responders.moreOrderInfo(str);
});

// Responders object
cli.responders = {};

// Help / Man
cli.responders.help = () => {
  const commands = {
    exit: 'Kill the CLI (and the rest of the application)',
    man: 'Show this help page',
    help: 'Alias of the "man" command',
    stats: 'Get statistics on the underying operating system and resource utilization',
    menu: 'Show a list of all the menu items',
    'list orders': 'Show a list all the orders in the system in the last 24 hours',
    'more order info --{orderId}': 'Show details of a specified order',
    'list users': 'Show a list of all the users signed up in the last 24 hours',
    'more user info --{emailId}': 'Show details of a specified user',
  };

  // Show the header for the help page, as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command in white and yellow
  Object.keys(commands).forEach((key) => {
    if (Object.hasOwnProperty.call(commands, key)) {
      const value = commands[key];
      let line = `\x1b[33m${key}\x1b[0m`;
      const padding = 60 - line.length;
      for (let i = 0; i < padding; i += 1) {
        line += ' ';
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  });

  cli.verticalSpace();
  cli.horizontalLine();
};

// Create a vertical space
cli.verticalSpace = (lines) => {
  lines = typeof (lines) === 'number' && lines > 0 ? lines : 1;
  for (let i = 0; i < lines; i += 1) {
    console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = () => {
  // Get the avilable screen size
  const width = process.stdout.columns;
  let line = '';
  for (let i = 0; i < width; i += 1) {
    line += '-';
  }
  console.log(line);
};

// Create centered text
cli.centered = (str) => {
  str = typeof (str) === 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  let line = '';
  for (let i = 0; i < leftPadding; i += 1) {
    line += ' ';
  }
  line += str;
  console.log(line);
};

// Stats
cli.responders.stats = () => {
  // Compile an object of stats
  const stats = {
    'Load Average': os.loadavg().join(' '),
    'CPU Count': os.cpus().length,
    'Free Memory': os.freemem(),
    'Current Malloced Memory': v8.getHeapStatistics().malloced_memory,
    'Peak Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
    'Allocated Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
    'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
    Uptime: `${os.uptime()} Seconds`,
  };

  // Create a header for the stats
  cli.horizontalLine();
  cli.centered('SYSTEM STATISTICS');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log each stat
  Object.keys(stats).forEach((key) => {
    if (Object.hasOwnProperty.call(stats, key)) {
      const value = stats[key];
      let line = `\x1b[33m${key}\x1b[0m`;
      const padding = 60 - line.length;
      for (let i = 0; i < padding; i += 1) {
        line += ' ';
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  });

  cli.verticalSpace();
  cli.horizontalLine();
};

// Menu
cli.responders.menu = () => {
  // Create a header for the stats
  cli.horizontalLine();
  cli.centered('MENU');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Get the id from the string
  _data.read('menu', 'menu', (readErr, menuData) => {
    if (!readErr && menuData) {
      menuData.forEach((menuItem) => {
        let line = `\x1b[33m${menuItem.description}\x1b[0m`;
        const padding = 60 - line.length;
        for (let i = 0; i < padding; i += 1) {
          line += ' ';
        }
        line += `${menuItem.price} $`;
        cli.centered(line);
        cli.verticalSpace();
      });
    }
  });
};

// List Users (signed up within 24 hrs only)
cli.responders.listUsers = () => {
  _data.list('users', (err, userEmails) => {
    if (!err && userEmails && userEmails.length > 0) {
      cli.verticalSpace();
      userEmails.forEach((userId) => {
        _data.read('users', userId, (readErr, userData) => {
          if (!readErr && userData) {
            // Check if id is created within 24 hours
            if (userData.timeStamp > Date.now() - (1000 * 60 * 60 * 24)) {
              const line = `Name: ${userData.fullName} Email: ${userData.email} Address: ${userData.streetAddress}`;
              console.log(line);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

// More User Info
cli.responders.moreUserInfo = (str) => {
  // Get the email from the string
  const arr = str.split('--');
  const userEmail = typeof (arr[1]) === 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if (userEmail) {
    // Lookup the user
    _data.read('users', userEmail, (readErr, userData) => {
      if (!readErr && userData) {
        // Remove the hash password
        delete userData.hashedPassword;

        // Print JSON with text highlighting
        cli.verticalSpace();
        console.dir(userData, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

// List Orders (placed within 24 hrs only)
cli.responders.listOrders = () => {
  _data.list('orders', (err, orderIds) => {
    if (!err && orderIds && orderIds.length > 0) {
      cli.verticalSpace();
      orderIds.forEach((orderId) => {
        _data.read('orders', orderId, (readErr, orderData) => {
          if (!readErr && orderData) {
            // Check if id is created within 24 hours
            if (orderData.timeStamp > Date.now() - (1000 * 60 * 60 * 24)) {
              console.log(orderId);
              cli.verticalSpace();
            }
          }
        });
      });
    }
  });
};

// More Order Info
cli.responders.moreOrderInfo = (str) => {
  // Get the email from the string
  const arr = str.split('--');
  const orderId = typeof (arr[1]) === 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
  if (orderId) {
    // Lookup the order
    _data.read('orders', orderId, (readErr, orderData) => {
      if (!readErr && orderData) {
        let line = `ID: ${orderData.orderId} Email: ${orderData.userEmail} Order Total: ${orderData.orderTotal} Order: `;
        Object.keys(orderData.order).forEach((key) => {
          if (Object.hasOwnProperty.call(orderData.order, key)) {
            line += `Item: ${key} Quantity: ${orderData.order[key]} , `;
          }
        });
        cli.verticalSpace();
        console.log(line);
        cli.verticalSpace();
      }
    });
  }
};

// Exit
cli.responders.exit = () => {
  process.exit(0);
};

// Input Processor
cli.processInput = (str) => {
  str = typeof (str) === 'string' && str.trim().length > 0 ? str.trim() : false;
  if (str) {
    // Codify the unique strings that identify the unique questions allowed to be asked
    const uniqueInputs = [
      'exit',
      'man',
      'help',
      'stats',
      'menu',
      'list users',
      'more user info',
      'list orders',
      'more order info',
    ];

    // Go through the possible inputs, emit an event when a match is found
    let matchFound = false;
    uniqueInputs.some((input) => {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        // Emit an event matching the unique input, and include the full string given
        e.emit(input, str);
        return true;
      }
    });

    // If no match found, try again
    if (!matchFound) {
      console.log('Sorry, try again');
    }
  }
};

// Init
cli.init = () => {
  // Send the start message to the console in dark blue
  console.log('\x1b[34m%s\x1b[0m', 'The CLI is running');

  // Start the interface
  const _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '',
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input seperately
  _interface.on('line', (str) => {
    // Send to the input processor
    cli.processInput(str);

    // Re-Initialize the prompt
    _interface.prompt();
  });

  // If the user stops the CLI, kill the assosiated process
  _interface.on('close', () => {
    process.exit(0);
  });
};

// Export the module
module.exports = cli;
