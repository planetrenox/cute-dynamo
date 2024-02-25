import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// cute-dynamo solves a very fundamental problem with DynamoDB: and that is, development is slow...
// With this design, we define rules that allow you to use DynamoDB across different projects without having custom code for each project.
// Cute tables are minimalistic and are only allowed 1 attribute per item which is a serialized JSON object, so you don't need to worry about weird dynamodb syntax.
// By design of DynamoDB, each item is limited to 400kb in size no matter how many attributes anyway, so we aren't limiting ourselves.
// Usage serverside or clientside: (serverside with process.env.AWS_ACCESS_KEY_ID & process.env.AWS_SECRET_ACCESS_KEY) or (clientside with process.env.AWS_IDENTITY_POOL_ID)
// Cute tables must adhere to naming: [Primary key name: PK], [Sort key name: SK], [Single attribute name: JSON]

let client;
/**
 * Initializes the DynamoDB client for cute-dynamo library usage. It configures the client based on the environment and credentials provided.
 * This function supports two authentication methods:
 * 1. Client-side authentication using an AWS Identity Pool ID for applications where AWS credentials are managed client-side.
 * 2. Server-side authentication using AWS Access Key ID and AWS Secret Access Key for server-side applications.
 *
 * By adhering to cute-dynamo's minimalistic design, this initialization sets the stage for interacting with DynamoDB tables that conform to the specified naming conventions and data structure rules.
 *
 * @param {Object} options - Configuration options for the DynamoDB client. Includes region, identityPoolId, accessKeyId, and secretAccessKey.
 * @param {string} [options.region=process.env.AWS_REGION] - The AWS region where the DynamoDB instance is hosted.
 * @param {string} [options.identityPoolId=process.env.AWS_IDENTITY_POOL_ID] - The AWS Cognito Identity Pool ID for client-side authentication. Optional if server-side credentials are provided.
 * @param {string} [options.accessKeyId=process.env.AWS_ACCESS_KEY_ID] - The AWS Access Key ID for server-side authentication. Required if not using client-side authentication with an Identity Pool ID.
 * @param {string} [options.secretAccessKey=process.env.AWS_SECRET_ACCESS_KEY] - The AWS Secret Access Key for server-side authentication. Required if not using client-side authentication.
 *
 * @throws {Error} Throws an error if insufficient credentials are provided for either authentication method.
 *
 * @example
 * // Initialize for client-side usage with an identity pool ID
 * await init({ region: 'us-east-1', identityPoolId: 'us-east-1:exampleId' });
 *
 * @example
 * // Initialize for server-side usage with access key and secret key
 * await init({ region: 'us-east-1', accessKeyId: 'AKIAEXAMPLE', secretAccessKey: 'secret' });
 *
 * Note: This setup assumes the environment variables are set for AWS_REGION, AWS_IDENTITY_POOL_ID, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY as fallbacks.
 */
export async function init({region = process.env.AWS_REGION, identityPoolId = process.env.AWS_IDENTITY_POOL_ID, accessKeyId = process.env.AWS_ACCESS_KEY_ID, secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY} = {})
{
    let credentials;
    if (identityPoolId) {
        const {CognitoIdentityClient} = await import("@aws-sdk/client-cognito-identity");
        const {fromCognitoIdentityPool} = await import("@aws-sdk/credential-provider-cognito-identity");
        credentials = fromCognitoIdentityPool({
            client: new CognitoIdentityClient({region}), identityPoolId,
        });
    }
    else if (accessKeyId && secretAccessKey) credentials = {accessKeyId, secretAccessKey}; else throw new Error("Insufficient credentials provided");
    client = DynamoDBDocumentClient.from(new DynamoDBClient({region, credentials}));
}

/**
 * Retrieves an item from the DynamoDB table using a primary key and an optional sort key.
 * The function deserializes the "JSON" attribute of the retrieved item back into a JavaScript object.
 * The sort key can be a string or a number.
 *
 * @param {string} pk - The primary key (PK) of the item to retrieve.
 * @param {string|number} [sk=undefined] - Optional. The sort key (SK) to further specify the item to retrieve.
 *
 * @returns {Promise<Object>} - A promise that resolves to the retrieved item, with the "JSON" attribute deserialized into an object. If no item is found, the promise resolves to null.
 *
 * @example
 * // Retrieve an item using only a primary key
 * const item = await get('USER#001');
 * console.log(item); // Outputs: { PK: 'USER#001', JSON: { name: 'John Doe', age: 30 } }
 *
 * @example
 * // Retrieve an item using both a primary key and a numeric sort key
 * const item = await get('USER#001', 20240225);
 * console.log(item); // Outputs: { PK: 'USER#001', SK: 20240225, JSON: { lastLogin: '2024-02-25T08:00:00Z' } }
 */

export async function get(pk, sk = undefined)
{
    const {GetCommand} = await import("@aws-sdk/lib-dynamodb");
    const key = {
        PK: pk, ...(sk && {SK: sk}), // Include SK in the key if provided
    };

    const response = await client.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE, Key: key,
    }));

    // Deserialize the "JSON" attribute if it exists
    if (response.Item && response.Item.JSON) {
        response.Item.JSON = JSON.parse(response.Item.JSON);
    }

    return response.Item ? response.Item : null;
}

/**
 * Stores an item in the DynamoDB table with specified data, a primary key, and an optional sort key.
 * The data object is automatically serialized into a JSON string before storage.
 * The sort key can be a string or a number, providing additional sorting and query flexibility.
 *
 * @param {Object} data - The JavaScript object containing the data to be stored in the "JSON" attribute.
 * @param {string} pk - The primary key (PK) for the item. Must uniquely identify the item.
 * @param {string|number} [sk=undefined] - Optional. The sort key (SK) for the item.
 *
 * @returns {Promise} - A promise that resolves to the result of the PutCommand operation.
 *
 * @example
 * // Store an item with only a primary key
 * await put({ name: 'John Doe', age: 30 }, 'USER#001');
 *
 * @example
 * // Store an item with both a primary key and a numeric sort key
 * await put({ lastLogin: '2024-02-25T08:00:00Z' }, 'USER#001', 20240225);
 */
export async function put(data, pk, sk = undefined)
{
    const {PutCommand} = await import("@aws-sdk/lib-dynamodb");
    const item = {
        PK: pk, ...(sk && {SK: sk}), // Include SK in the item if provided
        JSON: JSON.stringify(data),
    };

    return await client.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE, Item: item,
    }));
}


