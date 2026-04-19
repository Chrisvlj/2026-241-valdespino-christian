import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Landing() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/6 p-6 shadow-[0_30px_100px_-45px_rgba(15,23,42,0.95)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,transparent_72%,rgba(255,255,255,0.05))]" />
          <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative space-y-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-50 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
              PollClass · Glassmorphism live voting
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Votaciones en clase con una capa de cristal, luz y tiempo real.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200/80 sm:text-lg">
                El profesor crea la encuesta, el estudiante entra con código desde el celular y los resultados se refrescan con polling básico.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/professor" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                Soy Profesor
              </Link>
              <Link to="/student" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
                Soy Estudiante
              </Link>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="glass-panel-soft rounded-2xl p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Profesor</div>
                <p className="mt-2 text-sm text-slate-100/85">Crea, cierra y elimina encuestas.</p>
              </div>
              <div className="glass-panel-soft rounded-2xl p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Estudiante</div>
                <p className="mt-2 text-sm text-slate-100/85">Vota desde el móvil en segundos.</p>
              </div>
              <div className="glass-panel-soft rounded-2xl p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-100/70">Stack</div>
                <p className="mt-2 text-sm text-slate-100/85">React, Bun, MongoDB, Tailwind y Recharts.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 self-center">
          <Card>
            <CardContent className="space-y-2 p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Flujo</div>
              <p className="text-base text-slate-100/90">El código ocupa el centro visual, como una credencial compartible.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/70">Responsive</div>
              <p className="text-base text-slate-100/90">La experiencia prioriza pantallas pequeñas sin perder legibilidad.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-6">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-100/70">Actualización</div>
              <p className="text-base text-slate-100/90">Resultados en vivo con polling, sin websockets.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
