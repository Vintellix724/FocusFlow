import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeMockTests = async (testsData: any) => {
  const prompt = `
You are an expert academic counselor and tutor. Analyze the following mock test performance data for a student and provide a detailed, encouraging, and actionable analysis.

Data:
${JSON.stringify(testsData, null, 2)}

Please provide:
1. Overall Performance Trend (Are they improving?)
2. Strengths (What are they doing well?)
3. Areas for Improvement (Where are they losing marks or taking too much time?)
4. Actionable Recommendations (What should they focus on next?)

Keep the tone motivating and professional. Format the response in Markdown.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    throw new Error("Failed to generate AI analysis. Please try again later.");
  }
};
