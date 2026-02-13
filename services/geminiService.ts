import { GoogleGenAI } from "@google/genai";
import { AiAdvice, GameState } from "../types";

export const getTacticalAdvice = async (gameState: GameState): Promise<AiAdvice> => {
  if (!process.env.API_KEY) {
    return {
      title: "SYSTEM OFFLINE",
      content: "AI Core connection missing (API Key). Good luck, Commander.",
      tone: "neutral"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      You are a tactical AI advising a commander in a Cyberpunk Tower Defense game.
      Current Game State:
      - Wave: ${gameState.wave}
      - Credits: ${gameState.credits}
      - Base Health: ${gameState.health}/${gameState.maxHealth}
      - Active Towers: ${gameState.towers.length}
      - Enemies Visible: ${gameState.enemies.length}

      Provide a short, immersive, single-sentence tactical tip or status report. 
      If health is low, be urgent. If credits are high, suggest spending. 
      If wave is high, warn of incoming threats.
      Use military/sci-fi terminology.
      
      Format output as JSON: { "title": "SHORT HEADER", "content": "The message...", "tone": "neutral" | "urgent" | "confident" }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text) as AiAdvice;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "CONNECTION UNSTABLE",
      content: "Tactical uplink failed. Rely on manual instincts.",
      tone: "neutral"
    };
  }
};