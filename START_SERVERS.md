# Starting the Panic Ring Application

## Prerequisites
- Node.js >= 18.0.0
- npm

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
The backend will start on **http://localhost:3001**

### 2. Start the Frontend Development Server
```bash
npm run dev
```
The frontend will start on **http://localhost:5173**

### 3. Access the Application
Open your browser and navigate to:
**http://localhost:5173**

## How It Works

- **Backend**: Express.js server running on port 3001
  - API endpoints: `/api/auth`, `/api/entities`, `/api/functions`, `/api/health`
  - Database: SQLite (better-sqlite3) stored in `backend/data/panicring.db`
  
- **Frontend**: Vite + React app running on port 5173
  - Vite proxy configuration forwards `/api/*` requests to `http://localhost:3001`
  - This eliminates CORS issues during development

## Environment Variables

### Backend (.env)
Located at `backend/.env`:
- `PORT=3001` - Backend server port
- `JWT_SECRET` - Secret for JWT token signing
- `FRONTEND_URL` - Allowed frontend origin for CORS
- PayFast settings for payment integration

### Frontend (.env)
Located at root `.env`:
- `VITE_API_URL` - Leave empty for local development (uses Vite proxy)

## Testing the Connection

### Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-03T14:21:38.399Z",
  "uptime": 140,
  "version": "2.1.0"
}
```

### Through Vite Proxy
```bash
curl http://localhost:5173/api/health
```
Should return the same response (proxied through Vite).

## Troubleshooting

### HTTP 404 Errors
- **Cause**: Backend server not running
- **Solution**: Start the backend with `cd backend && npm run dev`

### Port Already in Use
- **Backend (3001)**: Another process is using port 3001
  - Find and stop the process: `netstat -ano | findstr :3001`
- **Frontend (5173)**: Another Vite instance is running
  - Find and stop the process: `netstat -ano | findstr :5173`

### CORS Errors
- Ensure `FRONTEND_URL` in `backend/.env` includes `http://localhost:5173`
- The backend is configured to allow all localhost origins automatically

## Production Deployment

For production deployment instructions, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Database

The SQLite database is automatically created on first run at:
```
backend/data/panicring.db
```

Schema includes tables for:
- users
- safety_profiles
- emergency_contacts
- alerts
- safe_zones
- shared_devices
- location_streams
- community_incidents
- journeys

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

### Entities (CRUD)
- `POST /api/entities/:entityName/filter` - Filter entities
- `GET /api/entities/:entityName/list` - List entities
- `GET /api/entities/:entityName/:id` - Get entity by ID
- `POST /api/entities/:entityName` - Create entity
- `PATCH /api/entities/:entityName/:id` - Update entity
- `DELETE /api/entities/:entityName/:id` - Delete entity

Supported entities:
- SafetyProfile
- EmergencyContact
- Alert
- SafeZone
- SharedDevice

### Functions
- `POST /api/functions/:functionName` - Invoke serverless function

### Advanced Features
- Journey tracking
- Live location streaming
- Community incident reporting
- Safe zone management

### Payment Integration
- PayFast integration for subscriptions
- Sandbox mode enabled by default

## Development Tips

1. **Auto-restart**: The backend uses `start.js` wrapper for auto-restart on crashes
2. **Hot reload**: Frontend supports Vite HMR (Hot Module Replacement)
3. **Logging**: Backend logs all requests in development mode with timing
4. **Rate limiting**: Auth endpoints limited to 20 requests per minute per IP
