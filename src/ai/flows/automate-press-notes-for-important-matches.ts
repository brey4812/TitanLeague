'use server';
/**
 * @fileOverview Generates automated textual press notes for key match-ups, using team logos and key stats to create engaging visual content.
 *
 * - generatePressNotes - A function that handles the generation of press notes for important matches.
 * - GeneratePressNotesInput - The input type for the generatePressNotes function.
 * - GeneratePressNotesOutput - The return type for the generatePressNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePressNotesInputSchema = z.object({
  team1Name: z.string().describe('Name of the first team.'),
  team1Logo: z.string().describe('URL or data URI of the first team logo.'),
  team1Wins: z.number().describe('Number of wins for the first team.'),
  team1Draws: z.number().describe('Number of draws for the first team.'),
  team1Losses: z.number().describe('Number of losses for the first team.'),
  team1GoalsFor: z.number().describe('Goals scored by the first team.'),
  team1GoalsAgainst: z.number().describe('Goals conceded by the first team.'),
  team2Name: z.string().describe('Name of the second team.'),
  team2Logo: z.string().describe('URL or data URI of the second team logo.'),
  team2Wins: z.number().describe('Number of wins for the second team.'),
  team2Draws: z.number().describe('Number of draws for the second team.'),
  team2Losses: z.number().describe('Number of losses for the second team.'),
  team2GoalsFor: z.number().describe('Goals scored by the second team.'),
  team2GoalsAgainst: z.number().describe('Goals conceded by the second team.'),
  matchType: z
    .enum(['Derby', 'Final', 'FirstVsSecond'])
    .describe('Type of the match (Derby, Final, or First vs Second).'),
});
export type GeneratePressNotesInput = z.infer<typeof GeneratePressNotesInputSchema>;

const GeneratePressNotesOutputSchema = z.object({
  pressNotes: z.string().describe('Generated press notes for the match.'),
});
export type GeneratePressNotesOutput = z.infer<typeof GeneratePressNotesOutputSchema>;

export async function generatePressNotes(input: GeneratePressNotesInput): Promise<GeneratePressNotesOutput> {
  return generatePressNotesFlow(input);
}

const pressNotesPrompt = ai.definePrompt({
  name: 'pressNotesPrompt',
  input: {schema: GeneratePressNotesInputSchema},
  output: {schema: GeneratePressNotesOutputSchema},
  prompt: `You are a sports journalist creating a "VERSUS" style press note for a key match.

  Based on the following information, generate compelling and informative press notes highlighting key stats and storylines. The tone should be exciting and build anticipation for the match.

  Match Type: {{{matchType}}}

  Team 1: {{{team1Name}}}
  Logo: {{media url=team1Logo}}
  Wins: {{{team1Wins}}}, Draws: {{{team1Draws}}}, Losses: {{{team1Losses}}}
  Goals For: {{{team1GoalsFor}}}, Goals Against: {{{team1GoalsAgainst}}}

  Team 2: {{{team2Name}}}
  Logo: {{media url=team2Logo}}
  Wins: {{{team2Wins}}}, Draws: {{{team2Draws}}}, Losses: {{{team2Losses}}}
  Goals For: {{{team2GoalsFor}}}, Goals Against: {{{team2GoalsAgainst}}}

  Write the press notes: `,
});

const generatePressNotesFlow = ai.defineFlow(
  {
    name: 'generatePressNotesFlow',
    inputSchema: GeneratePressNotesInputSchema,
    outputSchema: GeneratePressNotesOutputSchema,
  },
  async input => {
    const {output} = await pressNotesPrompt(input);
    return output!;
  }
);
