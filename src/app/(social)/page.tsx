import { ArrowRight, BarChart3, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@/server/auth/options";
import { db } from "@/server/db/client";
import { winrate } from "@/lib/utils";
import { toPublicIdentity } from "@/lib/public-identity";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user.id) {
    const features = [{ Icon: Swords, title: "Compare", text: "Fast, visual head-to-head choices." }, { Icon: Trophy, title: "Compete", text: "Community results close each battle." }, { Icon: BarChart3, title: "Climb", text: "Elo keeps the rating meaningful." }];
    return <div className="space-y-6"><Card className="overflow-hidden p-8 sm:p-12"><p className="mb-4 text-xs font-black tracking-[.3em] text-[var(--primary)]">FACE TO FACE</p><h1 className="max-w-2xl text-5xl font-black leading-[.95] sm:text-7xl">WHO<br /><span className="text-[var(--primary)]">MOGS?</span></h1><p className="mt-6 max-w-xl text-lg text-[var(--muted)]">Two photos enter the feed. The community chooses who owns the moment. Build your profile and climb the Mog Rating.</p><div className="mt-8 flex gap-3"><Button asChild size="lg"><Link href="/register">Join MogArena <ArrowRight className="h-5 w-5" /></Link></Button><Button asChild size="lg" variant="secondary"><Link href="/login">Log in</Link></Button></div></Card><div className="grid gap-4 sm:grid-cols-3">{features.map(({ Icon,title,text }) => <Card className="p-6" key={title}><Icon className="mb-4 h-7 w-7 text-[var(--primary)]" /><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{text}</p></Card>)}</div></div>;
  }

  const [user, battleCandidates, leaders] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { rating: true, wins: true, losses: true } }),
    db.battle.findMany({ where: { status: "ACTIVE", photoA: { active: true, source: { not: "SEED" } }, photoB: { active: true, source: { not: "SEED" } } }, orderBy: [{ votesA: "desc" }, { votesB: "desc" }], take: 30, select: { id: true, votesA: true, votesB: true, participantA: { select: { id: true, username: true } }, participantB: { select: { id: true, username: true } }, photoA: { select: { thumbnailUrl: true } }, photoB: { select: { thumbnailUrl: true } } } }),
    db.user.findMany({ orderBy: { rating: "desc" }, take: 5, select: { id: true, username: true, rating: true } }),
  ]);
  const visibleParticipants = new Set<string>();
  const battles = battleCandidates.filter((battle) => {
    if (visibleParticipants.has(battle.participantA.id) || visibleParticipants.has(battle.participantB.id)) return false;
    visibleParticipants.add(battle.participantA.id);
    visibleParticipants.add(battle.participantB.id);
    return true;
  }).slice(0,3).map((battle) => ({ ...battle, participantA: toPublicIdentity(battle.participantA), participantB: toPublicIdentity(battle.participantB) }));
  return <div className="space-y-6"><Card className="relative overflow-hidden bg-[var(--primary)] p-7 text-white sm:p-9"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" /><p className="text-xs font-black tracking-[.3em] text-blue-100">YOUR NEXT CALL</p><h1 className="mt-2 text-4xl font-black">WHO MOGS?</h1><p className="mt-2 text-blue-100">Choose the winner. See what the community thinks.</p><Button asChild size="lg" className="mt-6 bg-white text-blue-700 hover:bg-blue-50"><Link href="/battle">Start battle <ArrowRight className="h-5 w-5" /></Link></Button></Card>
    <section><h2 className="mb-3 text-xl font-black">Your Stats</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Rating",user.rating],["Wins",user.wins],["Losses",user.losses],["Winrate",`${winrate(user.wins,user.losses)}%`]].map(([label,value]) => <Card key={label} className="p-5"><p className="text-sm text-[var(--muted)]">{label}</p><b className="mt-1 block text-2xl">{value}</b></Card>)}</div></section>
    <section><h2 className="mb-3 text-xl font-black">Trending Battles</h2>{battles.length ? <div className="grid gap-4 sm:grid-cols-3">{battles.map((battle) => <Card key={battle.id} className="overflow-hidden"><div className="grid grid-cols-2"><img src={battle.photoA.thumbnailUrl} alt="Anonym" className="aspect-[4/5] h-full w-full object-cover" /><img src={battle.photoB.thumbnailUrl} alt="Anonym" className="aspect-[4/5] h-full w-full object-cover" /></div><div className="flex justify-between p-3 text-xs font-bold">{battle.participantA.profileHref ? <Link href={battle.participantA.profileHref}>Anonym</Link> : <span>Anonym</span>}<span className="text-[var(--primary)]">{battle.votesA + battle.votesB} votes</span>{battle.participantB.profileHref ? <Link href={battle.participantB.profileHref}>Anonym</Link> : <span>Anonym</span>}</div></Card>)}</div> : <Card className="p-8 text-center text-[var(--muted)]">No active battles yet. Start the first one.</Card>}</section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-black">Top Moggers</h2><Link href="/rating" className="text-sm font-bold text-[var(--primary)]">Full rating</Link></div><Card className="divide-y">{leaders.map((leader,index) => { const identity = toPublicIdentity(leader); const content = <><b className="w-10 text-[var(--muted)]">#{index+1}</b><span className="flex-1 font-bold">{identity.label}</span><strong className="text-[var(--primary)]">{leader.rating}</strong></>; return identity.profileHref ? <Link href={identity.profileHref} key={leader.id} className="flex items-center p-4">{content}</Link> : <div key={leader.id} className="flex items-center p-4">{content}</div>; })}</Card></section>
  </div>;
}
