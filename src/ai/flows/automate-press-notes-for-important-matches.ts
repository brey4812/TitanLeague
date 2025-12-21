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
  prompt: `Eres un periodista deportivo creando una nota de prensa estilo "VERSUS" para un partido clave.

  Basándote en la siguiente información, genera notas de prensa atractivas e informativas que destaquen las estadísticas y las historias clave. El tono debe ser emocionante y crear expectación para el partido. La nota de prensa debe estar en español.

  Tipo de Partido: {{{matchType}}}

  Equipo 1: {{{team1Name}}}
  Logo: {{media url=team1Logo}}
  Victorias: {{{team1Wins}}}, Empates: {{{team1Draws}}}, Derrotas: {{{team1Losses}}}
  Goles a Favor: {{{team1GoalsFor}}}, Goles en Contra: {{{team1GoalsAgainst}}}

  Equipo 2: {{{team2Name}}}
  Logo: {{media url=team2Logo}}
  Victorias: {{{team2Wins}}}, Empates: {{{team2Draws}}}, Derrotas: {{{team2Losses}}}
  Goles a Favor: {{{team2GoalsFor}}}, Goles en Contra: {{{team2GoalsAgainst}}}

  Escribe las notas de prensa: `,
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
