import axios from "axios";

// --- Configuration ---
const SUBREDDITS = [
  "artificial", // General AI
  "MachineLearning", // Technical ML
  "singularity", // Future AI / AGI
  "LocalLLaMA", // Local Language Models
  "ChatGPT", // ChatGPT specific
  "OpenAI", // OpenAI specific
  "Bard", // Google Bard/Gemini specific
  "MistralAI", // Mistral specific
  "LLMDevs", // LLM Development
  "hardwareai", // AI hardware
];
const POST_LIMIT_PER_SUB = 50; // Increased to get more posts for better analysis
const SEARCH_LIMIT = 20; // How many search results to fetch initially
const TOP_N_POSTS = 3; // Number of final posts to return per category
// IMPORTANT: Set a descriptive User-Agent to avoid potential blocks
const USER_AGENT =
  "Nodejs AI Trend Crawler v0.1 (contact: aaditya@aadityak.com or aaditya)";
// Simple keyword extraction (adjust as needed)
const AI_KEYWORDS = [
  "ai",
  "llm",
  "gpt",
  "language model",
  "openai",
  "google",
  "gemini",
  "mistral",
  "anthropic",
  "claude",
  "transformer",
  "neural network",
  "machine learning",
  "nvidia",
  "gpu",
];

// Time threshold for "recent" posts (24 hours in seconds)
const TIME_THRESHOLD = 24 * 60 * 60;

// --- Helper Functions ---

/**
 * Makes a GET request to Reddit's JSON API.
 * @param {string} url - The Reddit API URL.
 * @returns {Promise<object|null>} - The JSON response data or null on error.
 */
async function makeRedditRequest(url) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
    return null;
  }
}

/**
 * Filters posts from the last 24 hours
 * @param {Array} posts - Array of posts
 * @returns {Array} - Filtered posts
 */
function filterRecentPosts(posts) {
  const currentTime = Math.floor(Date.now() / 1000);
  return posts.filter((post) => {
    const postAge = currentTime - post.created_utc;
    return postAge <= TIME_THRESHOLD;
  });
}

/**
 * Fetches posts from a subreddit with specific sorting
 * @param {string} subreddit - Subreddit name
 * @param {string} sort - Sorting method (hot, top, controversial, etc.)
 * @param {string} [t='day'] - Time period for sorting (hour, day, week, etc.)
 * @returns {Promise<Array>} - Array of posts
 */
async function fetchSubredditPosts(subreddit, sort, t = "day") {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${POST_LIMIT_PER_SUB}&t=${t}`;
  const data = await makeRedditRequest(url);
  if (data?.data?.children) {
    return data.data.children.map((post) => ({
      id: post.data.id,
      title: post.data.title,
      score: post.data.score,
      author: post.data.author,
      subreddit: post.data.subreddit,
      url: `https://www.reddit.com${post.data.permalink}`,
      created_utc: post.data.created_utc,
      num_comments: post.data.num_comments,
      is_self: post.data.is_self,
      selftext: post.data.selftext,
      upvote_ratio: post.data.upvote_ratio,
      controversy_score: post.data.score * (1 - post.data.upvote_ratio), // Custom controversy metric
    }));
  }
  return [];
}

/**
 * Extracts potential keywords from a post title.
 * Very basic implementation - focuses on longer words and known AI terms.
 * @param {string} title
 * @returns {string[]}
 */
function extractKeywordsFromTitle(title) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/);
  const potentialKeywords = words.filter(
    (word) => word.length > 3 || AI_KEYWORDS.includes(word)
  );
  // Include specific AI terms found, even if short
  const aiTermsFound = words.filter((word) => AI_KEYWORDS.includes(word));
  const combined = [...new Set([...potentialKeywords, ...aiTermsFound])]; // Unique keywords
  // Limit keyword count to avoid overly broad searches
  return combined.slice(0, 5);
}

// --- Main Logic ---

/**
 * Finds trending AI/LLM topics on Reddit with different sorting criteria
 */
