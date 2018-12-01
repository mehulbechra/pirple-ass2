# pirple-ass2
API for a pizza delivery company. Users can add item to cart and checkout using stripe external api. Receipts are being emailed through mailgun.

## API Details

All data is needed to be sent in json format. Every property value is a string.

### Path: /api/users

**Method:** post,
**Required data:** fullName, email, streetAddress, password,
**Optional data:** none

**Method:** put,
**Required data:** email, token(in header),
**Optional data:** fullName, streetAdress, password (at least one req.)

**Method:** delete,
**Required data:** email, token(in header),
**Optional data:** none

### Path: /api/tokens

**Method:** post,
**Required data:** email, password,
**Optional data:** none

**Method:** delete,
**Required data:** id,
**Optional data:** none

### Path: /api/menu

**Method:** get,
**Required data:** email, token(in header),
**Optional Data:** none

### Path: /api/cart

**Method:** put,
**Required data:** itemId, quantity, token(in header),
**Optional data:** none

**Method:** get,
**Required data:** token(in header),
**Optional data:** none

**Method:** delete,
**Required data:** token(in header),
**Optional data:** none

### Path: /api/checkout

**Method:** post,
**Required data:** stripeToken, token(in header),
**Optional data:** none


## Command Line Interface 
    
| Command       | Description   |
|:-------------:|:-------------:|
| exit | Kill the CLI (and the rest of the application) |
| man | Show this help page |
| help | Alias of the "man" command |
| stats | Get statistics on the underying operating system and resource utilization |
| menu | Show a list of all the menu items |
| list orders | Show a list all the orders in the system in the last 24 hours |
| more order info --{orderId}| Show details of a specified order |
| list users | Show a list of all the users signed up in the last 24 hours |
| more user info --{emailId} | Show details of a specified user |
