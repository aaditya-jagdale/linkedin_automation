import redditService from "../services/redditService.js";
import { parseRedditUrl } from "../utils/urlParser.js";

class RedditController {
  async getPostByUrl(req, res) {
    console.log("📥 Received request to fetch Reddit post");

    if (!req.body.url) {
      console.warn("❌ Request rejected: Missing URL in request body");
      res.status(400).json({
        error: "URL is required",
      });
      return;
    }

    try {
      const { url } = req.body;
      console.log(`🔍 Processing Reddit URL: ${url}`);

      const { subreddit, postId } = parseRedditUrl(url);
      console.log(`📍 Parsed URL - Subreddit: ${subreddit}, PostID: ${postId}`);

      console.log("🌐 Fetching post from Reddit API...");
      const response = await redditService.getPost(subreddit, postId);
      console.log("✅ Successfully fetched Reddit post data");

      res.json(response.data);
    } catch (error) {
      console.error("❌ Error processing request:", error.message);
      console.error("Stack trace:", error.stack);

      res.status(error.response?.status || 500).json({
        error: error.message,
      });
    }
  }
}

export default new RedditController();
