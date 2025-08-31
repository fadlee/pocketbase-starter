# PocketBase JavaScript Troubleshooting Guide

## Common Issues and Solutions

### 1. Variables Undefined in Handlers

**Problem**: Variables defined outside handlers are undefined inside them.

❌ **Broken Code:**
```javascript
const API_VERSION = "1.0.0";

routerAdd("GET", "/api/version", (c) => {
    return c.json(200, { version: API_VERSION }); // API_VERSION is undefined
});
```

✅ **Solution:**
```javascript
// Option 1: Define inside handler
routerAdd("GET", "/api/version", (c) => {
    const API_VERSION = "1.0.0";
    return c.json(200, { version: API_VERSION });
});

// Option 2: Use a module
// config.js
module.exports = {
    API_VERSION: "1.0.0"
};

// main.pb.js
routerAdd("GET", "/api/version", (c) => {
    const config = require(`${__hooks}/config.js`);
    return c.json(200, { version: config.API_VERSION });
});
```

### 2. Module Not Found Errors

**Problem**: `require()` fails to find modules.

❌ **Common Mistakes:**
```javascript
require('./utils.js');           // Relative to CWD, not pb_hooks
require('utils.js');             // May not find the file
require('/utils.js');            // Absolute path issues
```

✅ **Solution:**
```javascript
require(`${__hooks}/utils.js`);  // Always use __hooks for pb_hooks files
require(`${__hooks}/api/helpers.js`); // For subdirectories
```

### 3. Global Object Not Available

**Problem**: `global` object doesn't exist in PocketBase's JavaScript engine.

❌ **Broken Code:**
```javascript
global.myVariable = "value";     // ReferenceError: global is not defined
```

✅ **Solution:**
```javascript
// Use modules for shared state
// shared-state.js
module.exports = {
    data: {},
    setValue: function(key, value) {
        this.data[key] = value;
    },
    getValue: function(key) {
        return this.data[key];
    }
};

// In handlers
const sharedState = require(`${__hooks}/shared-state.js`);
sharedState.setValue('key', 'value');
```

### 4. Async/Await and Promises

**Problem**: Modern JavaScript features may not work as expected.

❌ **May Not Work:**
```javascript
routerAdd("GET", "/api/data", async (c) => {
    const data = await fetchData(); // async/await may not be supported
    return c.json(200, data);
});
```

✅ **ES5 Alternative:**
```javascript
routerAdd("GET", "/api/data", (c) => {
    try {
        // Use synchronous operations or callbacks
        const data = fetchDataSync();
        return c.json(200, data);
    } catch (error) {
        return c.json(500, { error: error.message });
    }
});
```

### 5. File Path Issues

**Problem**: File operations fail due to incorrect paths.

❌ **Common Issues:**
```javascript
$os.readFile('data.txt');        // Relative to CWD
$os.readFile('./data.txt');      // May not work as expected
```

✅ **Solution:**
```javascript
// Use absolute paths
$os.readFile(`${__hooks}/data.txt`);
$os.readFile('/absolute/path/to/file.txt');

// Check if file exists first
const filePath = `${__hooks}/data.txt`;
if ($os.fileExists(filePath)) {
    const content = $os.readFile(filePath);
}
```

### 6. JSON Parsing Errors

**Problem**: Request body parsing fails.

❌ **Unsafe Parsing:**
```javascript
routerAdd("POST", "/api/data", (c) => {
    const data = c.request.json(); // May throw if invalid JSON
    return c.json(200, data);
});
```

✅ **Safe Parsing:**
```javascript
routerAdd("POST", "/api/data", (c) => {
    try {
        const data = c.request.json();
        
        // Validate required fields
        if (!data.name || !data.email) {
            return c.json(400, {
                error: "Missing required fields: name, email"
            });
        }
        
        return c.json(200, { received: data });
    } catch (error) {
        return c.json(400, {
            error: "Invalid JSON in request body"
        });
    }
});
```

### 7. Database Transaction Issues

**Problem**: Database operations fail or cause deadlocks.

❌ **Potential Issues:**
```javascript
onRecordBeforeCreateRequest((e) => {
    // Don't access e.app from parent scope
    const record = app.findRecordById("users", "123"); // May cause deadlock
    e.next();
}, "posts");
```

✅ **Correct Approach:**
```javascript
onRecordBeforeCreateRequest((e) => {
    // Use e.app instead of parent scope app
    const record = e.app.findRecordById("users", "123");
    e.next();
}, "posts");
```

### 8. Missing e.next() Calls

**Problem**: Hook execution chain stops.

❌ **Broken Chain:**
```javascript
onRecordBeforeCreateRequest((e) => {
    console.log("Creating record...");
    // Missing e.next() - execution stops here!
}, "posts");
```

✅ **Complete Chain:**
```javascript
onRecordBeforeCreateRequest((e) => {
    console.log("Creating record...");
    e.next(); // Always call e.next() to continue
}, "posts");
```

### 9. Error Handling in Hooks

**Problem**: Unhandled errors crash the application.

