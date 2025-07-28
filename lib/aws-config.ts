import { RDSClient } from "@aws-sdk/client-rds";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";

const region = process.env.AWS_REGION || "us-east-1";

// AWS SDK Configuration
const awsConfig = {
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

// RDS Client for Aurora DSQL
export const rdsClient = new RDSClient(awsConfig);

// Cognito Client for Authentication
export const cognitoClient = new CognitoIdentityProviderClient(awsConfig);

// DynamoDB Client for Sessions and Caching
export const dynamoClient = new DynamoDBClient(awsConfig);
export const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

// Lambda Client for Serverless Functions
export const lambdaClient = new LambdaClient(awsConfig);

// CloudWatch Client for Monitoring
export const cloudWatchClient = new CloudWatchClient(awsConfig);

// Configuration constants
export const AWS_CONFIG = {
  region,
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
  },
  dynamodb: {
    sessionsTable:
      process.env.DYNAMODB_SESSIONS_TABLE || "syncertica-enterprise-sessions",
  },
  aurora: {
    endpoint: process.env.AURORA_ENDPOINT,
    database: process.env.DB_NAME || "syncertica_db",
    username: process.env.DB_USER || "admin",
  },
} as const;

export default {
  rdsClient,
  cognitoClient,
  dynamoClient,
  dynamoDocClient,
  lambdaClient,
  cloudWatchClient,
  AWS_CONFIG,
} as const;
