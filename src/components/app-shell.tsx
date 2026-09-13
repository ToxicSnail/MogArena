import { BarChart3, Clock3, Home, Swords, UserRound } from "lucide-react";
import Link from "next/link";
import type { Session } from "next-auth";
import { db } from "@/server/db/client";
import { Avatar } from "@/components/ui/avatar";
import { SearchBox } from "@/components/search-box";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { toPublicIdentity } from "@/lib/public-identity";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/battle", label: "Battle", icon: Swords },
  { href: "/rating", label: "Rating", icon: BarChart3 },
  { href: "/history", label: "History", icon: Clock3 },
];

export async function AppShell({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const [viewer, leaders] = await Promise.all([
    session?.user.id ? db.user.findUnique({ where: { id: session.user.id }, select: { username: true, avatarUrl: true } }) : null,
    db.user.findMany({ orderBy: { rating: "desc" }, take: 5, select: { id: true, username: true, avatarUrl: true, rating: true } }),
  ]);
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 h-16 border-b bg-[color:var(--surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1500px] items-center gap-4 px-4">
          <Link href="/" className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xl font-black tracking-tight text-white">MOG<span className="opacity-70">ARENA</span></Link>
          <div className="hidden flex-1 justify-center sm:flex"><SearchBox /></div>
          <ThemeToggle />
          {viewer ? <Link href={`/u/${viewer.username}`}><Avatar src={viewer.avatarUrl} alt={viewer.username} className="h-9 w-9" /></Link> : <Link className="font-bold text-[var(--primary)]" href="/login">Log in</Link>}
          {viewer && <LogoutButton />}
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-7 px-4 py-6 md:grid-cols-[190px_minmax(0,820px)] xl:grid-cols-[190px_minmax(0,820px)_260px]">
        <aside className="sticky top-22 hidden h-fit md:block">
          <nav className="space-y-1">
            {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--primary)]"><Icon className="h-5 w-5" />{label}</Link>)}
            {viewer && <Link href={`/u/${viewer.username}`} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-[var(--muted)] hover:bg-[var(--surface)]"><UserRound className="h-5 w-5" />Profile</Link>}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
        <aside className="sticky top-22 hidden h-fit space-y-4 xl:block">
          <div className="rounded-2xl border bg-[var(--surface)] p-5 shadow-sm"><h2 className="mb-4 font-black">Top Moggers</h2>
            <div className="space-y-4">{leaders.map((user, index) => { const identity = toPublicIdentity(user); const content = <><span className="w-4 text-sm font-bold text-[var(--muted)]">{index + 1}</span><Avatar src={user.avatarUrl} alt={identity.imageAlt} className="h-9 w-9" /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{identity.label}</span><b className="text-sm text-[var(--primary)]">{user.rating}</b></>; return identity.profileHref ? <Link href={identity.profileHref} key={user.id} className="flex items-center gap-3">{content}</Link> : <div key={user.id} className="flex items-center gap-3">{content}</div>; })}</div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-sm">
            <div className="bg-[var(--foreground)] p-5 text-[var(--surface)]"><p className="text-[10px] font-black tracking-[.24em] opacity-60">HOW IT WORKS</p><h2 className="mt-2 text-xl font-black">What is mogging?</h2><p className="mt-2 text-xs leading-5 opacity-70">To mog means to outshine someone in a head-to-head comparison. Here it is a playful vote about photos, not anyone&apos;s worth.</p></div>
            <ol className="space-y-4 p-5 text-sm"><li><b className="mr-2 text-[var(--primary)]">01</b>See two active profile photos.</li><li><b className="mr-2 text-[var(--primary)]">02</b>Pick who owns the matchup.</li><li><b className="mr-2 text-[var(--primary)]">03</b>Votes close battles and update ratings.</li></ol>
          </div>
        </aside>
      </div>
      <footer className="mx-auto max-w-[1500px] px-4 pb-6 text-center text-xs text-[var(--muted)]">
        Site designed by VKD team
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-4 border-t bg-[var(--surface)] md:hidden">
        {nav.filter((item) => item.label !== "History").map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-[var(--muted)]"><Icon className="h-5 w-5" />{label}</Link>)}
        <Link href={viewer ? `/u/${viewer.username}` : "/login"} className="flex flex-col items-center justify-center gap-1 text-[11px] font-bold text-[var(--muted)]"><UserRound className="h-5 w-5" />Profile</Link>
      </nav>
    </div>
  );
}
