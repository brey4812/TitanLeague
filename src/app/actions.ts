"use server";

import { generateInitialPlayerStats } from "@/ai/flows/generate-initial-player-stats";
import { generatePressNotes as generatePressNotesFlow, type GeneratePressNotesInput } from "@/ai/flows/automate-press-notes-for-important-matches";

export async function generateStatsAction() {
  try {
    const result = await generateInitialPlayerStats();
    return { success: true, message: result.message };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to generate stats." };
  }
}

export async function generatePressNotes(input: GeneratePressNotesInput) {
    try {
        const result = await generatePressNotesFlow(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to generate press notes." };
    }
}
