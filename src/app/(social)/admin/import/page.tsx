import { notFound } from "next/navigation";
import { ImportPanel } from "@/features/import/import-panel";
import { requirePageUser } from "@/server/auth/session";
import { db } from "@/server/db/client";

export default async function ImportPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const viewer = await requirePageUser();
  const user = await db.user.findUnique({ where: { id: viewer.id }, select: { email: true } });
  if (!process.env.DEV_ADMIN_EMAIL || user?.email?.toLowerCase() !== process.env.DEV_ADMIN_EMAIL.toLowerCase()) notFound();
  return <div><p className="text-xs font-black tracking-[.25em] text-[var(--primary)]">DEVELOPMENT ONLY</p><h1 className="mb-6 mt-1 text-3xl font-black">Profile Importer</h1><ImportPanel /></div>;
}
