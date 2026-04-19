import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PollListItem } from "@/types";
import { Link } from "react-router-dom";

interface PollCardProps {
  poll: PollListItem;
  onClose: (id: string) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function PollCard({ poll, onClose, onDelete }: PollCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant={poll.status === "active" ? "secondary" : "outline"}>
              {poll.status === "active" ? "Activa" : "Cerrada"}
            </Badge>
            <CardTitle className="text-lg text-white">{poll.title}</CardTitle>
            <CardDescription className="text-slate-200/70">{poll.totalVotes ?? 0} votos · {poll.options.length} opciones</CardDescription>
          </div>
          <div className="glass-panel-soft rounded-xl px-3 py-2 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200/60">Código</div>
            <div className="text-lg font-mono font-semibold tracking-[0.25em] text-cyan-50">{poll.code}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm text-slate-200/80 sm:grid-cols-2 lg:grid-cols-3">
          {poll.options.map((option) => (
            <div key={option.text} className="glass-panel-soft rounded-xl px-3 py-2">
              {option.text}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link
          to={`/professor/poll/${poll._id}`}
          className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
        >
          Ver resultados
        </Link>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onClose(poll._id)} disabled={poll.status === "closed"}>
            Cerrar
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto" onClick={() => onDelete(poll._id)}>
            Eliminar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
