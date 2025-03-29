# Reddit to LinkedIn Content Generator API 🚀

An intelligent API that transforms Reddit posts into engaging LinkedIn content using AI. The service fetches Reddit posts, analyzes their content and comments, and generates professional, context-aware LinkedIn posts optimized for engagement.

## 🌟 Features

- **Reddit Post Fetching**: Automatically fetches post content and metadata from any Reddit post URL
- **Smart Content Analysis**:
  - Extracts post title, content, and metadata
  - Filters and analyzes top comments
  - Supports various post types (text, video, gallery, links)
- **AI-Powered Generation**:
  - Uses Google's Gemini AI for content generation
  - Follows Hook-Retain-Reward methodology
  - Maintains professional, news-report style tone
  - Contextual awareness in content generation
- **Customizable Context**: Add custom context to shape the generated content
- **Comprehensive Response**: Returns original post data, processed comments, and generated content

## 🛠️ Technical Stack

- **Backend**: Node.js with Express
- **AI Integration**: Google Generative AI (Gemini-1.5-flash)
- **Rate Limiting**: Built-in rate limiting for API protection
- **Error Handling**: Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js (Latest LTS version recommended)
- Google Gemini API key
- Reddit authentication credentials

## 🔧 Environment Variables

Create a `.env` file in the root directory with:

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key
REDDIT_COOKIE=your_reddit_cookie
USER_AGENT=your_user_agent
```

## 🚀 Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd linkedin
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 API Usage

### Generate LinkedIn Post

**Endpoint**: `POST /api/reddit/post`

**Request Body**:

```json
{
  "url": "https://www.reddit.com/r/subreddit/comments/postid/title",
  "context": "Optional context to frame the LinkedIn post"
}
```

**Response**:

```json
{
  "post": {
    "title": "Post title",
    "content": "Post content",
    "type": "text|video|gallery|link",
    "author": "Reddit username",
    "upvotes": 123,
    "upvoteRatio": 0.95,
    "url": "Original post URL",
    "media": null,
    "thumbnail": "Thumbnail URL",
    "created": "ISO date string",
    "subreddit": "Subreddit name",
    "subredditSubscribers": 1234
  },
  "comments": [
    {
      "userId": "Commenter username",
      "comment": "Comment content",
      "upvotes": 123,
      "replies": []
    }
  ],
  "generatedContent": "AI-generated LinkedIn post content",
  "providedContext": "Your provided context"
}
```

### Content Generation Features

1. **Hook-Retain-Reward Structure**:

   - Hook: Captivating opening to grab attention
   - Retain: Engaging content flow
   - Reward: Valuable insights or takeaways

2. **Context Integration**:

   - Custom context for post framing
   - Background information integration
   - Professional tone adaptation

3. **Comment Analysis**:
   - Filters high-quality comments (>100 upvotes)
   - Excludes AutoModerator comments
   - Extracts meaningful insights

## 🔍 Error Handling

The API includes comprehensive error handling for:

- Invalid Reddit URLs
- Missing required parameters
- Reddit API failures
- Content generation errors
- Rate limiting violations

## 📊 Logging

Detailed logging with emoji indicators for:

- 🔄 Request processing
- 📝 Content extraction
- 🤖 AI generation
- ✅ Success states
- ❌ Error states

## 🛡️ Rate Limiting

Built-in rate limiting protects the API from abuse and ensures fair usage.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Important Notes

- Ensure compliance with Reddit's API terms of service
- Monitor Gemini API usage and costs
- Keep environment variables secure
- Regular updates recommended for security
