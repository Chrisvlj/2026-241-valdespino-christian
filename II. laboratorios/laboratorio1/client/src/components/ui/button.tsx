import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function buttonVariants({
  variant = "default",
  size = "md",
}: Pick<ButtonProps, "variant" | "size"> = {}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    default: "border border-cyan-300/20 bg-cyan-400/15 text-cyan-50 shadow-[0_18px_50px_-28px_rgba(34,211,238,0.65)] hover:bg-cyan-300/20 hover:shadow-[0_22px_60px_-26px_rgba(34,211,238,0.78)]",
    secondary: "border border-emerald-300/20 bg-emerald-400/15 text-emerald-50 shadow-[0_18px_50px_-28px_rgba(16,185,129,0.6)] hover:bg-emerald-300/20",
    outline: "glass-panel-soft text-slate-50 hover:border-white/20 hover:bg-white/10",
    ghost: "text-slate-100 hover:bg-white/8 hover:text-white",
    destructive: "border border-rose-300/20 bg-rose-500/15 text-rose-50 hover:bg-rose-400/20",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return cn(base, variants[variant], sizes[size]);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
