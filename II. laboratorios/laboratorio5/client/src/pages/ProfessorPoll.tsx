import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PollResults } from "@/components/PollResults";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { closePoll, getPollResults } from "@/services/api";
import type { PollResults as PollResultsType } from "@/types";

export function ProfessorPoll() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<PollResultsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Encuesta inválida");
      setLoading(false);
      return;
    }

    let active = true;

    const sync = async () => {
      try {
        const data = await getPollResults(id);
        if (!active) return;
        setResults(data);
        setError(null);
      } catch (pollError) {
        if (!active) return;
        setError(pollError instanceof Error ? pollError.message : "No se pudieron cargar los resultados");
      } finally {
        if (active) setLoading(false);
      }
    };

    void sync();
    const interval = window.setInterval(sync, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [id]);

  const handleClose = async () => {
    if (!id) return;
    setClosing(true);
    try {
      await closePoll(id);
      const data = await getPollResults(id);
      setResults(data);
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "No se pudo cerrar la encuesta");
    } finally {
      setClosing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link to="/professor" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit px-0")}>← Volver</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Resultados del profesor</h1>
          <p className="max-w-2xl text-slate-200/75">Actualización automática cada 3 segundos usando polling básico.</p>
        </div>
        <Button variant="outline" onClick={() => void navigate(`/professor`)}>
          Panel del profesor
        </Button>
      </div>

      {error ? <div className="mb-6 glass-panel rounded-2xl px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-200/70">Cargando resultados...</CardContent>
        </Card>
      ) : results ? (
        <PollResults results={results} onClose={handleClose} closing={closing} />
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-slate-200/70">No se encontró la encuesta.</CardContent>
        </Card>
      )}
    </main>
  );
}
