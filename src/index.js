import {
    DeleteCommand,
    GetCommand,
    UpdateCommand,
    QueryCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";

export async function createDynamoDBDocumentClient({region, identityPoolId, accessKeyId, secretAccessKey})
{
    let credentials;
    if (identityPoolId) {
        const {CognitoIdentityClient} = await import("@aws-sdk/client-cognito-identity");
        const {fromCognitoIdentityPool} = await import("@aws-sdk/credential-provider-cognito-identity");
        credentials = fromCognitoIdentityPool({
            client: new CognitoIdentityClient({region}),
            identityPoolId,
        });
    }
    else if (accessKeyId && secretAccessKey) {
        credentials = {
            accessKeyId,
            secretAccessKey,
        };
    }
    else {
        throw new Error("Insufficient credentials provided");
    }

    const {DynamoDBClient} = await import("@aws-sdk/client-dynamodb");
    const {DynamoDBDocumentClient} = await import("@aws-sdk/lib-dynamodb");
    let client = new DynamoDBClient({
        region,
        credentials,
    });
    return DynamoDBDocumentClient.from(client);
}

export async function put(client, item)
{
    const {PutCommand} = await import("@aws-sdk/lib-dynamodb");
    return await client.send(
        new PutCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: item,
        }));
}

export async function get(client, key) {
    return await client.send(
        new GetCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Key: key,
        })
    );
}

/**
 * Updates specific attributes of an item in DynamoDB without replacing it.
 * @param {DynamoDBDocumentClient} client DynamoDB Document Client.
 * @param {Object} key Key of the item to update.
 * @param {String} updateExpression Update expression specifying attributes to update.
 * @param {Object} expressionAttributeValues Values referenced in the update expression.
 *
 * Example usage:
 * await updateItem(client, { id: "123" }, "set #name = :name", { ":name": "Jane Doe", "#name": "name" });
 * Note: Update modifies specific attributes, leaving the rest of the item unchanged.
 */
export async function updateItem(client, key, updateExpression, expressionAttributeValues) {
    return await client.send(
        new UpdateCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Key: key,
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        })
    );
}

/**
 * Deletes an item from DynamoDB.
 * @param {DynamoDBDocumentClient} client DynamoDB Document Client.
 * @param {Object} key Key of the item to delete.
 *
 * Example usage:
 * await deleteItem(client, { id: "123" });
 */
export async function deleteItem(client, key) {
    return await client.send(
        new DeleteCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Key: key,
        })
    );
}

/**
 * Queries items based on a key condition expression.
 * @param {DynamoDBDocumentClient} client DynamoDB Document Client.
 * @param {String} keyConditionExpression Condition expression for the query.
 * @param {Object} expressionAttributeValues Values for the condition expression.
 *
 * Example usage:
 * await queryItems(client, "id = :id", { ":id": "123" });
 */
export async function queryItems(client, keyConditionExpression, expressionAttributeValues) {
    return await client.send(
        new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        })
    );
}

/**
 * Scans the table and returns items matching the optional filter expression.
 * @param {DynamoDBDocumentClient} client DynamoDB Document Client.
 * @param {String} [filterExpression] Optional filter expression for the scan.
 * @param {Object} [expressionAttributeValues] Values for the filter expression.
 *
 * Example usage:
 * await scanTable(client, "contains(#name, :name)", { ":name": "Doe", "#name": "name" });
 */
export async function scanTable(client, filterExpression, expressionAttributeValues) {
    return await client.send(
        new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        })
    );
}