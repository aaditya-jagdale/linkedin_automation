import express from "express";
import { port } from "./config/config.js";
import rateLimiter from "./middleware/rateLimiter.js";
import redditRoutes from "./routes/redditRoutes.js";
import crawlerRoutes from "./routes/crawlerRoutes.js";
const app = express();
console.log("🚀 Initializing Express application...");

app.use(express.json());
console.log("✅ JSON parsing middleware enabled");

app.use(rateLimiter);
console.log("🔒 Rate limiter middleware enabled");

app.use("/api/reddit", redditRoutes);
console.log("🛣️  Reddit routes registered at /api/reddit");

app.use("/crawler", crawlerRoutes);
console.log("🛣️  Crawler routes registered at /crawler");

app.listen(port, () => {
  console.log("==================================");
  console.log(`🌟 Server running on port ${port}`);
  console.log("==================================");
});
