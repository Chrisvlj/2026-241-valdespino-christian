import type { APIRequestContext, APIResponse } from "@playwright/test";

const API_BASE_URL = process.env.VITE_API_URL ?? "http://127.0.0.1:3001";

export type PollStatus = "active" | "closed";

export type PollOption = {
  text: string;
  votes: number;
};

export type PollListItem = {
  _id: string;
  title: string;
  options: PollOption[];
  status: PollStatus;
  code: string;
  createdAt: string;
  closedAt: string | null;
  totalVotes?: number;
};

export type PollResults = PollListItem & {
  totalVotes: number;
  votes: Array<{
    voterName: string;
    optionIndex: number;
    createdAt: string;
  }>;
};

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatError(response: APIResponse, payload: unknown) {
  const message = typeof payload === "object" && payload !== null && "error" in payload ? String((payload as { error: unknown }).error) : "Unknown API error";
  return `${response.status()} ${response.statusText()} - ${message}`;
}

async function parseJson<T>(response: APIResponse): Promise<T> {
  return (await response.json()) as T;
}

export function buildTestTitle(prefix: string) {
  return `${prefix} ${uniqueSuffix()}`;
}

export function buildStudentName(prefix = "Estudiante") {
  return `${prefix} ${uniqueSuffix()}`;
}

export async function waitForApi(request: APIRequestContext, timeoutMs = 45_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await request.get(`${API_BASE_URL}/health`, { timeout: 2_000 });
      if (response.ok()) {
        return;
      }
    } catch {
      // Retry while server boots.
    }

    await sleep(1_000);
  }

  throw new Error(`API no disponible en ${API_BASE_URL} tras ${timeoutMs}ms`);
}

export async function listPolls(request: APIRequestContext) {
  const response = await request.get(`${API_BASE_URL}/api/polls`);
  if (!response.ok()) {
    const payload = await response.json().catch(() => null);
    throw new Error(`No se pudo listar encuestas: ${formatError(response, payload)}`);
  }

  return parseJson<PollListItem[]>(response);
}

export async function cleanupPolls(request: APIRequestContext) {
  await waitForApi(request);
  const polls = await listPolls(request);

  for (const poll of polls) {
    const response = await request.delete(`${API_BASE_URL}/api/polls/${poll._id}`);
    if (!response.ok() && response.status() !== 404) {
      const payload = await response.json().catch(() => null);
      throw new Error(`No se pudo limpiar encuesta ${poll._id}: ${formatError(response, payload)}`);
    }
  }
}

export async function createPollViaApi(
  request: APIRequestContext,
  data?: {
    title?: string;
    options?: string[];
  },
) {
  const payload = {
    title: data?.title ?? buildTestTitle("Encuesta e2e"),
    options: data?.options ?? ["React", "Vue"],
  };

  const response = await request.post(`${API_BASE_URL}/api/polls`, {
    data: payload,
  });

  if (!response.ok()) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(`No se pudo crear encuesta por API: ${formatError(response, errorPayload)}`);
  }

  return parseJson<PollListItem>(response);
}

export async function getPollResultsById(request: APIRequestContext, pollId: string) {
  const response = await request.get(`${API_BASE_URL}/api/polls/${pollId}/results`);

  if (!response.ok()) {
    const payload = await response.json().catch(() => null);
    throw new Error(`No se pudieron consultar resultados de ${pollId}: ${formatError(response, payload)}`);
  }

  return parseJson<PollResults>(response);
}
