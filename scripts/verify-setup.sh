#!/bin/bash
# Run this script to set up DynamoDB tables and verify their configuration

# Load environment variables
source .env

# Verify AWS credentials
echo "Testing AWS credentials..."
aws configure get aws_access_key_id
aws configure get aws_secret_access_key
aws configure get region

# Create DynamoDB tables
echo "Setting up DynamoDB tables..."
node scripts/setup-dynamodb.js

# Verify table creation
echo "Verifying table creation..."
aws dynamodb describe-table --table-name sessions --query 'Table.TableStatus'
# audit_logs verification removed

echo "Setup complete!"
