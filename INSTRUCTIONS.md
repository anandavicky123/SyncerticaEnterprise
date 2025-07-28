# Syncertica Enterprise - Development Instructions

## 📁 Project Structure

This Next.js application follows a structured approach to organize code, assets, and features. Below is the detailed explanation of each directory and its purpose:

```
app/
├── assets/          # Static assets (favicon, icons, images, audio, video, etc...)
├── contents/        # Individual app features (examples: calculator, editor, media player, etc...)
├── shared/          # Common utilities used across UI, system, and features
│   └── types/       # Global shared types/interfaces
│   └── constants/   # Static values, enums, messages
│   └── utils/       # Utility functions used in both frontend & backend
│   └── validations/ # Shared Zod/Validator schemas
├── system/          # System-level components (examples: admin, auth, server, API, database, etc...)
├── ui/              # Reusable UI components library, theme folder, interface generals
├── globals.css      # Global styles with custom CSS variables
├── layout.tsx       # Root layout with metadata
└── page.tsx         # Main homepage
```

## 🎯 Technology Stack

### Frontend

- **React 19+** with **Next.js 15+** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management

### Backend

- **Node.js** runtime
- **Express.js** for API endpoints
- **PostgreSQL** as primary database

### AWS Services (Always Free Tier)

- **AWS Lambda** - Serverless functions
- **AWS DynamoDB** - NoSQL database for caching/sessions
- **AWS Aurora DSQL (PostgreSQL)** - Main database
- **AWS Cognito** - Authentication and user management
- **AWS CloudFront** - CDN and edge locations
- **AWS S3** - Static asset storage
- **AWS CloudWatch** - Monitoring and logging
- **AWS SQS** - Message queuing
- **AWS EventBridge** - Event-driven architecture
- **AWS CloudFormation** - Infrastructure as Code
- **AWS CodePipeline** - CI/CD pipeline
- **AWS X-Ray** - Application tracing
- **Amazon Route 53** - DNS management

### DevOps & Containerization

- **Docker** - Application containerization
- **GitHub Actions** - CI/CD automation and workflows
- **PostgreSQL** - Production database deployment

## 📂 Detailed Folder Structure

### `/app/assets/`

Store all static assets including:

- `favicon.ico` - Site favicon
- `icons/` - UI icons and brand assets
- `images/` - Photos, graphics, illustrations
- `audio/` - Sound files and music
- `video/` - Video content and media
- `fonts/` - Custom font files

### `/app/contents/`

Individual application features and modules (customize based on your project needs):

- `calculator/` - Calculator application (example)
- `editor/` - Text/code editor (example)
- `media-player/` - Audio/video player (example)
- `dashboard/` - Analytics dashboard (example)
- `reports/` - Reporting system (example)
- Each feature should be self-contained with its own components, hooks, and logic

**Note**: The specific features listed above are just examples. You can create any features your application needs (e.g., `blog/`, `shop/`, `chat/`, `gallery/`, etc.)

### `/app/shared/`

Common utilities used across the entire application:

#### `/app/shared/types/`

- `api.ts` - API response and request types
- `auth.ts` - Authentication and user types
- `database.ts` - Database model types
- `ui.ts` - UI component prop types
- `index.ts` - Re-export all types

#### `/app/shared/constants/`

- `api.ts` - API endpoints and configurations
- `auth.ts` - Authentication constants
- `messages.ts` - User-facing messages and copy
- `routes.ts` - Application routes
- `aws.ts` - AWS service configurations

#### `/app/shared/utils/`

- `api.ts` - API helper functions
- `auth.ts` - Authentication utilities
- `date.ts` - Date formatting and manipulation
- `validation.ts` - Input validation helpers
- `aws.ts` - AWS SDK utilities
- `database.ts` - Database connection and query helpers

#### `/app/shared/validations/`

- `auth.ts` - Zod schemas for authentication
- `user.ts` - User data validation schemas
- `api.ts` - API request/response validation
- `forms.ts` - Form validation schemas

### `/app/system/`

System-level components and services (customize based on your project needs):

