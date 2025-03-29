import { ContentGenerator } from "../services/contentGenerator.js";

const formatRedditResponse = (req, res, next) => {
  console.log("🔄 Initializing Reddit response formatter middleware");
  const oldJson = res.json;

  const extractReplies = (children) => {
    console.log("📝 Extracting reply comments");
    const replies =
      children?.map((child) => ({
        userId: child.data?.author,
        comment: child.data?.body,
        upvotes: child.data?.ups,
      })) || [];
    console.log(`✅ Extracted ${replies.length} replies`);
    return replies;
  };

  const extractTopComments = (children) => {
    console.log("📝 Extracting top-level comments");
    const comments =
      children
        ?.map((child) => ({
          userId: child.data?.author,
          comment: child.data?.body,
          upvotes: child.data?.ups,
          replies: child.data?.replies?.data?.children
            ? extractReplies(child.data.replies.data.children)
            : [],
        }))
        .filter(
          (comment) =>
            comment.comment &&
            comment.userId !== "AutoModerator" &&
            comment.upvotes > 100 &&
            !comment.comment.includes(">")
        )
        .slice(0, 5) || [];

    console.log(`✅ Extracted ${comments.length} top comments`);
    return comments;
  };

  const extractPostContent = (postData) => {
    console.log("📄 Extracting post content");
    if (!postData?.data?.children?.[0]?.data) {
      console.warn("❌ No post data found");
      return null;
    }

    const post = postData.data.children[0].data;
    return {
      title: post.title || "",
      content: post.selftext || "",
      type: post.is_self
        ? "text"
        : post.is_video
        ? "video"
        : post.is_gallery
        ? "gallery"
        : "link",
      author: post.author,
      upvotes: post.ups,
      upvoteRatio: post.upvote_ratio,
      url: post.url,
      media: post.media_metadata || post.media || null,
      thumbnail: post.thumbnail,
      created: new Date(post.created_utc * 1000).toISOString(),
      subreddit: post.subreddit,
      subredditSubscribers: post.subreddit_subscribers,
    };
  };

  res.json = async function (data) {
    try {
      console.log("🎯 Starting content processing");
      const generator = ContentGenerator.getInstance();

      const postData = extractPostContent(data[0]);
      if (!postData) {
        throw new Error("Failed to extract post content");
      }
      console.log(
        `📄 Extracted post - Title: "${postData.title.substring(0, 50)}..."`
      );

      const comments = extractTopComments(data[1]?.data?.children);
      console.log("🤖 Generating LinkedIn post content...");

      // Get context from the original request body
      const userContext = req.body.context || "";
      console.log(
        userContext ? "📝 Using provided context" : "ℹ️ No context provided"
      );

      const result = await generator.generator(
        postData.title,
        postData.content,
        comments,
        userContext
      );
      console.log("✨ Successfully generated LinkedIn post");

      oldJson.call(this, {
        post: postData,
        comments,
        generatedContent: result.linkedinPost,
        providedContext: userContext,
      });
    } catch (error) {
      console.error("❌ Error generating LinkedIn post:", error.message);
      console.error("Stack trace:", error.stack);
      oldJson.call(this, { error: "Failed to process LinkedIn content." });
    }
  };

  next();
};

export default formatRedditResponse;
