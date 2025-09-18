const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} = require("@aws-sdk/client-dynamodb");

require("dotenv").config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createSessionsTable() {
  const tableName = "sessions";

  try {
    // Check if table already exists
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`Table ${tableName} already exists`);
    return;
  } catch (error) {
    if (error.name !== "ResourceNotFoundException") {
      throw error;
    }
  }

  const params = {
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: "PK",
        KeyType: "HASH", // Partition key
      },
      {
        AttributeName: "SK",
        KeyType: "RANGE", // Sort key
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: "PK",
        AttributeType: "S",
      },
      {
        AttributeName: "SK",
        AttributeType: "S",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
    TimeToLiveSpecification: {
      AttributeName: "TTL",
      Enabled: true,
    },
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Table ${tableName} created successfully`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

// Audit logs table creation removed.

async function setupDynamoDB() {
  console.log("Setting up DynamoDB tables...");

  try {
    await createSessionsTable();
    console.log("DynamoDB setup completed successfully!");
  } catch (error) {
    console.error("DynamoDB setup failed:", error);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDynamoDB();
}

module.exports = { setupDynamoDB };
