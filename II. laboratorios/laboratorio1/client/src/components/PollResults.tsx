import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PollResults } from "@/types";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6"];

interface PollResultsProps {
  results: PollResults;
  onClose?: (id: string) => Promise<void> | void;
  closing?: boolean;
  showCloseAction?: boolean;
}

export function PollResults({ results, onClose, closing = false, showCloseAction = true }: PollResultsProps) {
  const [copied, setCopied] = useState(false);

  const chartData = useMemo(
    () => results.options.map((option, index) => ({
      name: option.text,
      votes: option.votes,
      color: COLORS[index % COLORS.length],
    })),
    [results.options],
  );

  const optionsByIndex = useMemo(() => results.options.map((option) => option.text), [results.options]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(results.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant={results.status === "active" ? "secondary" : "outline"}>
              {results.status === "active" ? "En vivo" : "Cerrada"}
            </Badge>
            <CardTitle className="text-2xl text-white">{results.title}</CardTitle>
            <CardDescription className="text-slate-200/70">{results.totalVotes} votos registrados</CardDescription>
          </div>
          <div className="glass-panel-soft rounded-2xl px-4 py-3 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200/60">Código</div>
            <div className="font-mono text-4xl font-semibold tracking-[0.25em] text-cyan-50">{results.code}</div>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={copyCode}>
              {copied ? "Copiado" : "Copiar código"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="glass-panel-soft rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-semibold text-white">Resultados en tiempo real</h4>
            <span className="text-sm text-slate-200/60">Gráfico horizontal</span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" allowDecimals={false} stroke="rgba(226,232,240,0.7)" tick={{ fill: "rgba(226,232,240,0.7)" }} />
                <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} stroke="rgba(226,232,240,0.7)" tick={{ fill: "rgba(226,232,240,0.7)" }} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(6, 17, 31, 0.88)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    color: "#e2e8f0",
                    backdropFilter: "blur(20px)",
                  }}
                  labelStyle={{ color: "#f8fafc" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="votes" radius={[0, 12, 12, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-white">Detalle de votos</h4>
            <span className="text-sm text-slate-200/60">{results.votes.length} registros</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/6 backdrop-blur-2xl">
            <div className="grid grid-cols-2 border-b border-white/10 bg-white/8 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-200/60 sm:grid-cols-[1.2fr_1.8fr_0.8fr]">
              <span>Estudiante</span>
              <span className="hidden sm:block">Opción</span>
              <span className="text-right">Hora</span>
            </div>
            <div className="divide-y divide-white/10">
              {results.votes.length > 0 ? (
                results.votes.map((vote) => (
                  <div key={`${vote.voterName}-${vote.createdAt}`} className="grid grid-cols-2 gap-2 px-4 py-3 text-sm sm:grid-cols-[1.2fr_1.8fr_0.8fr]">
                    <span className="font-medium text-slate-50">{vote.voterName}</span>
                    <span className="hidden text-slate-200/70 sm:block">{optionsByIndex[vote.optionIndex] ?? `Opción ${vote.optionIndex + 1}`}</span>
                    <span className="text-right text-slate-200/60">{new Date(vote.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-slate-200/70 sm:hidden">{optionsByIndex[vote.optionIndex] ?? `Opción ${vote.optionIndex + 1}`}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-slate-200/70">Todavía no hay votos.</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      {showCloseAction ? (
        <CardFooter className="justify-end">
          <Button variant="destructive" onClick={() => onClose?.(results._id)} disabled={closing || results.status === "closed"}>
            {closing ? "Cerrando..." : results.status === "closed" ? "Encuesta cerrada" : "Cerrar encuesta"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
