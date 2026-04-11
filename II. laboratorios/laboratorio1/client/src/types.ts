export type PollStatus = "active" | "closed";

export interface PollOption {
  text: string;
  votes: number;
}

export interface PollListItem {
  _id: string;
  title: string;
  options: PollOption[];
  status: PollStatus;
  code: string;
  createdAt: string;
  closedAt: string | null;
  totalVotes?: number;
}

export interface PollVote {
  voterName: string;
  optionIndex: number;
  createdAt: string;
}

export interface PollResults extends PollListItem {
  totalVotes: number;
  votes: PollVote[];
}

export interface CreatePollPayload {
  title: string;
  options: string[];
}

export interface VotePayload {
  optionIndex: number;
  voterName: string;
}