- `auth/` - Authentication components and providers (example)
- `admin/` - Administrative interfaces (example)
- `api/` - API route handlers and middleware (example)
- `database/` - Database models and migrations (example)
- `aws/` - AWS service integrations (example)
- `monitoring/` - Application monitoring setup (example)

**Note**: The specific system components listed above are examples. Add the system-level functionality your application requires.

### `/app/ui/`

Reusable UI component library:

- `components/` - Individual UI components
  - `Button/` - Button variants
  - `Input/` - Form inputs
  - `Modal/` - Modal dialogs
  - `Navigation/` - Navigation components
- `layout/` - Layout components
- `theme/` - Theme configuration and providers
- `hooks/` - Custom React hooks
- `providers/` - Context providers

## 🛠 Development Guidelines

### 1. Component Structure

```typescript
/**
 * Example component structure
 * Always include JSDoc comments for components
 */
interface ComponentProps {
  /** Define props with TypeScript - always document each prop */
  title: string;
  /** Optional callback function */
  onClick?: () => void;
}

/**
 * Component description explaining what this component does
 * @param props - Component properties
 * @returns JSX element
 */
export const Component: React.FC<ComponentProps> = ({ title, onClick }) => {
  // Component logic - explain complex operations
  const handleClick = () => {
    // Handle click event with proper error handling
    try {
      onClick?.();
    } catch (error) {
      console.error("Error in component click handler:", error);
    }
  };

  return (
    <div className="tailwind-classes">
      {/* JSX content - explain UI structure */}
      <h1>{title}</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};
```

### 2. State Management with Redux

- Use Redux Toolkit for global state
- Create feature-specific slices
- Use RTK Query for API calls
- Keep local state for UI-only interactions

### 3. Styling with Tailwind CSS

- Use Tailwind utility classes
- Create custom CSS variables in `globals.css`
- Follow mobile-first responsive design
- Use Tailwind's dark mode features

### 4. AWS Integration Patterns

#### Authentication with Cognito

```typescript
/**
 * AWS Cognito authentication service
 * Handles user sign-in, sign-up, and session management
 */
import { Auth } from "aws-amplify";

/**
 * Authenticate user with AWS Cognito
 * @param username - User's email or username
 * @param password - User's password
 * @returns Promise resolving to Cognito user object
 * @throws {Error} Authentication errors (wrong credentials, user not found, etc.)
 */
export const signIn = async (username: string, password: string) => {
  try {
    // Attempt authentication with AWS Cognito
    const user = await Auth.signIn(username, password);

    // Log successful authentication for debugging
    console.log("User authenticated successfully:", user.username);

    return user;
  } catch (error) {
    // Log authentication errors for debugging
    console.error("Authentication failed:", error);

    // Re-throw with user-friendly message
    throw new Error(`Authentication failed: ${error.message}`);
  }
};
```

#### Database with Aurora DSQL

```typescript
/**
 * PostgreSQL database connection pool
 * Uses AWS Aurora DSQL for scalable PostgreSQL database
 */
import { Pool } from "pg";

/**
 * Database connection pool instance
 * Handles connection pooling and query execution
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for optimal performance
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Fail fast if can't connect within 2 seconds
});

/**
 * Execute a parameterized query against the database
 * @param text - SQL query string with parameter placeholders
 * @param params - Array of parameter values
 * @returns Promise resolving to query result
 */
export const query = async (text: string, params?: any[]) => {
  // Log query for debugging (remove in production)
  console.log("Executing query:", text, params);

  try {
    // Execute query with connection pool
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    // Log database errors for debugging
    console.error("Database query failed:", error);
    throw error;
  }
};
```

#### Serverless Functions with Lambda

- Deploy API endpoints as Lambda functions
- Use AWS Lambda for background processing
- Integrate with EventBridge for event handling

### 5. API Routes Structure

