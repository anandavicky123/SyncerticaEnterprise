# Database Architecture

The application uses a hybrid database approach for different concerns:

## 1. DynamoDB (Serverless NoSQL)

Used for:

- Session Management: Store and manage user sessions with automatic TTL (Time To Live)
- Audit Logging: Track all actions performed by users for security and compliance

Benefits:

- Serverless and auto-scaling
- Built-in TTL for sessions
- Append-only nature perfect for audit logs
- Cost-effective for these use cases

Tables:

- `sessions`: Stores user sessions with TTL
- `audit_logs`: Tracks all user actions

## 2. PostgreSQL RDS (Relational Database)

Used for:

- Worker Management
- Task Management
- Project Management
- All other business data

Benefits:

- ACID compliance for business transactions
- Complex relationships between entities
- Strong consistency
- Familiar SQL querying
- Managed by Prisma ORM

## Implementation Details

### Session & Audit (DynamoDB)

- Implemented in `lib/dynamodb.ts`
- Uses AWS SDK v3 for DynamoDB
- Session TTL set to 24 hours
- Audit logs indexed by actor and timestamp

### Business Data (PostgreSQL)

- Implemented in `lib/database.ts`
- Uses Prisma ORM for type-safe database operations
- Models:
  - Manager
  - Worker
  - Project
  - Task
  - Status
  - Comment
  - Notification

## Environment Setup

1. DynamoDB Configuration

```env
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

2. PostgreSQL Configuration

```env
DATABASE_URL="postgresql://username:password@hostname:5432/database"
```

## Running Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Reset database (development only)
npm run db:reset
```

## Local Development

1. Start a local DynamoDB instance:

```bash
npm run setup:dynamodb
```

2. Set up the PostgreSQL database:

```bash
npm run db:migrate
npm run db:seed
```

## Testing

1. Set up test databases:

```bash
npm run db:migrate:test
npm run db:seed:test
```

2. Run tests:

```bash
npm test
```
