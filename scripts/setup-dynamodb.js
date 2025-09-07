const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  ListTablesCommand 
} = require('@aws-sdk/client-dynamodb');

require('dotenv').config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createSessionsTable() {
  const tableName = 'sessions';
  
  try {
    // Check if table already exists
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`Table ${tableName} already exists`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  const params = {
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: 'PK',
        KeyType: 'HASH', // Partition key
      },
      {
        AttributeName: 'SK',
        KeyType: 'RANGE', // Sort key
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'PK',
        AttributeType: 'S',
      },
      {
        AttributeName: 'SK',
        AttributeType: 'S',
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
    TimeToLiveSpecification: {
      AttributeName: 'TTL',
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

async function createAuditLogsTable() {
  const tableName = 'audit_logs';
  
  try {
    // Check if table already exists
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`Table ${tableName} already exists`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  const params = {
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: 'PK',
        KeyType: 'HASH', // Partition key (logId)
      },
      {
        AttributeName: 'SK',
        KeyType: 'RANGE', // Sort key (createdAt)
      },
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'PK',
        AttributeType: 'S',
      },
      {
        AttributeName: 'SK',
        AttributeType: 'S',
      },
      {
        AttributeName: 'actorId',
        AttributeType: 'S',
      },
      {
        AttributeName: 'createdAt',
        AttributeType: 'S',
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ActorIndex',
        KeySchema: [
          {
            AttributeName: 'actorId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'createdAt',
            KeyType: 'RANGE',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
      {
        IndexName: 'CreatedAtIndex',
        KeySchema: [
          {
            AttributeName: 'createdAt',
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Table ${tableName} created successfully`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

async function setupDynamoDB() {
  console.log('Setting up DynamoDB tables...');
  
  try {
    await createSessionsTable();
    await createAuditLogsTable();
    console.log('DynamoDB setup completed successfully!');
  } catch (error) {
    console.error('DynamoDB setup failed:', error);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDynamoDB();
}

module.exports = { setupDynamoDB };