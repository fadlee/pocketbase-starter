# PocketBase JavaScript Quick Reference

## Essential Globals

```javascript
__hooks          // Absolute path to pb_hooks directory
$app             // PocketBase application instance
$apis            // API routing helpers and middlewares
$os              // OS level primitives
$security        // Security helpers (JWT, encryption, etc.)
```

## File Setup

```javascript
/// <reference path="../pb_data/types.d.ts" />

// Your code here
```

## Route Registration

```javascript
// Basic route
routerAdd("GET", "/api/endpoint", (c) => {
    return c.json(200, { message: "Hello" });
});

// Route with parameters
routerAdd("GET", "/api/users/{id}", (c) => {
    const id = c.request.pathValue("id");
    return c.json(200, { userId: id });
});

// Route with middleware
routerAdd("GET", "/api/protected", (c) => {
    return c.json(200, { data: "secret" });
}, $apis.requireAuth());
```

## Common Hook Patterns

### Bootstrap Hook
```javascript
onBootstrap((e) => {
    e.next();
    // Initialization code here
});
```

### Record Hooks
```javascript
// Before create
onRecordBeforeCreateRequest((e) => {
    // Validate or modify record before creation
    e.record.set("status", "pending");
    e.next();
}, "collection_name");

// After create success
onRecordAfterCreateSuccess((e) => {
    // Post-creation actions
    console.log("Record created:", e.record.id);
    e.next();
}, "collection_name");

// Before update
onRecordBeforeUpdateRequest((e) => {
    // Validate or modify record before update
    e.next();
}, "collection_name");

// Before delete
onRecordBeforeDeleteRequest((e) => {
    // Check permissions or log deletion
    e.next();
}, "collection_name");
```

### Mailer Hooks
```javascript
onMailerSend((e) => {
    // Customize email before sending
    e.message.subject = "Custom: " + e.message.subject;
    e.next();
});
```

## Database Operations

### Find Records
```javascript
// Find by ID
const record = $app.findRecordById("collection_name", "record_id");

// Find first matching
const record = $app.findFirstRecordByFilter(
    "collection_name", 
    "email = 'user@example.com'"
);

// Find all matching
const records = $app.findRecordsByFilter(
    "collection_name",
    "status = 'active'",
    "-created", // sort
    10          // limit
);
```

### Create/Update Records
```javascript
// Create new record
const collection = $app.findCollectionByNameOrId("collection_name");
const record = new Record(collection);
record.set("field_name", "value");
$app.save(record);

// Update existing record
record.set("field_name", "new_value");
$app.save(record);

// Delete record
$app.delete(record);
```

### Custom Queries
```javascript
// Raw SQL query
const result = new DynamicList({
    "id": "",
    "name": "",
    "count": 0
});

$app.dao().db()
    .select("id", "name", "COUNT(*) as count")
    .from("table_name")
    .where("status = 'active'")
    .groupBy("name")
    .orderBy("count DESC")
    .limit(10)
    .all(result);
```

## Request/Response Handling

### Request Data
```javascript
routerAdd("POST", "/api/endpoint", (c) => {
    // Get request data
    const requestData = $apis.requestData(c);
    
    // Get JSON body
    const body = c.request.json();
    
    // Get form data
    const formData = c.request.formData();
    
    // Get query parameters
    const param = c.request.query("param_name");
    
    // Get headers
    const header = c.request.header("header_name");
    
    return c.json(200, { received: body });
});
```

### Response Types
```javascript
// JSON response
return c.json(200, { data: "value" });

// String response
return c.string(200, "Hello World");

// HTML response
return c.html(200, "<h1>Hello</h1>");

// Redirect
return c.redirect(302, "/new-path");

// File response
return c.file("/path/to/file.pdf");
```

## Authentication & Authorization

### Check Authentication
```javascript
routerAdd("GET", "/api/protected", (c) => {
    const requestData = $apis.requestData(c);
    
    // Check if user is authenticated
    if (!requestData.auth) {
        return c.json(401, { error: "Unauthorized" });
    }
    
    // Check if admin
    if (!requestData.admin) {
        return c.json(403, { error: "Admin required" });
    }
    
    return c.json(200, { user: requestData.auth.id });
});
```

### Middleware
```javascript
// Require authentication
routerAdd("GET", "/api/protected", handler, $apis.requireAuth());

// Require admin
routerAdd("GET", "/api/admin", handler, $apis.requireAdminAuth());

// Activity logging
routerAdd("POST", "/api/action", handler, $apis.activityLogger($app));
```

## Email Sending

```javascript
// Create and send email
const message = new MailerMessage({
    from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
    },
    to: [{ address: "recipient@example.com" }],
    subject: "Your Subject",
    html: "<h1>HTML Content</h1>",
    text: "Plain text content"
});

$app.newMailClient().send(message);
```

## File Operations

```javascript
// Read file
const content = $os.readFile("/path/to/file.txt");

// Write file
$os.writeFile("/path/to/file.txt", "content", 0644);

// Check if file exists
const exists = $os.fileExists("/path/to/file.txt");

// Create directory
$os.mkdirAll("/path/to/directory", 0755);
```

## Security Helpers

```javascript
// Generate random string
const randomStr = $security.randomString(32);

// Hash password
const hashedPassword = $security.hashPassword("password123");

// Verify password
const isValid = $security.compareHashAndPassword(hashedPassword, "password123");

// Generate JWT
const token = $security.createJWT({
    "user_id": "123",
    "exp": Math.floor(Date.now() / 1000) + 3600 // 1 hour
}, "secret_key");

// Parse JWT
const claims = $security.parseJWT(token, "secret_key");
```

## Error Handling Template

```javascript
routerAdd("GET", "/api/endpoint", (c) => {
    try {
        // Your logic here
        const result = performOperation();
        
        return c.json(200, {
            status: "success",
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in /api/endpoint:", error);
        
        return c.json(500, {
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
});
```

## Module Loading

```javascript
// Load module from pb_hooks directory
const utils = require(`${__hooks}/utils/helpers.js`);

// Load configuration
const config = require(`${__hooks}/config.js`);

// Use in handler
routerAdd("GET", "/api/endpoint", (c) => {
    const helper = require(`${__hooks}/utils/helpers.js`);
    const result = helper.processData(data);
    return c.json(200, result);
});
```

## Common Patterns

### API Documentation Endpoint
```javascript
routerAdd("GET", "/api", (c) => {
    const apiInfo = {
        name: "My API",
        version: "1.0.0",
        status: "active",
        endpoints: [
            {
                path: "/api/users",
                method: "GET",
                description: "Get all users"
            }
        ],
        timestamp: new Date().toISOString()
    };
    
    return c.json(200, apiInfo);
});
```

### Health Check Endpoint
```javascript
routerAdd("GET", "/health", (c) => {
    return c.json(200, {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime ? process.uptime() : "unknown"
    });
});
```

### CORS Headers
```javascript
routerAdd("OPTIONS", "/api/*", (c) => {
    c.response.header("Access-Control-Allow-Origin", "*");
    c.response.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.response.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return c.string(200, "");
});
```

This quick reference covers the most commonly used PocketBase JavaScript patterns and APIs for rapid development.