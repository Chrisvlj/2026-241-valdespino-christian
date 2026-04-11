import { Hono } from "hono";
import { Poll } from "../models/Poll";
import { Vote } from "../models/Vote";
import { generatePollCode, isDuplicateKey, normalizeVoterName } from "../utils/code";

type CreatePollBody = {
  title?: string;
  options?: Array<string | { text?: string }>;
};

type VoteBody = {
  optionIndex?: number;
  voterName?: string;
};

const polls = new Hono();

function sanitizeOptions(options: CreatePollBody["options"]) {
  return (options ?? [])
    .map((option) => (typeof option === "string" ? option : option?.text ?? ""))
    .map((text) => text.trim())
    .filter(Boolean);
}

function buildPollResults(poll: { _id: unknown; title: string; options: Array<{ text: string; votes: number }>; status: string; code: string; createdAt?: Date | string; closedAt?: Date | string | null }, votes: Array<{ voterName: string; optionIndex: number; createdAt?: Date | string }>) {
  return {
    _id: poll._id,
    title: poll.title,
    status: poll.status,
    code: poll.code,
    createdAt: poll.createdAt,
    closedAt: poll.closedAt,
    totalVotes: votes.length,
    options: poll.options.map((option, index) => ({
      index,
      text: option.text,
      votes: option.votes,
    })),
    votes: votes.map((vote) => ({
      voterName: vote.voterName,
      optionIndex: vote.optionIndex,
      createdAt: vote.createdAt,
    })),
  };
}

polls.post("/", async (c) => {
  const body = (await c.req.json()) as CreatePollBody;
  const title = body.title?.trim();
  const options = sanitizeOptions(body.options);

  if (!title) {
    return c.json({ error: "El título es obligatorio" }, 400);
  }

  if (options.length < 2) {
    return c.json({ error: "Se requieren al menos dos opciones" }, 400);
  }

  let code = generatePollCode();
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const exists = await Poll.exists({ code });
    if (!exists) break;
    code = generatePollCode();
  }

  if (await Poll.exists({ code })) {
    return c.json({ error: "No se pudo generar un código único" }, 500);
  }

  const poll = await Poll.create({
    title,
    options: options.map((text) => ({ text, votes: 0 })),
    code,
    status: "active",
    closedAt: null,
  });

  return c.json(poll, 201);
});

polls.get("/", async (c) => {
  const pollsList = await Poll.find().sort({ createdAt: -1 }).lean();
  const result = await Promise.all(
    pollsList.map(async (poll) => {
      const votesCount = await Vote.countDocuments({ pollId: poll._id });
      return {
        ...poll,
        totalVotes: votesCount,
      };
    }),
  );

  return c.json(result);
});

polls.get("/code/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const poll = await Poll.findOne({ code }).lean();

  if (!poll) {
    return c.json({ error: "La encuesta no existe" }, 404);
  }

  const votes = await Vote.find({ pollId: poll._id }).sort({ createdAt: -1 }).lean();
  return c.json(buildPollResults(poll, votes));
});

polls.get("/:id", async (c) => {
  const poll = await Poll.findById(c.req.param("id")).lean();

  if (!poll) {
    return c.json({ error: "La encuesta no existe" }, 404);
  }

  const votes = await Vote.find({ pollId: poll._id }).sort({ createdAt: -1 }).lean();
  return c.json(buildPollResults(poll, votes));
});

polls.get("/:id/results", async (c) => {
  const poll = await Poll.findById(c.req.param("id")).lean();

  if (!poll) {
    return c.json({ error: "La encuesta no existe" }, 404);
  }

  const votes = await Vote.find({ pollId: poll._id }).sort({ createdAt: -1 }).lean();
  return c.json(buildPollResults(poll, votes));
});

polls.patch("/:id/close", async (c) => {
  const poll = await Poll.findByIdAndUpdate(
    c.req.param("id"),
    { status: "closed", closedAt: new Date() },
    { new: true },
  ).lean();

  if (!poll) {
    return c.json({ error: "La encuesta no existe" }, 404);
  }

  return c.json(poll);
});

polls.delete("/:id", async (c) => {
  const pollId = c.req.param("id");
  const deleted = await Poll.findByIdAndDelete(pollId).lean();

  if (!deleted) {
    return c.json({ error: "La encuesta no existe" }, 404);
  }

  await Vote.deleteMany({ pollId });
  return c.json({ ok: true });
});

polls.post("/:id/vote", async (c) => {
  const poll = await Poll.findById(c.req.param("id"));

  if (!poll) {
    return c.json({ error: "La encuesta no existe" }, 404);
  }

  if (poll.status === "closed") {
    return c.json({ error: "La encuesta está cerrada" }, 409);
  }

  const body = (await c.req.json()) as VoteBody;
  const optionIndex = Number(body.optionIndex);
  const voterName = body.voterName?.trim();

  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
    return c.json({ error: "Opción inválida" }, 400);
  }

  if (!voterName) {
    return c.json({ error: "El nombre del estudiante es obligatorio" }, 400);
  }

  const normalizedVoterName = normalizeVoterName(voterName);

  const existingVote = await Vote.findOne({ pollId: poll._id, voterKey: normalizedVoterName }).lean();
  if (existingVote) {
    return c.json({ error: "Ya votaste" }, 409);
  }

  try {
    await Vote.create({
      pollId: poll._id,
      optionIndex,
      voterName,
      voterKey: normalizedVoterName,
    });

    poll.options[optionIndex].votes += 1;
    await poll.save();

    const votes = await Vote.find({ pollId: poll._id }).sort({ createdAt: -1 }).lean();
    return c.json(buildPollResults(poll.toObject(), votes), 201);
  } catch (error) {
    if (isDuplicateKey(error)) {
      return c.json({ error: "Ya votaste" }, 409);
    }

    throw error;
  }
});

export default polls;
