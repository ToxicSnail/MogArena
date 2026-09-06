import { describe, expect, it } from "vitest";
import { toPublicIdentity } from "@/lib/public-identity";

describe("toPublicIdentity", () => {
  it("removes imported profile identity", () => {
    const identity = toPublicIdentity({ id: "internal-id", username: "tsu_99999999999999999991" });
    expect(identity).toEqual({ id: "internal-id", label: "Anonym", handle: null, imageAlt: "Anonym", profileHref: null, isAnonymous: true });
    expect(JSON.stringify(identity)).not.toMatch(/tsu_|99999999999999999991/);
  });

  it("publishes a random profile nickname", () => {
    expect(toPublicIdentity({ id: "user-id", username: "calm_otter_a1b2c3" })).toEqual({ id: "user-id", label: "@calm_otter_a1b2c3", handle: "@calm_otter_a1b2c3", imageAlt: "@calm_otter_a1b2c3", profileHref: "/u/calm_otter_a1b2c3", isAnonymous: false });
  });
});
