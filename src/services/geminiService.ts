import { GoogleGenAI, Type } from "@google/genai";
import { MeetingAgenda } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAgendaFromText(text: string): Promise<MeetingAgenda> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze the following document and extract a structured meeting agenda. 
    Identify the main objective, stakeholders mentioned, and create a logical sequence of topics (items) with suggested durations.
    The meeting should be professional and productive.
    
    Document Context:
    ${text}
    
    Return the response in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          objective: { type: Type.STRING },
          stakeholders: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING }
              },
              required: ["name", "role"]
            }
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                startTime: { type: Type.STRING, description: "Suggested start time in HH:mm format" },
                duration: { type: Type.NUMBER, description: "Duration in minutes" },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                presenter: { type: Type.STRING }
              },
              required: ["id", "startTime", "duration", "title", "description", "presenter"]
            }
          },
          date: { type: Type.STRING }
        },
        required: ["title", "objective", "stakeholders", "items"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate agenda: No response from AI");
  }

  return JSON.parse(response.text) as MeetingAgenda;
}

export async function parseFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
