import dotenv from 'dotenv';
dotenv.config();

export const port = process.env.PORT || 3000;
export const userAgent = process.env.USER_AGENT || 'Mozilla/5.0';
export const redditCookie = process.env.REDDIT_COOKIE;
export const gemini_api_key = process.env.GEMINI_API_KEY;