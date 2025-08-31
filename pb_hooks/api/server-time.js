/// <reference path="../../pb_data/types.d.ts" />

// Server time API endpoint
// GET /api/server-time - Returns current server timestamp in multiple formats

// Export the endpoint documentation
module.exports = [
  {
    path: "/api/server-time",
    method: "GET",
    description: "Get current server timestamp in multiple formats",
    group: "System",
    version: "1.0.0",
  },
];

typeof routerAdd === "function" &&
  routerAdd("GET", "/api/server-time", (c) => {
    const dayjs = require("dayjs");

    try {
      const now = new Date();

      const serverTime = {
        timestamp: Date.now(),
        iso: now.toISOString(),
        utc: now.toUTCString(),
        unix: Math.floor(Date.now() / 1000),
        local: now.toString(),
        dayjs: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        status: "success",
      };

      return c.json(200, serverTime);
    } catch (error) {
      return c.json(500, {
        status: "error",
        message: "Internal server error",
        error: error.message,
      });
    }
  });
