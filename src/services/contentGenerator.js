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

  async generateHook(postTitle, userContext = "") {
    const hookPrompt = `
    You are an advanced AI assistant responsible for managing Aaditya's LinkedIn account. Your task is to create an attention-grabbing hook for a LinkedIn post.
    The hook should be compelling and make readers stop scrolling to read more.
    
    Guidelines:
    - 1 line ONLY
    - Make it intriguing and curiosity-inducing
    - Write from an AI's perspective reporting on Aaditya's behalf
    - Use the title and context to frame an engaging hook
    
    Title: ${postTitle}
    Context: ${userContext}
    `;

    const hook = await this.model.generateContent(hookPrompt);
    return hook.response.text();
  }

  async generateBody(
    postTitle,
    postContent,
    comments,
    userContext = "",
    improvements = []
  ) {
    const interestingTopics = await this.filterInterestingTopics(comments);
    const topics = Array.isArray(interestingTopics) ? interestingTopics : [];

    const bodyPrompt = `
    You are an advanced AI assistant responsible for managing Aaditya's LinkedIn account. Your task is to create the main body of a LinkedIn post.
    The body should provide value and keep readers engaged.
    
    Guidelines:
    - Focus on providing pure value to the reader
    - Maintain a personal blog style, human and relatable tone
    - Write from an AI's perspective reporting on Aaditya's behalf
    - Share what the reddit post is saying about the topic
    - list down one thing that you (AI) think is interesting about the topic
    - List down one thing that you and I (Aaditya) dont agree one based on the context that I gave you
    - Dont use very heavy english, use simple english
    - Dont generate title or conclusion, only body
    - max 200 words
    ${
      improvements.length > 0
        ? `\nRequired improvements:\n${improvements.join("\n")}`
        : ""
    }
    
    Title: ${postTitle}
    Post Content: ${postContent}
    Key Comments: ${topics.join(" ")}
    Context: ${userContext}
    `;

    const body = await this.model.generateContent(bodyPrompt);
    return body.response.text();
  }

  async generateConclusion(postTitle, hook, body, userContext = "") {
    const conclusionPrompt = `
    You are an advanced AI assistant responsible for managing Aaditya's LinkedIn account. Your task is to create a strong conclusion for a LinkedIn post.
    The conclusion should provide value and encourage engagement.
    
    Guidelines:
    - End with a clear takeaway or call-to-action
    - Make it psychologically rewarding for the reader at the end of the post
    - Encourage meaningful engagement (comments, shares)
    - Ensure the conclusion flows naturally from the hook and body content
    - Max 1-2 lines
    
    Title: ${postTitle}
    Hook: ${hook}
    Body: ${body}
    Context: ${userContext}
    `;

    const conclusion = await this.model.generateContent(conclusionPrompt);
    return conclusion.response.text();
  }

  async reviewPost(post, persona) {
    const reviewPrompt = `
    You are an expert AI content reviewer. Review the following LinkedIn post from the perspective of this specific persona:
    
    ${persona}
    
    Post to review:
    ${post}
    
    Guidelines:
    1. Rate the post from 1-10 based on how well it matches the persona's interests and needs
    2. Provide specific bullet points for improvements if the score is less than 9
    3. Format your response EXACTLY as follows (do not include any markdown formatting, quotes, or extra characters):
    {"score":number,"improvements":["improvement1","improvement2"]}
    
    IMPORTANT: Return ONLY the raw JSON with no additional text, formatting, or markdown.
    `;

    try {
      const review = await this.model.generateContent(reviewPrompt);
      const responseText = review.response.text().trim();

      // Clean the response text to ensure it's valid JSON
      const cleanJson = responseText
        .replace(/^```json\s*/, "") // Remove leading ```json
        .replace(/```$/, "") // Remove trailing ```
        .replace(/^\s*{\s*/, "{") // Clean leading whitespace
        .replace(/\s*}\s*$/, "}") // Clean trailing whitespace
        .trim();

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Error parsing review response:", error);
      // Fallback response if parsing fails
      return {
        score: 7,
        improvements: [
          "Make the content more focused on AI trends and developments",
          "Add more technical depth to appeal to AI professionals",
        ],
      };
    }
  }

  async reviewBody(body, persona) {
    const reviewPrompt = `
    You are an expert AI content reviewer. Review the following LinkedIn post body from the perspective of this specific persona:
    
    ${persona}
    
    Body to review:
    ${body}
    
    Guidelines:
    1. Rate the body from 1-10 based on how well it matches the persona's interests and needs
    2. Provide specific bullet points for improvements if the score is less than 9
    3. Format your response EXACTLY as follows (do not include any markdown formatting, quotes, or extra characters):
    {"score":number,"improvements":["improvement1","improvement2"]}
    
    IMPORTANT: Return ONLY the raw JSON with no additional text, formatting, or markdown.
    `;

    try {
      const review = await this.model.generateContent(reviewPrompt);
      const responseText = review.response.text().trim();
      const cleanJson = responseText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .replace(/^\s*{\s*/, "{")
        .replace(/\s*}\s*$/, "}")
        .trim();

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Error parsing review response:", error);
      return {
        score: 7,
        improvements: [
          "Make the content more focused on AI trends and developments",
          "Add more technical depth to appeal to AI professionals",
        ],
      };
    }
  }

  async generator(postTitle, postContent, comments, userContext = "", useAgent = false) {
    console.log("🎨 Generating LinkedIn post components...");
    console.log(useAgent ? "🤖 AI Agent mode: ACTIVE (will attempt to improve content)" : "🤖 AI Agent mode: DISABLED (using first generated output)");

    // Generate hook once
    const hook = await this.generateHook(postTitle, userContext);

    // Generate and improve body
    let currentBody;
    let currentScore = 0;
    let attempts = 0;
    let improvements = [];
    const MAX_ATTEMPTS = 5; // Reduced max attempts since we're only improving body

    do {
      attempts++;
      console.log(`📝 Attempt ${attempts} to generate high-quality body...`);

      currentBody = await this.generateBody(
        postTitle,
        postContent,
        comments,
        userContext,
        improvements
      );

      const review = await this.reviewBody(currentBody, process.env.persona);
      currentScore = review.score;
      improvements = review.improvements;

      console.log(`📊 Current body score: ${currentScore}/10`);

      if (currentScore < 9 && attempts < MAX_ATTEMPTS && useAgent) {
        console.log("🔄 Improving body based on feedback...");
        console.log("Improvements needed:", improvements);
        console.log("⏳ Waiting 10 seconds before applying improvements...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } else {
        break;
      }
    } while (currentScore < 9 && attempts < MAX_ATTEMPTS && useAgent);

    // Generate conclusion once with final body
    const conclusion = await this.generateConclusion(
      postTitle,
      hook,
      currentBody,
      userContext
    );

    const finalPost = `${hook}\n\n${currentBody}\n\n${conclusion}`;

    if (currentScore < 9) {
      console.log(
        "⚠️ Could not achieve desired body quality score after maximum attempts"
      );
    } else {
      console.log("✅ High-quality post generated successfully");
    }

    return {
      status: "success",
      score: currentScore,
      linkedinPost: finalPost,
      components: {
        hook,
        body: currentBody,
        conclusion,
        qualityScore: currentScore,
      },
    };
  }

  async filterInterestingTopics(comments) {
    if (!comments?.length) return [];
    const interestingTopics = await Promise.all(
      comments.map(async (comment) => {
        try {
          const result = await this.model.generateContent(
            `Analyze the following comment and extract only the most interesting or thought-provoking parts:
            ${comment.comment}`
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
