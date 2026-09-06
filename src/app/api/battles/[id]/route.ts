import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/server/auth/session";
import { apiError } from "@/server/errors";
import { BattleService } from "@/server/services/battle-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await context.params;
    return NextResponse.json({ battle: await new BattleService().get(id, userId) });
  } catch (error) {
    return apiError(error);
  }
}
