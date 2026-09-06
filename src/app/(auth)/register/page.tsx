import Link from "next/link";
import { AuthForm } from "@/features/auth/auth-form";
import { Card } from "@/components/ui/card";

export default function RegisterPage() {
  return <Card className="w-full max-w-md p-7 sm:p-9"><div className="mb-7"><p className="mb-2 text-xs font-black tracking-[.22em] text-[var(--primary)]">JOIN MOGARENA</p><h1 className="text-3xl font-black">Create your profile</h1><p className="mt-2 text-[var(--muted)]">We will assign you a random anonymous nickname.</p></div><AuthForm mode="register" /><p className="mt-6 text-center text-sm text-[var(--muted)]">Already registered? <Link className="font-bold text-[var(--primary)]" href="/login">Log in</Link></p></Card>;
}
