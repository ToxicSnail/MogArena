import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
    <section className="relative hidden overflow-hidden bg-[#0d43a5] p-16 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-400/25 blur-3xl" />
      <Link href="/" className="relative text-2xl font-black tracking-tight">MOGARENA</Link>
      <div className="relative max-w-xl"><p className="mb-4 text-sm font-black tracking-[.28em] text-blue-200">SOCIAL COMPARISON, REIMAGINED</p><h1 className="text-6xl font-black leading-[.95]">Two profiles.<br />One choice.<br />Who mogs?</h1><p className="mt-7 max-w-md text-lg text-blue-100">Vote in head-to-head battles, follow the live score and see who climbs the community rating.</p></div>
      <p className="relative text-sm text-blue-200">Site designed by VKD team</p>
    </section>
    <section className="relative flex items-center justify-center p-5"><div className="absolute right-4 top-4"><ThemeToggle /></div>{children}<p className="absolute bottom-4 text-xs text-[var(--muted)] lg:hidden">Site designed by VKD team</p></section>
  </main>;
}
