import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PollResults } from "@/types";

interface VoteFormProps {
  poll: PollResults;
  voterName: string;
  onVote: (optionIndex: number) => Promise<void> | void;
  loading?: boolean;
}

export function VoteForm({ poll, voterName, onVote, loading = false }: VoteFormProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selected === null) {
      setError("Selecciona una opción para votar.");
      return;
    }

    setError(null);
    await onVote(selected);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">{poll.title}</CardTitle>
        <CardDescription className="text-slate-200/70">Votando como {voterName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3">
            {poll.options.map((option, index) => {
              const isSelected = selected === index;
              return (
                <button
                  key={option.text}
                  type="button"
                  onClick={() => setSelected(index)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all backdrop-blur-md",
                    isSelected
                      ? "border-cyan-300/30 bg-cyan-400/15 ring-2 ring-cyan-300/20 shadow-[0_18px_45px_-28px_rgba(34,211,238,0.65)]"
                      : "border-white/12 bg-white/6 hover:border-cyan-300/30 hover:bg-white/10",
                  )}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-50">Opción {index + 1}</div>
                    <div className="text-base text-slate-200/75">{option.text}</div>
                  </div>
                  <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-slate-50", isSelected && "border-cyan-300/40 bg-cyan-400/20 text-white") }>
                    {isSelected ? "✓" : null}
                  </div>
                </button>
              );
            })}
          </div>

          {error ? <p className="glass-panel rounded-xl px-3 py-2 text-sm text-rose-100">{error}</p> : null}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Enviando voto..." : "Votar ahora"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
