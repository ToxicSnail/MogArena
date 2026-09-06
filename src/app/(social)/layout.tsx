import { AppShell } from "@/components/app-shell";
import { auth } from "@/server/auth/options";

export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <AppShell session={session}>{children}</AppShell>;
}
