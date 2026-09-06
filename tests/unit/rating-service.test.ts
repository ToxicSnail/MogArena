import { describe, expect, it } from "vitest";
import { RatingService } from "@/server/services/rating-service";

describe("RatingService", () => {
  const service = new RatingService();
  it("rewards A for a win at equal rating", () => expect(service.calculate(1000,1000,"A_WIN")).toEqual({ratingA:1016,ratingB:984,deltaA:16,deltaB:-16}));
  it("rewards B for a win", () => expect(service.calculate(1000,1000,"B_WIN")).toEqual({ratingA:984,ratingB:1016,deltaA:-16,deltaB:16}));
  it("does not change equal ratings on a draw", () => expect(service.calculate(1000,1000,"DRAW")).toEqual({ratingA:1000,ratingB:1000,deltaA:0,deltaB:0}));
  it("gives an underdog a larger reward", () => expect(service.calculate(1400,1000,"B_WIN").deltaB).toBeGreaterThan(16));
  it("uses rating difference for expected result", () => expect(service.calculate(1400,1000,"A_WIN").deltaA).toBeLessThan(16));
});
