export interface RatingResult {
  ratingA: number;
  ratingB: number;
  deltaA: number;
  deltaB: number;
}

export type BattleOutcome = "A_WIN" | "B_WIN" | "DRAW";

export class RatingService {
  constructor(private readonly kFactor = 32) {}

  calculate(ratingA: number, ratingB: number, outcome: BattleOutcome): RatingResult {
    const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
    const scoreA = outcome === "A_WIN" ? 1 : outcome === "B_WIN" ? 0 : 0.5;
    const deltaA = Math.round(this.kFactor * (scoreA - expectedA));
    const deltaB = deltaA === 0 ? 0 : -deltaA;
    return { ratingA: ratingA + deltaA, ratingB: ratingB + deltaB, deltaA, deltaB };
  }
}
