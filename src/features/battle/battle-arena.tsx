"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Person = { id: string; label: string; imageAlt: string; rating: number };
export type BattleArenaData = { id: string; status: string; votesA: number; votesB: number; participantA: Person; participantB: Person; photoA: { url: string }; photoB: { url: string } };
type Result = { votesA: number; votesB: number; status: string; selectedUserId: string };

export function BattleArena({ initialBattle }: { initialBattle: BattleArenaData }) {
  const recentUserIds = useRef([initialBattle.participantA.id, initialBattle.participantB.id]);
  const [battle, setBattle] = useState<BattleArenaData | null>(initialBattle);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoplay, setAutoplay] = useState(false);

  async function load(skip?: string) {
    setLoading(true); setError(""); setResult(null);
    try {
      const query = new URLSearchParams(recentUserIds.current.map((id) => ["exclude", id]));
      const response = skip
        ? await fetch(`/api/battles/${skip}/skip?${query}`, { method: "POST" })
        : await fetch(`/api/battles/next?${query}`, { method: "POST", cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load a battle");
      setBattle(body.battle);
      recentUserIds.current = [...recentUserIds.current, body.battle.participantA.id, body.battle.participantB.id].slice(-40);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load a battle"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!result || !autoplay || !battle) return;
    const timer = setTimeout(() => void load(battle.id), 2500);
    return () => clearTimeout(timer);
  }, [result, autoplay, battle]);

  async function vote(selectedUserId: string) {
    if (!battle || result) return;
    try {
      const response = await fetch(`/api/battles/${battle.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedUserId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Vote failed");
      setResult(body.result); toast.success("Vote counted");
    } catch (caught) { toast.error(caught instanceof Error ? caught.message : "Vote failed"); }
  }

  if (loading) return <div className="space-y-5"><div className="text-center"><Skeleton className="mx-auto h-9 w-48" /></div><div className="grid grid-cols-2 gap-3 sm:gap-6"><Skeleton className="aspect-[4/5]" /><Skeleton className="aspect-[4/5]" /></div></div>;
  if (error) return <Card className="p-10 text-center"><h1 className="text-xl font-black">Battle unavailable</h1><p className="mt-2 text-[var(--muted)]">{error}</p><Button className="mt-5" onClick={() => load()}><RefreshCw className="h-4 w-4" />Try again</Button></Card>;
  if (!battle) return null;
  const total = result ? result.votesA + result.votesB : 0;
  const percentages = total ? [Math.round(result!.votesA / total * 100), Math.round(result!.votesB / total * 100)] : [0,0];
  const sides = [{ person: battle.participantA, photo: battle.photoA, percentage: percentages[0] }, { person: battle.participantB, photo: battle.photoB, percentage: percentages[1] }];
  return <div><div className="mb-5 text-center"><p className="text-xs font-black tracking-[.28em] text-[var(--primary)]">CHOOSE THE WINNER</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">WHO MOGS?</h1></div>
    <div className="relative grid grid-cols-2 gap-2.5 sm:gap-6">{sides.map(({person,photo,percentage}) => <button key={person.id} disabled={Boolean(result)} onClick={() => vote(person.id)} className={cn("group min-w-0 text-left transition", !result && "cursor-pointer hover:-translate-y-1")}><Card className={cn("relative overflow-hidden border-2 border-transparent transition group-hover:border-[var(--primary)]", result?.selectedUserId === person.id && "border-[var(--primary)] ring-4 ring-blue-500/15")}><img src={photo.url} alt={person.imageAlt} className="aspect-[4/5] w-full bg-slate-100 object-cover" />{result?.selectedUserId === person.id && <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black text-white">YOU MOGGED THEM</span>}</Card><div className="mt-3 flex items-end justify-between gap-2 px-1"><span className="min-w-0"><strong className="block truncate text-sm sm:text-base">{person.label}</strong><small className="text-[var(--muted)]">{person.rating} rating</small></span>{result && <b className="text-2xl text-[var(--primary)] sm:text-4xl">{percentage}%</b>}</div></button>)}<span className="absolute left-1/2 top-[42%] z-10 -translate-x-1/2 rounded-full border-4 border-[var(--background)] bg-[var(--foreground)] px-2.5 py-2 text-xs font-black text-[var(--surface)] sm:px-4 sm:text-base">VS</span></div>
    <div className="mt-8 flex flex-col items-center gap-3">{result ? <><p className="text-sm text-[var(--muted)]">{total.toLocaleString()} votes</p><Button size="lg" onClick={() => load(battle.id)}>Next battle <RefreshCw className="h-4 w-4" /></Button><label className="flex items-center gap-2 text-sm text-[var(--muted)]"><input type="checkbox" checked={autoplay} onChange={(event) => setAutoplay(event.target.checked)} /> Autoplay after vote</label></> : <Button variant="ghost" onClick={() => load(battle.id)}>Skip this pair</Button>}</div>
  </div>;
}
