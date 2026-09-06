import { NextResponse } from "next/server";
import { apiError } from "@/server/errors";
import { ProfileService } from "@/server/services/profile-service";

export async function GET(_: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;
    return NextResponse.json({ user: await new ProfileService().getByUsername(username) });
  } catch (error) {
    return apiError(error);
  }
}
