/// <reference path="../pb_data/types.d.ts" />

// API Routes Index
// This file loads all API endpoint modules
// Add new API endpoints by requiring them here

require(`${__hooks}/api/server-time.js`);

// API documentation endpoint
routerAdd("GET", "/api/", (c) => {
  const apiInfo = {
    name: "PocketBase API",
    version: "1.0.0",
    status: "active",
    endpoints: [
      ...require(`${__hooks}/api/server-time.js`),
      // Add more endpoint documentation here as you create them
    ],
    timestamp: new Date().toISOString(),
  };

  return c.json(200, apiInfo);
});
