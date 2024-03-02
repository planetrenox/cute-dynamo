# cute-dynamo

Make DynamoDB cute with minimalism; worry about network costs later.

## Features

- Fast development.
- Simple syntax.
- No pain.
- Needs more testing.
- Uses 'latest' aws packages ALWAYS.

## Why

`cute-dynamo` solves a very fundamental problem with DynamoDB: and that is, development is **slow**...   
With this design, we define rules that allow you to use DynamoDB across **different projects** without having **custom** code for each project.

Cute tables are **minimalistic** and only allow **1 attribute per item** which is a serialized **JSON** object.

By design of DynamoDB, each item is limited to 400kb in size no matter how many attributes anyway, so we aren't limiting ourselves.

Cute tables **must _adhere_ to naming**: [Primary key name: **PK**], [Sort key name: **SK**], [Single attribute name: **JSON**]

> ###### **There can't be cute without development speed.**

## Getting Started

### Installation

   ```
   npm install cute-dynamo
   ```

### Usage

   ```javascript
// Initialization 
//
// Depending on your application context (server-side or client-side), two ways for init:
// (FIRST WE SHOW THE PREFFERED WAY)
// .env variables: DYNAMODB_TABLE, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    import { init } from 'cute-dynamo';
    await init();

// Putting Items into DynamoDB
    import { put } from 'cute-dynamo';
// To store an item you can use put. This implemenation should transform the way you use put.
// You can deep nest anything and no setup. 
// Provide JS object you wish to store, along with a primary key
// REMEMBER: YOUR PRIMARY KEY IN YOUR TABLE MUST BE NAMED 'PK'
    await put({name: 'Hatsune Miku', age: 16}, 'keyMIKU');
    // YES YOU CAN NEST ANY LIST OR MAP

// Storing an item with both a primary key and a sort key: (use with sort key is untested!)
// REMEMBER: YOUR SORT KEY IN YOUR TABLE MUST BE NAMED 'SK'
    await put({lastLogin: '2024-02-25T08:00:00Z'}, 'keyMIKU', '01010101');
    // i havent been able to test sortkey use

// Getting Items from DynamoDB
    import { get } from 'cute-dynamo';

// Retrieving an item using only a primary key:
    const item = await get('USER01');
    console.log(item);

// Retrieving an item using both a primary key and a sort key:
    const item = await get('USER01', 'METADATA001');
    console.log(item);

// These examples cover the basic operations to get you started with cute-dynamo. 
// By following the minimalistic design principles of cute-dynamo, you 
// can ensure a consistent and simplified approach to working with DynamoDB across your projects.

// ALTERNATIVE WAYS TO INIT
// Server-Side Initialization (using AWS Access Key ID and AWS Secret Access Key):
// IF YOU DONT WANT TO USE ENV VARS
//     await init({
//         region: 'us-east-1',
//         accessKeyId: 'AKIAEXAMPLE',
//         secretAccessKey: 'secret'
//     });

// Initialize with Cognito Identity Pool ID for client-side usage
// IF YOU DONT WANT TO USE ENV VARS
//     await init({
//         region: 'us-east-1',
//         identityPoolId: 'us-east-1:exampleId'
//     });
   ```

### FYI

| DynamoDB Call                                   | Estimated Time (ms) | Explanation                                                                                        |
|-------------------------------------------------|---------------------|----------------------------------------------------------------------------------------------------|
| PK lookup in PK-only table                      | 5 - 50              | Direct `GetItem` access with only a PK. Fast and efficient.                                        |
| **PK lookup in PK-SK table**                    | **N/A**             | **Direct lookup not possible without SK. Use `Query` instead.**                                    |
| PK and SK lookup in PK-SK table               | 5 - 50               | Direct `GetItem` access with both PK and SK. Very fast and efficient for accessing a single item.    |
| PK `Query` in PK-SK table (single item)         | 10 - 100            | `Query` based on PK, fast if there's only one item for the PK.                                     |
| PK `Query` in PK-SK table (multiple items)      | 20 - 200            | `Query` based on PK, might take longer depending on the number of items returned.                  |
| Full Scan on any table (small table <1k items)  | 100 - 1000          | Scans are slower and more resource-intensive, time increases with item size and count.             |
| Full Scan on any table (large table >10k items) | 1000 - 5000+        | Significantly slower, highly dependent on table size, item size, and scan configuration.           |
| Conditional `Query` on PK-SK table (filters)    | 20 - 200            | Using `Query` with additional filters can increase time, depending on complexity and results size. |

