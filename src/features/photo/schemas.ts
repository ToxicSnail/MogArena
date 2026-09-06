import { z } from "zod";

export const uploadKindSchema = z.enum(["avatar", "battle"]);
