"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { loginSchema, registerSchema } from "@/features/auth/schemas";

type RegisterInput = z.input<typeof registerSchema>;
type LoginInput = z.input<typeof loginSchema>;

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="block space-y-1.5"><span className="text-sm font-bold">{label}</span><input {...props} className="h-11 w-full rounded-xl border bg-transparent px-3 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-500/10" />{error && <span className="text-xs text-red-600">{error}</span>}</label>;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  return mode === "login" ? <LoginForm /> : <RegisterForm />;
}

function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  async function submit(values: LoginInput) {
    setServerError("");
    const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
    if (result?.error) { setServerError("Invalid email or password"); return; }
    router.push("/battle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Field label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
      <Field label="Password" type="password" autoComplete="current-password" {...register("password")} error={errors.password?.message} />
      {serverError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{serverError}</div>}
      <Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : "Log in"}</Button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  async function submit(values: RegisterInput) {
    setServerError("");
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) { setServerError((await response.json()).error ?? "Registration failed"); return; }
      const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
      if (result?.error) { setServerError("Account created. Please log in."); return; }
      router.push("/battle"); router.refresh();
    } catch { setServerError("Network error. Please try again."); }
  }
  return <form onSubmit={handleSubmit(submit)} className="space-y-4">
    <Field label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
    <Field label="Password" type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} />
    <Field label="Confirm password" type="password" autoComplete="new-password" {...register("confirmPassword")} error={errors.confirmPassword?.message} />
    {serverError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{serverError}</div>}
    <Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait..." : "Create account"}</Button>
  </form>;
}
