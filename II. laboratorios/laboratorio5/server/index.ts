import { Hono } from "hono";
import { cors } from "hono/cors";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import polls from "./routes/polls";

const app = new Hono();

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type"], allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
app.use("*", errorHandler);

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/polls", polls);

const port = Number(Bun.env.PORT ?? 3001);
const mongoUri = Bun.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/pollclass";

await connectDB(mongoUri);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`PollClass API running on http://localhost:${port}`);
