import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PollCard } from "@/components/PollCard";
import { PollForm } from "@/components/PollForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { closePoll, createPoll, deletePoll, getPolls } from "@/services/api";
import type { PollListItem } from "@/types";

export function Professor() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolls = async () => {
    try {
      setError(null);
      const data = await getPolls();
      setPolls(data);
    } catch (pollError) {
      setError(pollError instanceof Error ? pollError.message : "No se pudieron cargar las encuestas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolls();
  }, []);

  const handleCreate = async (payload: { title: string; options: string[] }) => {
    setSaving(true);
    try {
      await createPoll(payload);
      await loadPolls();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No se pudo crear la encuesta");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closePoll(id);
      await loadPolls();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "No se pudo cerrar la encuesta");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePoll(id);
      await loadPolls();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar la encuesta");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit px-0")}>← Volver</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Vista del profesor</h1>
          <p className="max-w-2xl text-slate-200/75">Crea encuestas y administra el estado de la clase desde una sola pantalla.</p>
        </div>
        <Button variant="outline" onClick={loadPolls}>Actualizar</Button>
      </div>

      {error ? <div className="mb-6 glass-panel rounded-2xl px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <PollForm onSubmit={handleCreate} loading={saving} />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Encuestas</h2>
            <span className="text-sm text-slate-200/70">{polls.length} totales</span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-200/70">Cargando encuestas...</CardContent>
            </Card>
          ) : polls.length > 0 ? (
            <div className="grid gap-4">
              {polls.map((poll) => (
                <PollCard key={poll._id} poll={poll} onClose={handleClose} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-slate-200/70">Todavía no hay encuestas creadas.</CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