```typescript
/**
 * API route handler for feature-specific endpoints
 * Following Next.js 15+ App Router conventions
 */

/**
 * GET /api/[feature] - Retrieve feature data
 * @param request - Next.js request object with URL and headers
 * @returns JSON response with feature data or error
 */
export async function GET(request: Request) {
  try {
    // Extract query parameters from request URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Validate required parameters
    if (!id) {
      return Response.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    // Fetch data from database or external service
    const data = await fetchFeatureData(id);

    // Return successful response
    return Response.json({ data });
  } catch (error) {
    // Log error for debugging
    console.error("GET /api/[feature] error:", error);

    // Return error response
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/[feature] - Create new feature data
 * @param request - Next.js request object with JSON body
 * @returns JSON response with created data or error
 */
export async function POST(request: Request) {
  try {
    // Parse JSON body from request
    const body = await request.json();

    // Validate request body using Zod schema
    const validatedData = featureSchema.parse(body);

    // Create new record in database
    const newRecord = await createFeatureRecord(validatedData);

    // Return success response with created data
    return Response.json({ data: newRecord }, { status: 201 });
  } catch (error) {
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error("POST /api/[feature] error:", error);

    // Return generic error response
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 6. Code Commenting Standards

**IMPORTANT: All code must include comprehensive comments explaining functionality**

#### JSDoc Comments for Functions and Components

```typescript
/**
 * Authenticates user with AWS Cognito
 * @param username - User's email or username
 * @param password - User's password
 * @returns Promise resolving to authenticated user object
 * @throws {Error} When authentication fails
 */
