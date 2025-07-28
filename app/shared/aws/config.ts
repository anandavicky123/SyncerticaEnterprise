import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { RDSClient } from "@aws-sdk/client-rds";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { S3Client } from "@aws-sdk/client-s3";
import { SNSClient } from "@aws-sdk/client-sns";
import { SQSClient } from "@aws-sdk/client-sqs";

// AWS Configuration
const awsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

// Initialize AWS Clients
export const cognitoClient = new CognitoIdentityProviderClient(awsConfig);
export const rdsClient = new RDSClient(awsConfig);
export const lambdaClient = new LambdaClient(awsConfig);
export const dynamodbClient = new DynamoDBClient(awsConfig);
export const cloudwatchClient = new CloudWatchClient(awsConfig);
export const s3Client = new S3Client(awsConfig);
export const snsClient = new SNSClient(awsConfig);
export const sqsClient = new SQSClient(awsConfig);

// AWS Service Names and Endpoints
export const AWS_SERVICES = {
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "",
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || "",
  LAMBDA_FUNCTION_NAME:
    process.env.LAMBDA_FUNCTION_NAME || "syncertica-enterprise-api",
  DYNAMODB_TABLE_NAME:
    process.env.DYNAMODB_TABLE_NAME || "syncertica-enterprise-sessions",
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "syncertica-enterprise-assets",
  SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN || "",
  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL || "",
} as const;

// Helper function to check if AWS is configured
export const isAWSConfigured = (): boolean => {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );
};

// Error handling wrapper for AWS operations
export const withAWSErrorHandling = async <T>(
  operation: () => Promise<T>,
  serviceName: string
): Promise<T | null> => {
  if (!isAWSConfigured()) {
    console.warn(`AWS not configured for ${serviceName}`);
    return null;
  }

  try {
    return await operation();
  } catch (error) {
    console.error(`AWS ${serviceName} Error:`, error);
    return null;
  }
};
