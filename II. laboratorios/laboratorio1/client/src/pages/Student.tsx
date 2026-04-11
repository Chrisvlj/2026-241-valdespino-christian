import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { JoinPoll } from "@/components/JoinPoll";
import { PollResults } from "@/components/PollResults";
import { VoteForm } from "@/components/VoteForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPollByCode, getPollResults, votePoll } from "@/services/api";
import type { PollResults as PollResultsType } from "@/types";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function Student() {
  const [code, setCode] = useState("");
  const [voterName, setVoterName] = useState("");
  const [poll, setPoll] = useState<PollResultsType | null>(null);
  const [results, setResults] = useState<PollResultsType | null>(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingVote, setLoadingVote] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const joinPoll = async () => {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedName = voterName.trim();

    if (normalizedCode.length !== 6) {
      setJoinError("El código debe tener 6 caracteres.");
      return;
    }

    if (!normalizedName) {
      setJoinError("Escribe tu nombre.");
      return;
    }

    setLoadingJoin(true);
    try {
      const data = await getPollByCode(normalizedCode);
      setPoll(data);
      setResults(data);
      setJoinError(null);
      setVoteError(null);
      const alreadyVoted = data.votes.some((vote) => normalizeName(vote.voterName) === normalizeName(normalizedName));
      setVoted(data.status === "closed" || alreadyVoted);
      if (alreadyVoted) {
        setVoteError("Ya votaste");
      }
    } catch (joinPollError) {
      setJoinError(joinPollError instanceof Error ? joinPollError.message : "No se pudo unir a la encuesta");
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!poll) return;

    setLoadingVote(true);
    try {
      const data = await votePoll(poll._id, { optionIndex, voterName: voterName.trim() });
      setResults(data);
      setVoted(true);
      setVoteError(null);
    } catch (voteRequestError) {
      setVoteError(voteRequestError instanceof Error ? voteRequestError.message : "No se pudo registrar el voto");
    } finally {
      setLoadingVote(false);
    }
  };

  useEffect(() => {
    if (!poll || !voted) return;

    let active = true;

    const sync = async () => {
      try {
        setLoadingResults(true);
        const data = await getPollResults(poll._id);
        if (!active) return;
        setResults(data);
      } catch (resultsError) {
        if (!active) return;
        setVoteError(resultsError instanceof Error ? resultsError.message : "No se pudieron actualizar los resultados");
      } finally {
        if (active) setLoadingResults(false);
      }
    };

    void sync();
    const interval = window.setInterval(sync, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [poll, voted]);

  const joinedView = poll && results;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link to="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit px-0")}>← Volver</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Vista del estudiante</h1>
          <p className="max-w-2xl text-slate-200/75">Únete con un código, vota una sola vez y revisa resultados desde tu teléfono.</p>
        </div>
        <Button variant="outline" onClick={() => {
          setPoll(null);
          setResults(null);
          setVoted(false);
          setJoinError(null);
          setVoteError(null);
        }}>
          Reiniciar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <JoinPoll
          code={code}
          voterName={voterName}
          onCodeChange={setCode}
          onVoterNameChange={setVoterName}
          onJoin={joinPoll}
          loading={loadingJoin}
          error={joinError}
        />

        <section className="space-y-4">
          {joinedView ? (
            voted ? (
              <div className="space-y-4">
                {voteError ? <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-rose-100">{voteError}</div> : null}
                {loadingResults ? <Card><CardContent className="p-8 text-center text-slate-200/70">Actualizando resultados...</CardContent></Card> : null}
                {results ? <PollResults results={results} showCloseAction={false} /> : null}
              </div>
            ) : poll.status === "active" ? (
              <div className="space-y-4">
                {voteError ? <div className="glass-panel rounded-2xl px-4 py-3 text-sm text-rose-100">{voteError}</div> : null}
                <VoteForm poll={poll} voterName={voterName.trim()} onVote={handleVote} loading={loadingVote} />
                <Card>
                  <CardContent className="p-6 text-sm text-slate-200/70">
                    Cuando votes, aquí verás los resultados actualizándose cada 5 segundos.
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6 text-sm text-slate-200/70">
                    La encuesta ya fue cerrada. Solo puedes ver los resultados.
                  </CardContent>
                </Card>
                {results ? <PollResults results={results} showCloseAction={false} /> : null}
              </div>
            )
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-slate-200/70">
                Ingresa el código para ver la encuesta disponible y comenzar a votar.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
