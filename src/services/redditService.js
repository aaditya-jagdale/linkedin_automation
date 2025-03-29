import axios from "axios";
import { userAgent, redditCookie } from "../config/config.js";

class RedditService {
  async getPost(subreddit, postId) {
    console.log(
      `📡 Making request to Reddit API for r/${subreddit} post ${postId}`
    );

    try {
      const response = await axios({
        method: "get",
        url: `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=top`,
        headers: {
          "User-Agent": userAgent,
          Cookie: redditCookie,
        },
      });

      console.log("✅ Successfully received response from Reddit API");
      return response;
    } catch (error) {
      console.error("❌ Reddit API request failed:", error.message);
      console.error("Request details:", {
        subreddit,
        postId,
        url: `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=top`,
      });
      throw error;
    }
  }
}

export default new RedditService();
