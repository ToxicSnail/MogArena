import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { auth } from "@/server/auth/options";
import { db } from "@/server/db/client";
import { winrate } from "@/lib/utils";
import { toPublicIdentity } from "@/lib/public-identity";

export const metadata: Metadata = { title: "Top Moggers" };
export default async function RatingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams; const page = Math.max(1, Number(query.page) || 1); const limit = 20;
  const session = await auth();
  const [users,total] = await db.$transaction([db.user.findMany({ orderBy: [{ rating: "desc" },{ id: "asc" }], skip: (page-1)*limit, take: limit, select: { id: true, username: true, avatarUrl: true, rating: true, wins: true, losses: true } }),db.user.count()]);
  const pages = Math.ceil(total/limit);
  return <div><div className="mb-6"><p className="text-xs font-black tracking-[.25em] text-[var(--primary)]">GLOBAL LEADERBOARD</p><h1 className="mt-1 text-3xl font-black">Top Moggers</h1><p className="mt-1 text-[var(--muted)]">Elo rating based on completed community battles.</p></div><Card className="overflow-hidden"><div className="grid grid-cols-[45px_1fr_80px_70px] gap-2 border-b px-4 py-3 text-xs font-bold uppercase text-[var(--muted)] sm:grid-cols-[55px_1fr_100px_100px]"><span>#</span><span>User</span><span>Rating</span><span>Winrate</span></div>{users.length ? users.map((user,index) => { const identity=toPublicIdentity(user); const className=`grid grid-cols-[45px_1fr_80px_70px] items-center gap-2 border-b px-4 py-4 last:border-0 sm:grid-cols-[55px_1fr_100px_100px] ${user.id === session?.user.id ? "bg-blue-50 dark:bg-blue-950/30" : identity.profileHref ? "hover:bg-black/[.02] dark:hover:bg-white/[.02]" : ""}`; const content=<><b className="text-[var(--muted)]">{(page-1)*limit+index+1}</b><span className="flex min-w-0 items-center gap-3"><Avatar src={user.avatarUrl} alt={identity.imageAlt} className="h-10 w-10" /><span className="min-w-0"><strong className="block truncate">{identity.label}</strong>{identity.handle && <small className="text-[var(--muted)]">{identity.handle}</small>}</span></span><b className="text-[var(--primary)]">{user.rating}</b><span className="font-semibold">{winrate(user.wins,user.losses)}%</span></>; return identity.profileHref ? <Link href={identity.profileHref} key={user.id} className={className}>{content}</Link> : <div key={user.id} className={className}>{content}</div>; }) : <p className="p-10 text-center text-[var(--muted)]">The leaderboard is empty.</p>}</Card>{pages > 1 && <div className="mt-5 flex justify-center gap-2">{page > 1 && <Link className="rounded-xl border bg-[var(--surface)] px-4 py-2 font-bold" href={`/rating?page=${page-1}`}>Previous</Link>}<span className="px-3 py-2 text-sm text-[var(--muted)]">{page} / {pages}</span>{page < pages && <Link className="rounded-xl border bg-[var(--surface)] px-4 py-2 font-bold" href={`/rating?page=${page+1}`}>Next</Link>}</div>}</div>;
}
