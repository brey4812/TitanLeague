import { MatchEvent, Player } from "@/lib/types";

/**
 * Calcula la valoración de un jugador en UN partido
 * Rango final: 1 → 10
 */
export function calculatePlayerRating(
  player: Player,
  events: MatchEvent[],
  cleanSheet: boolean
): number {
  let rating = 6.0;

  // Eventos del jugador en el partido
  const playerEvents = events.filter(
    (e) => String(e.player_id) === String(player.id)
  );

  const goals = playerEvents.filter((e) => e.type === "GOAL").length;
  const assists = playerEvents.filter((e) => e.type === "ASSIST").length;
  const yellowCards = playerEvents.filter(
    (e) => e.type === "YELLOW_CARD"
  ).length;
  const redCards = playerEvents.filter(
    (e) => e.type === "RED_CARD"
  ).length;

  // === Positivo ===
  rating += goals * 1.5;
  rating += assists * 1.0;

  if (
    cleanSheet &&
    (player.position === "Goalkeeper" || player.position === "Defender")
  ) {
    rating += 1.0;
  }

  // === Disciplina ===
  rating -= yellowCards * 0.5;
  rating -= redCards * 2.0;

  // === Variación aleatoria obligatoria ===
  const randomness = Math.random() * 1 - 0.5; // -0.5 → +0.5
  rating += randomness;

  // === Clamp final ===
  rating = Math.max(1, Math.min(10, rating));

  return Number(rating.toFixed(2));
}