export const signIn = async (
  username: string,
  password: string
): Promise<CognitoUser> => {
  try {
    // Attempt authentication with AWS Cognito
    const user = await Auth.signIn(username, password);

    // Log successful authentication (remove in production)
    console.log("User authenticated successfully:", user.username);

    return user;
  } catch (error) {
    // Handle authentication errors gracefully
    console.error("Authentication failed:", error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
};
```

#### Inline Comments for Complex Logic

```typescript
export const calculateTotal = (items: CartItem[]): number => {
  // Filter out items that are not available
  const availableItems = items.filter((item) => item.isAvailable);

  // Calculate subtotal with tax considerations
  const subtotal = availableItems.reduce((total, item) => {
    // Apply quantity-based discounts
    const discountRate = item.quantity >= 10 ? 0.1 : 0;
    const itemTotal = item.price * item.quantity * (1 - discountRate);

    return total + itemTotal;
  }, 0);

  // Apply tax rate (8.5% default)
  const taxRate = 0.085;
  const finalTotal = subtotal * (1 + taxRate);

  // Round to 2 decimal places for currency
  return Math.round(finalTotal * 100) / 100;
};
```

#### API Route Comments

```typescript
/**
 * GET /api/users - Retrieve paginated list of users
 * @param request - Next.js request object with query parameters
 * @returns JSON response with users array and pagination info
 */
export async function GET(request: Request) {
  try {
    // Extract query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Calculate offset for database query
    const offset = (page - 1) * limit;

    // Fetch users from database with pagination
    const users = await db.user.findMany({
      skip: offset,
      take: limit,
      // Include user profile data
      include: {
        profile: true,
      },
    });

    // Return paginated response
    return Response.json({
      users,
      pagination: {
        page,
        limit,
        total: users.length,
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error fetching users:", error);

    // Return user-friendly error response
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
```

#### Database Schema Comments

```typescript
/**
 * User model representing system users
 * Includes authentication and profile information
 */
interface User {
  /** Unique identifier - UUID from Cognito */
  id: string;

  /** User's email address - used for authentication */
  email: string;

  /** Display name for the user */
  name: string;

  /** User role for authorization */
  role: "admin" | "user" | "moderator";

  /** Account creation timestamp */
  createdAt: Date;

  /** Last login timestamp - null if never logged in */
  lastLoginAt: Date | null;
}
```

#### React Hook Comments

```typescript
/**
 * Custom hook for managing user authentication state
 * Integrates with AWS Cognito and Redux store
 * @returns Object containing auth state and actions
 */
export const useAuth = () => {
  // Get current auth state from Redux store
  const { user, isLoading, error } = useSelector(selectAuth);
  const dispatch = useDispatch();

  /**
   * Sign in user with email and password
   * Updates Redux store on success
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        // Set loading state
        dispatch(setLoading(true));

        // Authenticate with AWS Cognito
        const cognitoUser = await Auth.signIn(email, password);

        // Update Redux store with user data
        dispatch(
          setUser({
            id: cognitoUser.attributes.sub,
            email: cognitoUser.attributes.email,
            name: cognitoUser.attributes.name,
          })
        );
      } catch (error) {
        // Handle authentication errors
        dispatch(setError(error.message));
      } finally {
        // Clear loading state
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return {
    user,
    isLoading,
    error,
    signIn,
  };
};
```

#### CSS/Tailwind Comments

```css
/* Global styles with custom CSS variables */
:root {
  /* Primary color palette */
  --color-primary: #3b82f6;
  --color-primary-dark: #1d4ed8;

  /* Semantic colors */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  /* Typography scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}

/* Component-specific utilities */
.btn-primary {
  /* Primary button styling with hover effects */
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg;
  @apply hover:bg-blue-700 transition-colors duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

#### Comment Guidelines Summary:

1. **Every function must have JSDoc comments** explaining purpose, parameters, and return values
2. **Complex logic requires inline comments** explaining the "why" not just the "what"
3. **All interfaces and types must be documented** with property descriptions
4. **API routes need comprehensive comments** including endpoint description and error handling
5. **CSS classes should explain their purpose** and when to use them
6. **React hooks require usage examples** in comments
7. **Error handling blocks must explain** what errors are expected and how they're handled
8. **Database queries should explain** the business logic behind them

## 🚀 Getting Started

### 1. Environment Setup

Create `.env.local` file with:

```env
# Database
DATABASE_URL=your_aurora_dsql_connection_string

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
COGNITO_USER_POOL_ID=your_user_pool_id
COGNITO_CLIENT_ID=your_client_id

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 2. Installation

```bash
npm install
# or
yarn install
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Development Server

```bash
npm run dev
# or
yarn dev
```

## 📦 Recommended Packages

### Core Dependencies

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "typescript": "^5.0.0",
  "@reduxjs/toolkit": "^2.0.0",
  "react-redux": "^9.0.0",
  "tailwindcss": "^3.4.0",
  "zod": "^3.22.0",
  "aws-sdk": "^2.1500.0"
}
```

### AWS Integration

```json
{
  "aws-amplify": "^6.0.0",
  "@aws-sdk/client-dynamodb": "^3.0.0",
  "@aws-sdk/client-lambda": "^3.0.0",
  "@aws-sdk/client-s3": "^3.0.0",
  "@aws-sdk/client-cognito-identity-provider": "^3.0.0"
}
```

### Database & Validation

```json
{
  "pg": "^8.11.0",
  "@types/pg": "^8.10.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0"
}
```

## 🔧 Build & Deployment

### Production Build

```bash
npm run build
npm run start
```

### AWS Deployment

- Use AWS CodePipeline for CI/CD
- Deploy to AWS Lambda for serverless
- Use CloudFront for global distribution
- Store static assets in S3

## 📚 Best Practices

1. **Type Safety**: Always use TypeScript interfaces and types
2. **Error Handling**: Implement proper error boundaries and try-catch blocks
3. **Performance**: Use React.memo, useMemo, and useCallback appropriately
4. **Accessibility**: Follow WCAG guidelines and use semantic HTML
5. **Security**: Validate all inputs and sanitize data
6. **Testing**: Write unit tests for critical functions
7. **Documentation**: Document complex logic and API endpoints

## 🔍 Monitoring & Logging

- Use AWS CloudWatch for application monitoring
- Implement AWS X-Ray for distributed tracing
- Set up proper error logging and alerting
- Monitor performance metrics and user analytics

## 📞 Support & Resources

- AWS Documentation: https://docs.aws.amazon.com/
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Redux Toolkit: https://redux-toolkit.js.org/

---

**Note**: This instruction file should be updated as the project evolves and new features are added.
