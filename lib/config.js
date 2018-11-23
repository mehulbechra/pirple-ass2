/*
*   Create and export configuration variables
*/

// Container for all environments
const environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'stripe':{
        'currency':'usd',
        'apiKey':'sk_test_4eC39HqLyjWDarjtT1zdp7dc'
    }
};

// Production environment
environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsASecret',
    'stripe':{
        'currency':'usd',
        'apiKey':'sk_test_4eC39HqLyjWDarjtT1zdp7dc'
    }
};

// Find which environment was passed as an argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;