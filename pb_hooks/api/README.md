# API Endpoints

This directory contains all custom API endpoints for the PocketBase application.

## Structure

```
pb_hooks/
├── custom-api.pb.js     # Main API router and documentation endpoint
├── api/
│   ├── server-time.js   # Server time endpoint implementation
│   └── README.md        # This file
└── pocketpages.pb.js    # PocketPages integration
```

## How It Works

The API system is organized as follows:
- `custom-api.pb.js` - Main entry point that loads all API endpoints and provides documentation
- `api/` directory - Contains individual API endpoint implementations
- Each endpoint is a separate `.js` file that uses PocketBase's `routerAdd()` function

## Available Endpoints

### GET /api
Returns API documentation and available endpoints.

**Response:**
```json
{
  "name": "PocketBase API",
  "version": "1.0.0",
  "status": "active",
  "endpoints": [...],
  "timestamp": "2025-07-16T08:36:42.408Z"
}
```

### GET /api/server-time
Returns current server timestamp in multiple formats.

**Implementation:** `api/server-time.js`

**Response:**
```json
{
  "timestamp": 1752655002408,
  "iso": "2025-07-16T08:36:42.408Z",
  "utc": "Wed, 16 Jul 2025 08:36:42 GMT",
  "unix": 1752655002,
  "local": "Wed Jul 16 2025 15:36:42 GMT+0700 (WIB)",
  "status": "success"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Internal server error",
  "error": "Error details"
}
```

## Adding New Endpoints

1. Create a new `.js` file in the `api/` directory (e.g., `my-endpoint.js`)
2. Use the `routerAdd()` function to define your routes
3. Add the require statement to `custom-api.pb.js`
4. Update the endpoints documentation in the `/api` endpoint within `custom-api.pb.js`
5. Update this README file

### Step-by-step Example

1. **Create the endpoint file** (`api/users.js`):
```javascript
routerAdd("GET", "/api/users", (c) => {
  // Your implementation
});
```

2. **Load it in custom-api.pb.js**:
```javascript
require(`${__hooks}/api/users.js`);
```

3. **Add documentation** to the endpoints array in `custom-api.pb.js`:
```javascript
{
  path: "/api/users",
  method: "GET",
  description: "Get all users"
}
```

### API Documentation Metadata

Each endpoint file should export documentation metadata using `module.exports`. This metadata is automatically collected and displayed in the `/api` documentation endpoint.

**Required metadata format:**
```javascript
module.exports = [{
  path: "/api/endpoint-name",
  method: "GET",
  description: "Brief description of what this endpoint does",
  group: "Category" // Optional: for grouping endpoints
}];
```

**Example from server-time.js:**
```javascript
module.exports = [{
  path: "/api/server-time",
  method: "GET",
  description: "Get current server timestamp in multiple formats",
  group: "System",
  version: "1.0.0"
}];
```

### Example Template

```javascript
/// <reference path="../../pb_data/types.d.ts" />

// My endpoint API
// GET /api/my-endpoint - Description of what this endpoint does

// Export the endpoint documentation
module.exports = [{
  path: "/api/my-endpoint",
  method: "GET",
  description: "Description of what this endpoint does",
  group: "Custom",
  version: "1.0.0"
}];

routerAdd("GET", "/api/my-endpoint", (c) => {
  try {
    // Your logic here
    const data = {
      message: "Hello from my endpoint",
      timestamp: new Date().toISOString(),
      status: "success"
    };
    
    return c.json(200, data);
  } catch (error) {
    return c.json(500, {
      status: "error",
      message: "Internal server error",
      error: error.message
    });
  }
});
```

## Best Practices

1. **Error Handling**: Always wrap your logic in try-catch blocks
2. **Consistent Response Format**: Use consistent JSON response structure
3. **HTTP Status Codes**: Use appropriate HTTP status codes
4. **Documentation**: Update the API documentation when adding new endpoints
5. **File Naming**: Use kebab-case for file names (e.g., `user-profile.js`)
6. **Route Naming**: Use RESTful conventions for route paths
7. **Type Safety**: Include the TypeScript reference comment for better IDE support
8. **Comments**: Add descriptive comments explaining the endpoint's purpose
9. **Loading**: Remember to require your new endpoint in `custom-api.pb.js`

## Testing API Endpoints

You can test the API endpoints using curl or any HTTP client:

```bash
# Test the API documentation endpoint
curl http://localhost:8090/api

# Test the server time endpoint
curl http://localhost:8090/api/server-time

# Pretty print JSON responses
curl -s http://localhost:8090/api | jq .
```

## Response Format Standards

### Success Response
```json
{
  "status": "success",
  "data": {},
  "timestamp": "ISO string (optional)"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Human readable error message",
  "error": "Technical error details (optional)"
}
```

## Notes

- All API endpoints are automatically loaded when PocketBase starts
- The main router (`custom-api.pb.js`) provides automatic API documentation at `/api`
- Individual endpoint files should focus on a single responsibility
- Use TypeScript reference comments for better IDE support and type checking