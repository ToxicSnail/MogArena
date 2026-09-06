import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function Avatar({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950", className)}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <UserRound className="h-1/2 w-1/2" />}
    </span>
  );
}
