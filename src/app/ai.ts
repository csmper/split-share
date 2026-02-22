import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";
import { Person } from './models';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  async parseExpense(text: string, people: Person[]) {
    const model = "gemini-3-flash-preview";
    
    const prompt = `
      Parse the following natural language expense description into a structured format.
      The context is India, so amounts are in Indian Rupees (INR).
      Current people available: ${people.map(p => `${p.name} (id: ${p.id})`).join(', ')}.
      
      Description: "${text}"
      
      Return a JSON object with:
      - description: string
      - amount: number
      - paidByPersonId: string (match from available people or default to '1' if "I" or "me" is used)
      - splitType: 'equal' | 'percentage' | 'exact'
      - involvedPersonIds: string[] (ids of people involved in the split)
    `;

    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            paidByPersonId: { type: Type.STRING },
            splitType: { type: Type.STRING, enum: ['equal', 'percentage', 'exact'] },
            involvedPersonIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["description", "amount", "paidByPersonId", "splitType", "involvedPersonIds"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('AI response was empty');
    }
    return JSON.parse(responseText);
  }
}
