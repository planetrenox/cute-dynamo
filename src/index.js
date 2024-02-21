// filename: dynamodb-util.js

export async function createDynamoDBClient({region, identityPoolId, accessKeyId, secretAccessKey})
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
    return new DynamoDBClient({
        region,
        credentials,
    });
}
