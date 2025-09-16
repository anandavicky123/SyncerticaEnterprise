# Syncertica Enterprise - Task Management System

## Overview

This is a comprehensive task management system built with Next.js, featuring custom authentication, AWS RDS (PostgreSQL) for relational data, and DynamoDB for sessions and audit logs.

## Features

### Authentication System
- **Manager Access**: Device-based UUID authentication stored in localStorage
- **Worker Access**: Email/password authentication with Argon2 password hashing
- **Session Management**: DynamoDB-based sessions with automatic expiry
- **Route Protection**: Next.js middleware for role-based access control

### User Roles

#### Manager (Admin) Layout
- Full access to all features
- Worker management (create, delete workers)
- Project management
- Task assignment and management
- Reports and analytics
- Security and audit logs (Pro feature)
- 5-worker limit (upgradeable to Pro for unlimited)

#### Worker Layout
- Task list view only
- Update task status (todo, doing, done, blocked)
- View assigned tasks with project context
- Simple, focused interface

### Database Schema

#### AWS RDS PostgreSQL Tables:
1. **managers** - Manager accounts with device UUID
2. **workers** - Worker accounts with email/password auth
3. **projects** - Project management
4. **tasks** - Task assignments and tracking
5. **statuses** - Custom workflow statuses
6. **task_dependencies** - Task relationships
7. **comments** - Task comments
8. **notifications** - System notifications

#### DynamoDB Tables:
1. **sessions** - User session management with TTL
2. **audit_logs** - Comprehensive audit logging (Pro feature)

### Security Features

#### Audit Logging (Pro Feature)
Tracks all system activities including:
- User login/logout attempts
- Worker account management
- Task and project changes
- Security events
- System-level actions

#### Session Management
- UUID-based session IDs
- Automatic expiry with DynamoDB TTL
- Role-based access control
- Secure cookie handling

#### Password Security
- Argon2id hashing for worker passwords
- Strong password requirements
- Failed login attempt tracking

### Pro Features
- **Unlimited Workers**: Remove the 5-worker limit
- **Audit Logs**: Comprehensive activity tracking
- **Advanced Security**: Enhanced monitoring and alerts

## Setup Instructions

### 1. Environment Configuration

Create/update your `.env` file with:

```env
# Database
DATABASE_URL="your_postgresql_connection_string"

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region

# Application
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV=development
```

### 2. Database Setup

#### PostgreSQL (AWS RDS)
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

#### DynamoDB
```bash
# Set up DynamoDB tables
npm run setup:dynamodb
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## Usage

### Getting Started

1. **Access the Application**: Navigate to `http://localhost:3000`
2. **Enter Dashboard**: Click "Enter Dashboard" from the landing page
3. **Choose Role**: Select either "Manager" or "Worker"

### Manager Workflow

1. **First Time Access**: 
   - Click "Manager" - automatically creates manager account with device UUID
   - UUID is stored in localStorage for future access

2. **Add Workers**:
   - Go to Workers section
   - Click "Add Worker"
   - Fill in worker details (name, email, password, job role)
   - Worker limit: 5 workers (upgrade to Pro for unlimited)

3. **Manage Tasks**:
   - Create projects
   - Assign tasks to workers
   - Monitor progress through reports

### Worker Workflow

1. **Login**: 
   - Click "Worker" from dashboard selection
   - Enter email and password provided by manager

2. **Task Management**:
   - View assigned tasks
   - Update task status
   - Track progress and deadlines

## API Endpoints

### Authentication
- `POST /api/auth/manager` - Manager authentication
- `POST /api/auth/worker/login` - Worker login
- `POST /api/auth/worker/register` - Worker registration (manager only)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Session validation

### Worker Management
- `GET /api/workers` - List workers (manager only)
- `DELETE /api/workers?id={workerId}` - Delete worker (manager only)

### Audit Logs (Pro)
- `GET /api/audit-logs` - Get audit logs (manager only)

## Security Considerations

### Authentication
- Manager authentication is device-based (UUID in localStorage)
- Worker authentication uses email/password with Argon2 hashing
- Sessions are stored in DynamoDB with automatic expiry

### Authorization
- Route-level protection via Next.js middleware
- API-level authorization checks
- Role-based access control (manager vs worker)

### Audit Trail
- All significant actions are logged to DynamoDB
- Includes user actions, security events, and system changes
- Searchable and filterable audit logs

### Data Protection
- Passwords are hashed with Argon2id
- Session tokens are securely generated UUIDs
- Database connections use SSL/TLS

## Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management

### Backend
- **Next.js API Routes** for server-side logic
- **Prisma ORM** for PostgreSQL operations
- **AWS SDK** for DynamoDB operations
- **Argon2** for password hashing

### Database
- **PostgreSQL (AWS RDS)** for relational data
- **DynamoDB** for sessions and audit logs
- **Prisma** for schema management and migrations

### Infrastructure
- **AWS RDS** for managed PostgreSQL
- **AWS DynamoDB** for NoSQL data
- **Next.js Middleware** for request processing

## Development

### Database Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npm run db:deploy

# View database
npm run db:studio
```

### DynamoDB Management
```bash
# Setup tables
npm run setup:dynamodb
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Testing
npm run test
```

## Deployment

### Environment Setup
1. Configure production environment variables
2. Set up AWS RDS PostgreSQL instance
3. Configure DynamoDB tables in production
4. Update CORS and security settings

### Build Process
```bash
# Production build
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Verify DATABASE_URL and network access
2. **AWS Credentials**: Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
3. **DynamoDB Tables**: Run `npm run setup:dynamodb` to create tables
4. **Session Issues**: Clear localStorage and cookies, restart session

### Logs
- Check browser console for client-side errors
- Check server logs for API errors
- Monitor DynamoDB for session and audit log issues

## Future Enhancements

### Planned Features
- Real-time task updates with WebSockets
- File attachments for tasks
- Advanced reporting and analytics
- Mobile app support
- Integration with external tools (Slack, Jira, etc.)

### Pro Features Expansion
- Advanced workflow automation
- Custom integrations
- Enhanced security features
- Priority support

## Support

For technical support or questions about the implementation, please refer to the codebase documentation or contact the development team.