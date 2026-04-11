import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function badgeVariants(variant: "default" | "secondary" | "outline" | "destructive" = "default") {
  const variants = {
    default: "border-cyan-300/20 bg-cyan-400/15 text-cyan-50",
    secondary: "border-emerald-300/20 bg-emerald-400/15 text-emerald-50",
    outline: "border-white/15 bg-white/8 text-slate-100 backdrop-blur-md",
    destructive: "border-rose-300/20 bg-rose-500/15 text-rose-50",
  };

  return cn(
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-md",
    variants[variant],
  );
}

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" | "destructive" }) {
  return <span className={cn(badgeVariants(variant), className)} {...props} />;
}