async function findTrendingAITopics() {
  console.log("Starting comprehensive AI/LLM trend analysis on Reddit...");

  // Fetch posts with different sorting methods
  const allPosts = {
    hot: [],
    top: [],
    controversial: [],
    comments: [], // Will be derived from other posts
  };

  // Fetch posts from all subreddits with different sorting
  for (const subreddit of SUBREDDITS) {
    const [hotPosts, topPosts, controversialPosts] = await Promise.all([
      fetchSubredditPosts(subreddit, "hot"),
      fetchSubredditPosts(subreddit, "top", "day"),
      fetchSubredditPosts(subreddit, "controversial", "day"),
    ]);

    allPosts.hot.push(...hotPosts);
    allPosts.top.push(...topPosts);
    allPosts.controversial.push(...controversialPosts);
  }

  // Filter posts from the last 24 hours
  Object.keys(allPosts).forEach((key) => {
    allPosts[key] = filterRecentPosts(allPosts[key]);
  });

  // Create a combined set of all posts for comment sorting
  const allPostsCombined = [
    ...new Set([...allPosts.hot, ...allPosts.top, ...allPosts.controversial]),
  ];
  allPosts.comments = [...allPostsCombined].sort(
    (a, b) => b.num_comments - a.num_comments
  );

  // Sort posts by their respective criteria
  allPosts.hot.sort(
    (a, b) => b.score * b.upvote_ratio - a.score * a.upvote_ratio
  );
  allPosts.top.sort((a, b) => b.score - a.score);
  allPosts.controversial.sort(
    (a, b) => b.controversy_score - a.controversy_score
  );

  // Get top posts for each category
  const topResults = {
    hottest: allPosts.hot[0],
    mostVoted: allPosts.top[0],
    mostCommented: allPosts.comments[0],
    mostControversial: allPosts.controversial[0],
    relatedPosts: {
      hot: allPosts.hot.slice(0, TOP_N_POSTS),
      top: allPosts.top.slice(0, TOP_N_POSTS),
      controversial: allPosts.controversial.slice(0, TOP_N_POSTS),
      mostDiscussed: allPosts.comments.slice(0, TOP_N_POSTS),
    },
  };

  // Log results
  console.log("\n=== Top AI/LLM Posts in the Last 24 Hours ===");
  console.log("\nHottest Post:", topResults.hottest?.title);
  console.log("Most Voted Post:", topResults.mostVoted?.title);
  console.log("Most Commented Post:", topResults.mostCommented?.title);
  console.log("Most Controversial Post:", topResults.mostControversial?.title);

  return {
    timestamp: new Date().toISOString(),
    timeWindow: "24 hours",
    topPosts: {
      hottest: {
        title: topResults.hottest?.title,
        url: topResults.hottest?.url,
        score: topResults.hottest?.score,
        upvoteRatio: topResults.hottest?.upvote_ratio,
        numComments: topResults.hottest?.num_comments,
        subreddit: topResults.hottest?.subreddit,
      },
      mostVoted: {
        title: topResults.mostVoted?.title,
        url: topResults.mostVoted?.url,
        score: topResults.mostVoted?.score,
        upvoteRatio: topResults.mostVoted?.upvote_ratio,
        numComments: topResults.mostVoted?.num_comments,
        subreddit: topResults.mostVoted?.subreddit,
      },
      mostCommented: {
        title: topResults.mostCommented?.title,
        url: topResults.mostCommented?.url,
        score: topResults.mostCommented?.score,
        numComments: topResults.mostCommented?.num_comments,
        subreddit: topResults.mostCommented?.subreddit,
      },
      mostControversial: {
        title: topResults.mostControversial?.title,
        url: topResults.mostControversial?.url,
        score: topResults.mostControversial?.score,
        upvoteRatio: topResults.mostControversial?.upvote_ratio,
        controversyScore: topResults.mostControversial?.controversy_score,
        subreddit: topResults.mostControversial?.subreddit,
      },
    },
    relatedPosts: topResults.relatedPosts,
  };
}

// Export the crawler function
export { findTrendingAITopics };
