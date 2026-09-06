import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center"><p className="text-sm font-black tracking-[.3em] text-[var(--primary)]">404</p><h1 className="mt-2 text-4xl font-black">Not found</h1><p className="mt-2 text-[var(--muted)]">This profile or page does not exist.</p><Button asChild className="mt-6"><Link href="/">Back home</Link></Button></main>; }
