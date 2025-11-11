# Supabase Authentication Integration

This document describes the Supabase authentication integration for the Atendechat application, which provides multi-tenant, role-based access control with automatic tenant isolation.

## Overview

The integration provides:
- **Multi-tenant authentication** with automatic tenant isolation
- **Role-based access control (RBAC)** with flexible permissions
- **Automatic database query filtering** by tenant/company
- **Seamless JWT token management** with auto-refresh
- **Backward compatibility** with existing authentication system

## Architecture

### Backend Components

1. **Supabase Authentication Middleware** (`middleware/supabaseAuth.ts`)
   - Verifies Supabase JWT tokens
   - Extracts user metadata (roles, tenant_id, company_id)
   - Attaches user context to requests

2. **Tenant Context System** (`middleware/tenantContext.ts`)
   - Provides automatic tenant isolation at database level
   - Uses Sequelize hooks to filter queries by company_id
   - Ensures data separation between tenants

3. **Request Context Middleware** (`middleware/requestContext.ts`)
   - Sets tenant context for each request
   - Automatically clears context after response

4. **RBAC Middleware** (`middleware/rbac.ts`)
   - Role-based access control functions
   - Supports both new roles and legacy profile system
   - Provides common permission levels (user, agent, admin, super_admin)

5. **Supabase Session Controller** (`controllers/SupabaseSessionController.ts`)
   - Handles authentication endpoints (login, signup, refresh, logout)
   - Manages user metadata updates
   - Provides user information endpoints

### Frontend Components

1. **Supabase Auth Hook** (`hooks/useSupabaseAuth.js`)
   - Manages authentication state
   - Handles token refresh automatically
   - Provides login/logout functions
   - Integrates with React Router and Socket.io

2. **Hybrid Auth Context** (`context/Auth/AuthContextHybrid.js`)
   - Supports both legacy and Supabase authentication
   - Automatically detects configuration and uses appropriate auth method
   - Maintains backward compatibility

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration script `backend/supabase-migration.sql` in your Supabase SQL editor
3. Configure Row Level Security (RLS) policies as provided in the migration
4. Get your project credentials from Settings > API

### 2. Environment Configuration

#### Backend (`backend/.env`)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

#### Frontend (`frontend/.env`)
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Migration

The system includes automatic database hooks that ensure tenant isolation. When configured properly:

- All SELECT queries automatically filter by `company_id`
- All CREATE operations automatically set `company_id` and `tenant_id`
- Bulk operations respect tenant boundaries

### 4. Frontend Integration

To use Supabase authentication in your frontend:

```javascript
// Option 1: Use the hybrid context (recommended)
import { AuthContext } from '../context/Auth/AuthContextHybrid';

// Option 2: Use Supabase auth directly
import useSupabaseAuth from '../hooks/useSupabaseAuth';

const MyComponent = () => {
  const { user, isAuth, handleLogin, handleLogout } = useContext(AuthContext);
  
  // Authentication methods work the same regardless of backend
  const login = () => handleLogin({ email, password });
  const logout = () => handleLogout();
};
```

## API Endpoints

### Authentication Routes (`/supabase-auth/`)

- `POST /supabase-auth/login` - User login
- `POST /supabase-auth/refresh` - Refresh access token
- `POST /supabase-auth/logout` - User logout (authenticated)
- `GET /supabase-auth/me` - Get current user info (authenticated)
- `PUT /supabase-auth/me` - Update current user (authenticated)
- `POST /supabase-auth/signup` - Create new user (admin only)
- `PUT /supabase-auth/users/:userId` - Update user (admin only)

### Protected Routes

All existing routes can be protected using the new middleware:

```typescript
import supabaseAuth from "../middleware/supabaseAuth";
import { setRequestContext } from "../middleware/requestContext";
import { hasRole, isAdmin } from "../middleware/rbac";

// Apply middleware chain
router.use(supabaseAuth);
router.use(setRequestContext);

// Use role-based permissions
router.get("/users", hasRole("admin"), UserController.index);
router.post("/users", isAdmin, UserController.store);
```

## User Roles and Permissions

### Role Hierarchy
1. **user** - Basic user access
2. **agent** - Customer service agent
3. **admin** - Company administrator
4. **super_admin** - System administrator (multi-tenant)

### Permission Middleware
- `hasRole(roles)` - Check if user has any of the specified roles
- `isUser` - User level and above
- `isAgent` - Agent level and above  
- `isAdmin` - Admin level and above
- `isSuperAdmin` - Super admin only
- `isSuper` - Legacy compatibility for super admin

## Multi-Tenant Architecture

### Tenant Isolation
- Each user belongs to a `company_id` and `tenant_id`
- Database queries are automatically filtered by company
- Row Level Security (RLS) policies enforce data separation
- Admin users can only access data within their company
- Super admins can access all companies

### Automatic Query Filtering
```typescript
// This query automatically filters by user's company_id
const tickets = await Ticket.findAll(); 

// The system adds: WHERE company_id = <user_company_id>
```

### Request Context
Each authenticated request automatically:
1. Sets tenant context from user JWT
2. Applies database filtering hooks
3. Clears context after response
4. Ensures complete data isolation

## Migration from Legacy Auth

The system supports both authentication methods simultaneously:

1. **Automatic Detection**: Frontend detects Supabase configuration
2. **Gradual Migration**: Migrate users incrementally
3. **Data Compatibility**: Existing data structures work as-is
4. **Route Compatibility**: Existing routes continue to work

### Migration Steps
1. Set up Supabase project and run migrations
2. Configure environment variables
3. Test with new users first
4. Gradually migrate existing users
5. Update frontend to use hybrid context
6. Switch to Supabase-only routes when ready

## Security Features

### JWT Token Security
- Tokens are verified against Supabase
- Automatic token refresh prevents expiration
- Secure HTTP-only cookie option available
- Token versioning for logout security

### Multi-Tenant Security
- Row Level Security (RLS) enforced at database level
- Automatic tenant filtering prevents data leaks
- Admin users isolated to their company
- Super admin access properly controlled

### Role-Based Access
- Flexible role assignment via metadata
- Granular permission control
- Legacy profile system compatibility
- Hierarchical role inheritance

## Troubleshooting

### Common Issues

1. **Token Verification Failed**
   - Check SUPABASE_JWT_SECRET matches Supabase project
   - Verify SUPABASE_URL is correct
   - Ensure service role key has proper permissions

2. **Tenant Isolation Not Working**
   - Verify database hooks are properly installed
   - Check user has company_id and tenant_id set
   - Ensure RLS policies are enabled

3. **Frontend Auth Not Working**
   - Check environment variables are set
   - Verify CORS settings in Supabase
   - Ensure redirect URLs are configured

### Debug Mode
Enable debug logging by setting:
```bash
DB_DEBUG=true
NODE_ENV=development
```

## Performance Considerations

### Database Optimization
- Indexes created for company_id and tenant_id
- Efficient query patterns with automatic filtering
- Connection pooling configured for multi-tenant load

### Token Management
- Automatic token refresh every 50 minutes
- Minimal API calls for token verification
- Efficient caching of user context

### Frontend Optimization
- Auth state cached in local storage
- Minimal re-renders on auth changes
- Socket reconnection on token refresh

## Support and Maintenance

### Monitoring
- Track authentication success/failure rates
- Monitor tenant isolation effectiveness
- Watch for permission escalation attempts

### Updates
- Keep Supabase client libraries updated
- Monitor Supabase service announcements
- Test authentication flows after updates

### Backup and Recovery
- Regular backup of user metadata
- Test disaster recovery procedures
- Document migration rollback procedures