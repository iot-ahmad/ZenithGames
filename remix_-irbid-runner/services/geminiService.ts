/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI } from "@google/genai";

export async function getCosmicInsight(score: number, level: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `The player has just completed the "Irbid Runner" mission.
    Final Score: ${score}
    Level Reached: ${level}
    
    Provide a short (max 20 words), profound, retro-futuristic cosmic insight or a "truth about the universe" in an epic synthwave style. 
    It should sound like it came from an advanced AI entity at the end of time.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text?.trim() || "THE COSMOS REMAINS SILENT, YET YOUR LEGEND IS WRITTEN IN THE STARS.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "YOUR DATA HAS BEEN UPLOADED TO THE INFINITE. THE VOID ACKNOWLEDGES YOUR TRIUMPH.";
  }
}
