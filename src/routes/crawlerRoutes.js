import { Router } from "express";
import { findTrendingAITopics } from "../services/crawler.js";

const router = Router();

router.get("/trends", async (req, res) => {
  try {
    const trendingTopics = await findTrendingAITopics();
    if (!trendingTopics) {
      return res.status(404).json({
        error: "No trending topics found",
      });
    }
    res.json(trendingTopics);
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    res.status(500).json({
      error: "Failed to fetch trending topics",
    });
  }
});

export default router;
