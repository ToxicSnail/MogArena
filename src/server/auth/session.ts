import { redirect } from "next/navigation";
import { auth } from "@/server/auth/options";
import { AppError } from "@/server/errors";

export async function getCurrentUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  return session.user.id;
}

export async function requirePageUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}