❌ **No Error Handling:**
```javascript
onRecordAfterCreateSuccess((e) => {
    sendNotificationEmail(e.record.get("email")); // May throw
    e.next();
}, "users");
```

✅ **Proper Error Handling:**
```javascript
onRecordAfterCreateSuccess((e) => {
    try {
        sendNotificationEmail(e.record.get("email"));
    } catch (error) {
        console.error("Failed to send notification:", error);
        // Don't re-throw - let the record creation succeed
    }
    e.next();
}, "users");
```

### 10. TypeScript Declaration Issues

**Problem**: IDE doesn't recognize PocketBase types.

❌ **Missing Reference:**
```javascript
// No TypeScript reference
routerAdd("GET", "/api/test", (c) => {
    // No autocomplete or type checking
});
```

✅ **With Reference:**
```javascript
/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/test", (c) => {
    // Full autocomplete and type checking
    return c.json(200, { message: "Hello" });
});
```

## Debugging Techniques

### 1. Console Logging
```javascript
routerAdd("POST", "/api/debug", (c) => {
    console.log("Request method:", c.request.method);
    console.log("Request headers:", c.request.headers);
    console.log("Request body:", c.request.json());
    
    const requestData = $apis.requestData(c);
    console.log("Auth user:", requestData.auth);
    console.log("Is admin:", requestData.admin);
    
    return c.json(200, { debug: "logged" });
});
```

### 2. Error Logging
```javascript
routerAdd("GET", "/api/endpoint", (c) => {
    try {
        // Your code here
        return c.json(200, { success: true });
    } catch (error) {
        // Log full error details
        console.error("Error in /api/endpoint:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Request:", {
            method: c.request.method,
            url: c.request.url,
            headers: c.request.headers
        });
        
        return c.json(500, {
            error: "Internal server error",
            message: error.message
        });
    }
});
```

### 3. Request Inspection
```javascript
routerAdd("*", "/api/inspect", (c) => {
    const inspection = {
        method: c.request.method,
        url: c.request.url,
        headers: Object.fromEntries(c.request.headers),
        query: Object.fromEntries(c.request.query),
        pathParams: c.request.pathParams,
        body: null
    };
    
    try {
        if (c.request.method !== "GET") {
            inspection.body = c.request.json();
        }
    } catch (e) {
        inspection.bodyError = "Could not parse JSON body";
    }
    
    return c.json(200, inspection);
});
```

## Performance Tips

### 1. Minimize Database Queries
```javascript
// ❌ Multiple queries
routerAdd("GET", "/api/user-posts", (c) => {
    const users = $app.findRecordsByFilter("users", "");
    const result = [];
    
    users.forEach(user => {
        const posts = $app.findRecordsByFilter("posts", `user_id = '${user.id}'`);
        result.push({ user, posts });
    });
    
    return c.json(200, result);
});

// ✅ Single query with join
routerAdd("GET", "/api/user-posts", (c) => {
    const result = new DynamicList({
        user_id: "",
        user_name: "",
        post_title: "",
        post_content: ""
    });
    
    $app.dao().db()
        .select("u.id as user_id", "u.name as user_name", "p.title as post_title", "p.content as post_content")
        .from("users u")
        .leftJoin("posts p", "u.id = p.user_id")
        .all(result);
    
    return c.json(200, result);
});
```

### 2. Cache Expensive Operations
```javascript
// Simple in-memory cache module
// cache.js
module.exports = {
    data: {},
    get: function(key) {
        const item = this.data[key];
        if (item && item.expires > Date.now()) {
            return item.value;
        }
        delete this.data[key];
        return null;
    },
    set: function(key, value, ttlMs) {
        this.data[key] = {
            value: value,
            expires: Date.now() + (ttlMs || 300000) // 5 minutes default
        };
    }
};

// Usage
routerAdd("GET", "/api/expensive-data", (c) => {
    const cache = require(`${__hooks}/cache.js`);
    const cacheKey = "expensive-data";
    
    let data = cache.get(cacheKey);
    if (!data) {
        // Expensive operation
        data = performExpensiveCalculation();
        cache.set(cacheKey, data, 600000); // Cache for 10 minutes
    }
    
    return c.json(200, data);
});
```

## Security Checklist

- [ ] Always validate user input
- [ ] Use parameterized queries to prevent SQL injection
- [ ] Check authentication and authorization
- [ ] Don't expose sensitive data in error messages
- [ ] Validate file uploads and limit file sizes
- [ ] Use HTTPS in production
- [ ] Implement rate limiting for public endpoints
- [ ] Log security events for monitoring

## Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `ReferenceError: global is not defined` | Using `global` object | Use modules for shared state |
| `TypeError: require is not a function` | Wrong context | Ensure you're in a handler function |
| `Error: module not found` | Incorrect path | Use `${__hooks}/` prefix |
| `SyntaxError: Unexpected token` | ES6+ syntax | Use ES5 compatible code |
| `TypeError: Cannot read property of undefined` | Variable scope issue | Define variables inside handlers |
| `Error: database is locked` | Transaction deadlock | Use `e.app` instead of parent scope |

This troubleshooting guide should help you avoid and resolve the most common issues when developing with PocketBase JavaScript hooks.