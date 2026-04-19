import type { CreatePollPayload, PollListItem, PollResults, VotePayload } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? response.statusText ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export function getPolls() {
  return request<PollListItem[]>("/api/polls");
}

export function createPoll(payload: CreatePollPayload) {
  return request<PollListItem>("/api/polls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPollById(id: string) {
  return request<PollResults>(`/api/polls/${id}`);
}

export function getPollByCode(code: string) {
  return request<PollResults>(`/api/polls/code/${code.toUpperCase()}`);
}

export function getPollResults(id: string) {
  return request<PollResults>(`/api/polls/${id}/results`);
}

export function closePoll(id: string) {
  return request<PollListItem>(`/api/polls/${id}/close`, {
    method: "PATCH",
  });
}

export function deletePoll(id: string) {
  return request<{ ok: boolean }>(`/api/polls/${id}`, {
    method: "DELETE",
  });
}

export function votePoll(id: string, payload: VotePayload) {
  return request<PollResults>(`/api/polls/${id}/vote`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
