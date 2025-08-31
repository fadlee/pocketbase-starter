# PocketBase JavaScript Hooks - Complete Guide

## Overview

PocketBase v0.17+ includes an embedded ES5 JavaScript engine (goja) that enables custom server-side code using plain JavaScript. This guide covers everything you need to know about implementing JavaScript hooks in PocketBase.

## JavaScript Engine Basics

### File Structure
- Create `*.pb.js` files inside a `pb_hooks` directory next to your executable
- Files are loaded per their filename sort order
- Automatic restart/reload when files change (UNIX platforms only)

### Key Differences from Standard JavaScript
- Go exported method/field names are converted to camelCase
- `app.FindRecordById("example", "RECORD_ID")` becomes `$app.findRecordById("example", "RECORD_ID")`
- Errors are thrown as JavaScript exceptions, not returned as Go values
- ES5 standard only - no Node.js or browser APIs

## Global Objects

PocketBase provides several global objects accessible from anywhere:

| Object | Description |
|--------|-------------|
| `__hooks` | Absolute path to the app pb_hooks directory |
| `$app` | Current running PocketBase application instance |
| `$apis.*` | API routing helpers and middlewares |
| `$os.*` | OS level primitives (deleting directories, executing shell commands) |
| `$security.*` | Security helpers (JWTs, random string generation, AES encryption) |

## TypeScript Support

### Ambient Declarations
- PocketBase ships with TypeScript declarations in `pb_data/types.d.ts`
- Use triple-slash directive for IDE support:
```javascript
/// <reference path="../pb_data/types.d.ts" />
```
- Can rename files to `.pb.ts` extension for better linting

## Critical Caveats and Limitations

### Handler Scope Isolation
**IMPORTANT**: Each handler function is serialized and executed in its own isolated context.

❌ **This will NOT work:**
```javascript
const name = "test"

onBootstrap((e) => {
    e.next()
    console.log(name) // name will be undefined inside the handler
})
```

✅ **Use modules instead:**
```javascript
onBootstrap((e) => {
    e.next()
    const config = require(`${__hooks}/config.js`)
    console.log(config.name)
})

// pb_hooks/config.js
module.exports = {
  name: "My App",
  version: "1.0.0",
};
```

### Relative Paths
- Relative paths are relative to current working directory (CWD), NOT to pb_hooks
- Always use `__hooks` global variable for absolute paths:
```javascript
require(`${__hooks}/api/server-time.js`); // ✅ Correct
require('./api/server-time.js');          // ❌ May not work
```

### Module Loading Limitations
- **NOT** a Node.js or browser environment
- Modules relying on `window`, `fs`, `fetch`, `buffer` or other runtime-specific APIs won't work
- Only CommonJS (CJS) modules supported with `require()`
- ECMAScript modules (ESM) need pre-compilation with bundlers

## Common Hook Patterns

### Basic Route Registration
```javascript
routerAdd("GET", "/hello/{name}", (e) => {
    let name = e.request.pathValue("name")
    return e.json(200, { "message": "Hello " + name })
})
```

### Record Hooks
```javascript
onRecordAfterUpdateSuccess((e) => {
    console.log("user updated...", e.record.get("email"))
    e.next()
}, "users")
```

### Bootstrap Hook
```javascript
onBootstrap((e) => {
    e.next()
    console.log("App initialized!")
})
```

### Custom API with Error Handling
```javascript
routerAdd("GET", "/api/server-time", (c) => {
    try {
        const now = new Date();
        const serverTime = {
            timestamp: Date.now(),
            iso: now.toISOString(),
            utc: now.toUTCString(),
            unix: Math.floor(Date.now() / 1000),
            local: now.toString(),
            status: "success"
        };
        return c.json(200, serverTime);
    } catch (error) {
        return c.json(500, {
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
});
```

## Advanced Features

### Database Queries
```javascript
// Custom database query example
let result = new DynamicList({
    "columnA": "",
    "columnB": [],
    "total": 0,
});

$app.dao().db()
    .select("columnA", "columnB", "sum(columnC) as total")
    .from("example")
    .limit(100)
    .groupBy("columnA")
    .all(result)

console.log(result[0].total)
```

