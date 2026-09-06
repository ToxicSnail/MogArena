import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] text-white shadow-sm hover:bg-[var(--primary-hover)]",
        secondary: "border bg-[var(--surface)] hover:bg-black/5 dark:hover:bg-white/5",
        ghost: "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] dark:hover:bg-white/5",
        danger: "bg-red-600 text-white hover:bg-red-700",
      },
      size: { sm: "h-9 px-3 text-sm", md: "h-11 px-5", lg: "h-13 px-8 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({ className, variant, size, asChild, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
