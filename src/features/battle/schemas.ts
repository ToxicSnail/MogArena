import { z } from "zod";

export const voteSchema = z.object({ selectedUserId: z.string().cuid() });
export const nextBattleSchema = z.object({ skip: z.string().cuid().optional() });
export const recentBattleUsersSchema = z.array(z.string().cuid()).max(40);
