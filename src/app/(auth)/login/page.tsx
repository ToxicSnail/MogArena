import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return <Card className="w-full max-w-md p-7 sm:p-9"><div className="mb-7"><p className="mb-2 text-xs font-black tracking-[.22em] text-[var(--primary)]">WELCOME BACK</p><h1 className="text-3xl font-black">Ready to decide?</h1><p className="mt-2 text-[var(--muted)]">Log in and get to your next battle.</p></div><AuthForm mode="login" /><p className="mt-6 text-center text-sm text-[var(--muted)]">New to MogArena? <Link className="font-bold text-[var(--primary)]" href="/register">Create account</Link></p></Card>;
}
