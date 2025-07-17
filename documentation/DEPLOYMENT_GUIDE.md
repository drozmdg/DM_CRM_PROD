# Deployment Guide

This guide provides the necessary ste## 4. Running in Production

After building the application, you can start it in production mode. This command runs the optimized server code from the `dist/` directory.

From the project root, run:

```bash
npm start
```

This starts the Express server which serves both the API and the built React frontend.

### Using a Process Manager

For a more robust production deployment, it is highly recommended to use a process manager like `pm2`. A process manager will automatically restart the application if it crashes and can handle clustering to improve performance.

**Example with `pm2`:**

1. Install `pm2` globally: `npm install -g pm2`
2. Start the application: `pm2 start dist/index.js --name sales-dashboard`
3. Save the pm2 configuration: `pm2 save`
4. Setup pm2 to start on boot: `pm2 startup`

## 5. Development vs Production

### Development Mode
```bash
npm run dev
```
- Runs the backend with `tsx` for TypeScript execution
- Frontend served by Vite dev server with HMR
- Backend runs on port 3000, frontend on port 5173
- API requests proxied from frontend to backend

### Production Mode  
```bash
npm run build && npm start
```
- Backend compiled to JavaScript with esbuild
- Frontend built and served statically by Express
- Single server on port 3000 serves everythingon to deploy the Sales Dashboard application.

## 1. Environment Variables

To run the application, you must create a `.env` file in the **project root directory**. This file should contain the following variables. **The application will not start without these keys.**

```
# Supabase Configuration
# These keys connect the application to the database.
# Replace the placeholder values with your actual Supabase project credentials.
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Server Configuration
# The environment can be 'development' or 'production'.
NODE_ENV=development

# The port the backend server will run on.
PORT=3000
```

### Obtaining Supabase Credentials

1.  Log in to your [Supabase account](https://supabase.com/).
2.  Navigate to your project's dashboard.
3.  Go to **Project Settings** > **API**.
4.  You will find the **Project URL** (`SUPABASE_URL`) and the **Project API Keys** (`SUPABASE_ANON_KEY`) here.

## 2. Database Setup

The application uses Supabase as the database provider. Before deployment:

1. Create a Supabase project at [supabase.com](https://supabase.com/)
2. Run the database migrations using Drizzle:
   ```bash
   npm run db:push
   ```
3. This will create all necessary tables based on the schema defined in `shared/schema.ts`

## 3. Building the Application

Before deploying, you need to create a production-ready build of the application. This command bundles the frontend using Vite and the backend using esbuild into an optimized `dist/` directory.

From the project root, run:

```bash
npm install
npm run build
```

The build process:
- Builds the React frontend with Vite
- Bundles the Express backend with esbuild
- Outputs everything to the `dist/` directory

## 3. Running in Production

After building the application, you can start it in production mode. This command runs the optimized server code from the `dist/` directory.

From the project root, run:

```bash
npm start
```

### Using a Process Manager

For a more robust production deployment, it is highly recommended to use a process manager like `pm2`. A process manager will automatically restart the application if it crashes and can handle clustering to improve performance.

**Example with `pm2`:**

1.  Install `pm2` globally: `npm install -g pm2`
2.  Start the application: `pm2 start dist/index.js --name sales-dashboard`

## 6. Deployment Environment

This application is designed to be deployed on any platform that supports Node.js. Common choices include:

* **Virtual Private Servers (VPS):** DigitalOcean, Linode, Vultr
* **Platform as a Service (PaaS):** Heroku, Railway, Render
* **Cloud Providers:** AWS (EC2, Elastic Beanstalk), Google Cloud (App Engine), Azure (App Service)

### Environment Requirements
- Node.js 18+ 
- npm or yarn package manager
- Internet access for Supabase connection

### Environment Variables in Production
When deploying, ensure that you set:
- `NODE_ENV=production`
- Valid `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- `PORT` (defaults to 3000 if not set)

### Platform-Specific Notes

**Heroku/Railway/Render:**
- These platforms automatically set the `PORT` environment variable
- Ensure your `.env` file is not committed to git
- Use platform-specific environment variable settings

**VPS/Cloud:**
- Use a process manager like `pm2`
- Setup reverse proxy with nginx for HTTPS
- Consider using a load balancer for multiple instances

## 7. Health Checks and Monitoring

The application exposes basic health check endpoints:
- API health: `GET /api/health` (if implemented)
- Basic server response: Any API endpoint will indicate server status

For production monitoring, consider:
- Application monitoring (New Relic, DataDog)
- Log aggregation (LogRocket, Papertrail)
- Uptime monitoring (UptimeRobot, Pingdom)
