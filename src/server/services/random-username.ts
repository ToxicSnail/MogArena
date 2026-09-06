import { randomBytes, randomInt } from "node:crypto";
import { AppError } from "@/server/errors";

const adjectives = ["brave", "calm", "clever", "cosmic", "gentle", "lucky", "neon", "rapid", "silver", "solar", "steady", "wild"];
const animals = ["badger", "falcon", "fox", "lynx", "otter", "owl", "panda", "raven", "tiger", "wolf"];

export function generateRandomUsername() {
  return `${adjectives[randomInt(adjectives.length)]}_${animals[randomInt(animals.length)]}_${randomBytes(3).toString("hex")}`;
}

export async function generateUniqueUsername(isTaken: (username: string) => Promise<boolean>) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const username = generateRandomUsername();
    if (!await isTaken(username)) return username;
  }
  throw new AppError("USERNAME_GENERATION_FAILED", "Could not generate a unique nickname", 500);
}
