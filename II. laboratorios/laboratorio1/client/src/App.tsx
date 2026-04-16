import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { Professor } from "@/pages/Professor";
import { ProfessorPoll } from "@/pages/ProfessorPoll";
import { Student } from "@/pages/Student";

const GITHUB_REPOSITORY_URL = "https://github.com/Chrisvlj/2026-241-valdespino-christian";

export function App() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 noise-overlay opacity-[0.08] mix-blend-soft-light" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <a
        href={GITHUB_REPOSITORY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver repositorio en GitHub"
        className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-slate-100/85 backdrop-blur-xl transition-all hover:border-cyan-300/35 hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12 0C5.37 0 0 5.5 0 12.27c0 5.41 3.44 10 8.21 11.62.6.12.82-.27.82-.59 0-.29-.01-1.07-.02-2.11-3.34.75-4.04-1.66-4.04-1.66-.55-1.41-1.33-1.78-1.33-1.78-1.08-.76.08-.75.08-.75 1.2.09 1.83 1.26 1.83 1.26 1.06 1.87 2.79 1.33 3.47 1.02.11-.79.42-1.33.76-1.63-2.67-.31-5.47-1.37-5.47-6.09 0-1.35.47-2.45 1.24-3.31-.13-.31-.54-1.58.12-3.29 0 0 1.01-.33 3.3 1.26a11.23 11.23 0 0 1 6 0c2.29-1.59 3.29-1.26 3.29-1.26.66 1.71.25 2.98.12 3.29.77.86 1.24 1.96 1.24 3.31 0 4.73-2.8 5.78-5.48 6.08.43.39.81 1.14.81 2.3 0 1.66-.01 2.99-.01 3.4 0 .33.22.72.83.59C20.56 22.27 24 17.68 24 12.27 24 5.5 18.63 0 12 0z" />
        </svg>
        <span className="sr-only">Repositorio GitHub</span>
      </a>
      <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-100/60 backdrop-blur-xl">
        PollClass
      </div>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/professor" element={<Professor />} />
        <Route path="/professor/poll/:id" element={<ProfessorPoll />} />
        <Route path="/student" element={<Student />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
