import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PollFormProps {
  onSubmit: (payload: { title: string; options: string[] }) => Promise<void> | void;
  loading?: boolean;
}

export function PollForm({ onSubmit, loading = false }: PollFormProps) {
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);

  const updateOption = (index: number, value: string) => {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const addOption = () => setOptions((current) => [...current, ""]);

  const removeOption = (index: number) => {
    setOptions((current) => (current.length <= 2 ? current : current.filter((_, optionIndex) => optionIndex !== index)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!cleanedTitle) {
      setError("Escribe un título para la encuesta.");
      return;
    }

    if (cleanedOptions.length < 2) {
      setError("Agrega al menos dos opciones válidas.");
      return;
    }

    setError(null);
    await onSubmit({ title: cleanedTitle, options: cleanedOptions });
    setTitle("");
    setOptions(["", ""]);
  };

  return (
    <Card className="sticky top-6 h-fit">
      <CardHeader>
        <CardTitle className="text-white">Crear encuesta</CardTitle>
        <CardDescription className="text-slate-200/70">Título y opciones dinámicas para levantar la votación en clase.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100" htmlFor="poll-title">
              Título
            </label>
            <Input
              id="poll-title"
              placeholder="¿Qué framework prefieren?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Opciones</p>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                Agregar opción
              </Button>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    id={`poll-option-${index + 1}`}
                    data-testid={`poll-option-input-${index + 1}`}
                    placeholder={`Opción ${index + 1}`}
                    value={option}
                    onChange={(event) => updateOption(index, event.target.value)}
                    maxLength={80}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(index)} disabled={options.length <= 2}>
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="glass-panel rounded-xl px-3 py-2 text-sm text-rose-100">{error}</p> : null}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creando..." : "Crear encuesta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
