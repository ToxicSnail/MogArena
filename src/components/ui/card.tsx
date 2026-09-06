import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border bg-[var(--surface)] shadow-[0_8px_30px_rgba(25,45,80,.06)]", className)} {...props} />;
}
