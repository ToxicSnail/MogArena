"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";

type SearchUser = { username: string; avatarUrl: string | null; rating: number };

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (response.ok) setUsers((await response.json()).users);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setUsers([]);
      } finally { setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-[var(--muted)]" />
      <input aria-label="Search users" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="h-10 w-full rounded-xl border bg-[var(--background)] pl-10 pr-9 outline-none focus:border-[var(--primary)]" />
      {query && <button aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2 top-2.5"><X className="h-5 w-5 text-[var(--muted)]" /></button>}
      {query.length >= 2 && (
        <div className="absolute top-12 z-50 w-full overflow-hidden rounded-xl border bg-[var(--surface)] shadow-xl">
          {loading && <p className="p-4 text-sm text-[var(--muted)]">Searching...</p>}
          {!loading && !users.length && <p className="p-4 text-sm text-[var(--muted)]">No people found</p>}
          {users.map((user) => (
            <Link key={user.username} href={`/u/${user.username}`} onClick={() => setQuery("")} className="flex items-center gap-3 border-b p-3 last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
              <Avatar src={user.avatarUrl} alt={user.username} className="h-9 w-9" />
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">@{user.username}</strong><small className="text-[var(--muted)]">Anonymous nickname</small></span>
              <b className="text-sm text-[var(--primary)]">{user.rating}</b>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
