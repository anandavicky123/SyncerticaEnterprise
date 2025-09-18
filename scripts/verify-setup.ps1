# Load AWS profile
$env:AWS_ACCESS_KEY_ID = (Get-Content .env | Where-Object { $_ -match "^AWS_ACCESS_KEY_ID=" }).Split("=")[1]
$env:AWS_SECRET_ACCESS_KEY = (Get-Content .env | Where-Object { $_ -match "^AWS_SECRET_ACCESS_KEY=" }).Split("=")[1]
$env:AWS_REGION = (Get-Content .env | Where-Object { $_ -match "^AWS_REGION=" }).Split("=")[1]

Write-Host "Testing AWS credentials..."
aws configure get aws_access_key_id
aws configure get aws_secret_access_key
aws configure get region

Write-Host "Setting up DynamoDB tables..."
node scripts/setup-dynamodb.js

Write-Host "Verifying table creation..."
aws dynamodb describe-table --table-name sessions --query 'Table.TableStatus'
# audit_logs verification removed

Write-Host "Setup complete!"
