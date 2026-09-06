import type { Metadata } from "next";
import { BattleArena } from "@/features/battle/battle-arena";
import { requirePageUser } from "@/server/auth/session";
import { BattleService } from "@/server/services/battle-service";

export const metadata: Metadata = { title: "Battle" };
export default async function BattlePage() {
  const viewer = await requirePageUser();
  const battle = await new BattleService().next(viewer.id);
  return <BattleArena initialBattle={battle} />;
}
