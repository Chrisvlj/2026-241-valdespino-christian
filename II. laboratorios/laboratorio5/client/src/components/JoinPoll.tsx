import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface JoinPollProps {
  code: string;
  voterName: string;
  onCodeChange: (value: string) => void;
  onVoterNameChange: (value: string) => void;
  onJoin: () => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
}

export function JoinPoll({ code, voterName, onCodeChange, onVoterNameChange, onJoin, loading = false, error = null }: JoinPollProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onJoin();
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-white">Unirse a encuesta</CardTitle>
        <CardDescription className="text-slate-200/70">Ingresa el código de 6 caracteres y tu nombre para votar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="poll-code">
              Código
            </label>
            <Input
              id="poll-code"
              data-testid="join-poll-code"
              value={code}
              onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              className="font-mono uppercase tracking-[0.3em]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="voter-name">
              Tu nombre
            </label>
            <Input id="voter-name" data-testid="join-poll-voter-name" value={voterName} onChange={(event) => onVoterNameChange(event.target.value)} placeholder="Cristian" maxLength={80} />
          </div>

          {error ? <p className="glass-panel rounded-xl px-3 py-2 text-sm text-rose-100">{error}</p> : null}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Buscando..." : "Unirme"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
