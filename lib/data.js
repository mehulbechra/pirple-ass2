/*
*   Library for storing and editing data
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module
const lib = {};

// Base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to a file
// TODO: check promises in https://github.com/mrinalsymc/node-homework2/blob/master/lib/data.js
lib.create = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir + dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Write data to file
      fs.writeFile(fileDescriptor, stringData, (writeErr) => {
        if (!writeErr) {
          fs.close(fileDescriptor, (closeErr) => {
            if (!closeErr) {
              callback(false);
            } else {
              callback('Error closing new File');
            }
          });
        } else {
          callback('Error writing data to the new file');
        }
      });
    } else {
      callback('Error creating new file, it may already exist');
    }
  });
};

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.baseDir + dir}/${file}.json`, 'utf-8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update data in the file
lib.update = (dir, file, data, callback) => {
  fs.open(`${lib.baseDir + dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert JSON data to string
      const stringData = JSON.stringify(data);

      // Truncate the file
      fs.ftruncate(fileDescriptor, (ftruncErr) => {
        if (!ftruncErr) {
          // Write data to the file and close it
          fs.writeFile(fileDescriptor, stringData, (writeErr) => {
            if (!writeErr) {
              fs.close(fileDescriptor, (closeErr) => {
                if (!closeErr) {
                  callback(false);
                } else {
                  callback('Error closing file for updating');
                }
              });
            } else {
              callback('Error writing to file for updating');
            }
          });
        } else {
          callback('Error truncating file for updating');
        }
      });
    } else {
      callback('Error opening file for updating');
    }
  });
};

// Delete data in the file
lib.delete = (dir, file, callback) => {
  // Unlink the file
  fs.unlink(`${lib.baseDir + dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  });
};

// List all files in the directory
lib.list = (dir, callback) => {
  fs.readdir(`${lib.baseDir + dir}/`, (err, files) => {
    if (!err && files && files.length > 0) {
      const trimmedFileNames = [];
      files.forEach((file) => {
        trimmedFileNames.push(file.replace('.json', ''));
      });
    } else {
      callback(err, files);
    }
  });
};

// Export the module
module.exports = lib;
