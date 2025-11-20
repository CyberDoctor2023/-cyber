import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client. 
// Note: The system prompt guarantees process.env.API_KEY availability.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeImageForStyle(base64Image: string): Promise<{ background: string; shadow: number } | null> {
  try {
    // Extract mime type if present
    const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Strip header if present to get pure base64
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: "Analyze the colors and mood of this image. Create a CSS linear-gradient string that perfectly complements the image (e.g., using dominant colors or contrasting colors). Also suggest a shadow intensity between 0 and 100. Return in JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            background: { type: Type.STRING, description: "A valid CSS linear-gradient string." },
            shadow: { type: Type.NUMBER, description: "A number between 0 and 100 representing shadow opacity/size." }
          },
          required: ["background", "shadow"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return null;
  }
}