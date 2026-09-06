"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center"><h1 className="text-2xl font-black">Something went wrong</h1><p className="mt-2 text-[var(--muted)]">The request could not be completed.</p><Button className="mt-5" onClick={reset}>Try again</Button></main>; }