### Email Sending
```javascript
let message = new MailerMessage({
    from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
    },
    to: [{address: "test@example.com"}],
    subject: "YOUR_SUBJECT...",
    html: "YOUR_HTML_BODY...",
})

$app.newMailClient().send(message);
```

### Request Data Access
```javascript
$app.onRecordBeforeCreateRequest("posts").add((e) => {
    let requestData = $apis.requestData(e.httpContext)

    // if not an admin, overwrite the newly submitted "posts" record status to pending
    if (!requestData.admin) {
        e.record.set("status", "pending")
    }
})
```

## Best Practices

### 1. Modular Structure
- Separate endpoints into individual files
- Use a main router file to load all modules
- Keep related functionality together

### 2. Error Handling
```javascript
routerAdd("GET", "/api/endpoint", (c) => {
    try {
        // Your logic here
        return c.json(200, { status: "success", data: result });
    } catch (error) {
        return c.json(500, {
            status: "error",
            message: "Internal server error",
            error: error.message
        });
    }
});
```

### 3. Consistent Response Format
```javascript
// Success Response
{
    "status": "success",
    "data": {},
    "timestamp": "ISO string (optional)"
}

// Error Response
{
    "status": "error",
    "message": "Human readable error message",
    "error": "Technical error details (optional)"
}
```

### 4. Documentation
- Include TypeScript reference comments
- Add descriptive comments for each endpoint
- Maintain API documentation endpoints
- Update README files when adding new features

### 5. File Naming Conventions
- Use kebab-case for file names (`user-profile.js`)
- Use RESTful conventions for route paths
- Group related endpoints in subdirectories

## Common Event Hooks

### App Hooks
- `onBootstrap` - App initialization
- `onServe` - Web server startup
- `onSettingsReload` - Settings changes
- `onTerminate` - App termination

### Record Hooks
- `onRecordBeforeCreateRequest` - Before record creation
- `onRecordAfterCreateSuccess` - After successful creation
- `onRecordBeforeUpdateRequest` - Before record update
- `onRecordAfterUpdateSuccess` - After successful update
- `onRecordBeforeDeleteRequest` - Before record deletion

### Mailer Hooks
- `onMailerSend` - Email sending
- `onMailerRecordPasswordResetSend` - Password reset emails
- `onMailerRecordVerificationSend` - Verification emails

## Performance Considerations

1. **Avoid Global Variables**: Use modules for shared state
2. **Minimize Handler Complexity**: Keep handlers focused and lightweight
3. **Use Appropriate Hooks**: Choose the most specific hook for your needs
4. **Error Handling**: Always include proper error handling to prevent crashes
5. **Database Queries**: Optimize queries and use appropriate indexes

## Debugging Tips

1. **Console Logging**: Use `console.log()` for debugging
2. **Error Stack Traces**: May not be accurate due to serialization
3. **File Watching**: Automatic reload helps with development
4. **TypeScript Declarations**: Use for better IDE support and error detection

## Security Best Practices

1. **Input Validation**: Always validate user input
2. **Authentication**: Use PocketBase's built-in auth middlewares
3. **Authorization**: Check user permissions before operations
4. **SQL Injection**: Use parameterized queries
5. **Error Messages**: Don't expose sensitive information in error responses

## Example Project Structure

```
pb_hooks/
├── custom-api.pb.js     # Main API router
├── api/
│   ├── server-time.js   # Individual endpoints
│   ├── users.js
│   └── README.md        # API documentation
├── hooks/
│   ├── auth.pb.js       # Authentication hooks
│   └── records.pb.js    # Record lifecycle hooks
├── utils/
│   ├── helpers.js       # Shared utilities
│   └── validators.js    # Input validation
└── config.js            # Configuration settings
```

This structure provides a solid foundation for building robust PocketBase applications with JavaScript hooks while maintaining code organization and best practices.
