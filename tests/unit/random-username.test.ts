import { describe, expect, it } from "vitest";
import { generateRandomUsername, generateUniqueUsername } from "@/server/services/random-username";

describe("random username", () => {
  it("creates valid anonymous nicknames", () => {
    const usernames = Array.from({ length: 20 }, generateRandomUsername);
    expect(new Set(usernames).size).toBe(20);
    for (const username of usernames) expect(username).toMatch(/^[a-z]+_[a-z]+_[a-f0-9]{6}$/);
  });

  it("retries collisions", async () => {
    let checks = 0;
    const username = await generateUniqueUsername(async () => ++checks < 3);
    expect(checks).toBe(3);
    expect(username).toMatch(/^[a-z]+_[a-z]+_[a-f0-9]{6}$/);
  });
});
