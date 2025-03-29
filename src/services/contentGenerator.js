import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

export class ContentGenerator {
  static instance;

  static getInstance() {
    if (!this.instance) this.instance = new ContentGenerator();
    return this.instance;
  }

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generator(postTitle, postContent, comments, userContext = "") {
    const interestingTopics = await this.filterInterestingTopics(comments);
    const topics = Array.isArray(interestingTopics) ? interestingTopics : [];

    const combinedContext = `
      Title: ${postTitle}
      Post Content: ${postContent}
      Comments: ${topics.join(" ")}
      Context: ${userContext}
    `;

    const experimentPrompt = `
    You are an advanced AI assistant responsible for managing Aaditya's LinkedIn account. Your objective is to create a post that captivates the audience and leaves them questioning the boundaries of AI's capabilities for LinkedIn taking in the context of the reddit post. The tone should be news report style, human and relatable. And the entire post should be written from your (AI's) perspective Reporting on Aaditya's behalf using the language like your are my personal assistant ("Aaditya reported to found this really interestng")
    You must use Hook-Retain-Reward method to write the post(All the examples are only for reference purpose and not to be used directly in the post) :
    - Hook: You must give them a reason to redirect their attention from whatever they are doing to read your post.
      example:
        - 3 investments in my early 20s that paid off big
        - How I went from knowing nothing about code, to creating my own app in just 48 hours
        - 4 step plan to make beer money this summer!

    - Retain: You must keep the user engaged and make them want to read more.
    - Reward: You must have something that is psychologically rewarding to the reader.
      example:
        - In the end these 3 investments made me over 10 lakh rupees.
        - That is my journey so far. If you also want to learn how you can transform your ideas from planning to execution in just 48 hours, comment down below and I'll send it to you
        - If you follow these 4 steps you can have a total of $3000 by the end of the summer
    Notes:
      - All the post contents are not Aaditya's personal experiences/stories so dont depict it as Aaditya's personal experiences/stories.
      - You must make the post very engaging and relatable for the target audience.
      - Use the provided context to frame the post appropriately and add relevant background information.

    Now you must write the post based on the above instructions on the following reddit post:
    ${combinedContext}
    `;

    console.log("🎨 Generating LinkedIn post...");
    const post = await this.model.generateContent(experimentPrompt);
    console.log("✅ LinkedIn post generated");

    return {
      status: "success",
      linkedinPost: post.response.text(),
    };
  }

  async filterInterestingTopics(comments) {
    if (!comments?.length) return [];

    const interestingTopics = await Promise.all(
      comments.map(async (comment) => {
        try {
          const result = await this.model.generateContent(
            `
            Analyze the following comment and extract only the most interesting or thought-provoking parts:
            ${comment.comment}
            `
          );
          const filteredContent = result.response
            .text()
            .replace(/\s+/g, " ")
            .trim();
          return filteredContent;
        } catch (error) {
          console.error("Error processing comment:", error);
          return null;
        }
      })
    );

    return interestingTopics.filter((topic) => topic && topic.length > 0);
  }
}
