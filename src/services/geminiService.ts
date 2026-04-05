import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateTaskSuggestions(title: string, category: string): Promise<{ description: string, subtasks: string[] }> {
  try {
    const prompt = `You are an expert interior design project manager. 
A user is creating a task titled "${title}" in the category "${category}".
Please suggest a detailed description and a checklist of subtasks for this task.
Return the response in JSON format with the following structure:
{
  "description": "A detailed 2-3 sentence description of what needs to be done.",
  "subtasks": ["subtask 1", "subtask 2", "subtask 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return {
      description: "Failed to generate suggestions.",
      subtasks: []
    };
  }
}
