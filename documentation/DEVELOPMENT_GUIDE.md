# Development Guide

This guide provides information for developers working on the Sales Dashboard application.

## Architecture Overview

The Sales Dashboard is a full-stack application with the following components:

- **Frontend**: React 18 with TypeScript, Vite for bundling
- **Backend**: Express.js with TypeScript  
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: React Query for server state
- **Routing**: Wouter for client-side routing

## Project Structure

```
SalesDashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components  
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                # Backend Express application
│   ├── database/          # Legacy SQL schema (not used)
│   ├── index.ts           # Main server entry point
│   ├── routes.ts          # API route definitions  
│   ├── storage_new.ts     # Database operations
│   └── vite.ts            # Vite dev server integration
├── shared/                # Shared code between client/server
│   └── schema.ts          # Drizzle database schema
├── drizzle/               # Database migrations
└── documentation/         # Project documentation
```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account and project

### Initial Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd SalesDashboard
   npm install
   ```

2. **Environment configuration:**
   Create a `.env` file in the project root:
   ```
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   NODE_ENV=development
   PORT=3000
   ```

3. **Database setup:**
   ```bash
   npm run db:push
   ```
   This creates all tables in your Supabase database based on the schema.

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Development Workflow

**Frontend Development (port 5173):**
- Vite dev server with hot module replacement
- React components with TypeScript
- Tailwind CSS for styling
- API calls proxied to backend server

**Backend Development (port 3000):**
- Express server with TypeScript via tsx
- Automatic restart on file changes
- Database operations via Drizzle ORM
- API endpoints serve JSON responses

**Available Scripts:**

```bash
npm run dev          # Start development servers
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push schema changes to database
```

## Database Operations

### Schema Management

The database schema is defined in `shared/schema.ts` using Drizzle ORM:

```typescript
// Example table definition
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phase: text("phase").notNull(),
  // ... other fields
});
```

### Making Schema Changes

1. Update the schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes to Supabase
3. Update TypeScript types if needed

### Database Operations

Database operations are centralized in `server/storage_new.ts`:

```typescript
// Example: Get all customers
export async function getCustomers() {
  return await db.select().from(customers);
}

// Example: Create a new customer  
export async function createCustomer(data: InsertCustomer) {
  return await db.insert(customers).values(data).returning();
}
```

## API Development

### Adding New Endpoints

API routes are defined in `server/routes.ts`:

```typescript
// Example route definition
app.get("/api/customers", async (req, res) => {
  try {
    const customers = await getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});
```

### API Conventions

- All API routes start with `/api/`
- Use RESTful conventions (GET, POST, PUT, DELETE)
- Return JSON responses
- Include error handling with appropriate HTTP status codes
- Use TypeScript types for request/response data

## Frontend Development

### Component Structure

Components are organized by feature and reusability:

- `components/ui/` - Basic UI components (buttons, inputs, etc.)
- `components/` - Feature-specific components
- `pages/` - Full page components

### State Management

- **Server State**: React Query for API data
- **Client State**: React useState/useReducer
- **Form State**: React Hook Form with Zod validation

### Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible component primitives
- **CSS Variables**: For theme colors and spacing

### Adding New Pages

1. Create component in `client/src/pages/`
2. Add route in main App component
3. Update navigation if needed

## Testing

Currently, the project does not have automated tests configured. Consider adding:

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Playwright or Cypress
- **API Tests**: Supertest for Express endpoints

## Code Quality

### TypeScript

- Strict TypeScript configuration
- Shared types between client and server
- Drizzle generates type-safe database operations

### Recommended Extensions

For VS Code development:

- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Auto Rename Tag

## Common Development Tasks

### Adding a New Data Table

1. Define the table schema in `shared/schema.ts`
2. Add database operations in `server/storage_new.ts`
3. Create API endpoints in `server/routes.ts`
4. Build frontend components for CRUD operations
5. Add navigation and routing

### Debugging

**Backend Issues:**
- Check server console output
- Verify database connection
- Test API endpoints with curl or Postman

**Frontend Issues:**
- Use browser developer tools
- Check React Query dev tools
- Verify API responses in Network tab

**Database Issues:**
- Check Supabase dashboard
- Verify schema matches `shared/schema.ts`
- Use `npm run db:push` to sync schema

## Performance Considerations

- **Database**: Use indexes for frequently queried columns
- **API**: Implement pagination for large datasets
- **Frontend**: Lazy load components and routes
- **Caching**: React Query handles API response caching

## Security Notes

- **Authentication**: Currently not implemented (users table exists but unused)
- **Authorization**: No permission checks implemented
- **Environment Variables**: Never commit `.env` to version control
- **Supabase**: Uses Row Level Security (RLS) policies when configured

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment instructions.
