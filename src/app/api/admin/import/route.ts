import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/server/auth/session";
import { apiError, AppError } from "@/server/errors";
import { createExternalProfileImporter } from "@/server/external/tsu/importer-factory";
import { assertTrustedOrigin } from "@/server/security/origin";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";
import { db } from "@/server/db/client";

const schema = z.object({ ids: z.array(z.string().regex(/^\d{1,20}$/)).min(1).max(200), force: z.boolean().default(false) });

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") throw new AppError("NOT_FOUND", "Not found", 404);
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    const allowedEmail = process.env.DEV_ADMIN_EMAIL?.toLowerCase();
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!allowedEmail || user?.email?.toLowerCase() !== allowedEmail) throw new AppError("FORBIDDEN", "Admin access required", 403);
    await rateLimiter.consume(requestKey(request,"admin-import",userId),3,60_000);
    const input = schema.parse(await request.json());
    const importer = await createExternalProfileImporter();
    return NextResponse.json({ summary: await importer.importMany(input.ids,input.force) });
  } catch (error) { return apiError(error); }
}
