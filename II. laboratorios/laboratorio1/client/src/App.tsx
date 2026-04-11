import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { Professor } from "@/pages/Professor";
import { ProfessorPoll } from "@/pages/ProfessorPoll";
import { Student } from "@/pages/Student";

export function App() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 noise-overlay opacity-[0.08] mix-blend-soft-light" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
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
