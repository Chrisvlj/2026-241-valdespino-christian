import type { Context, Next } from "hono";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error(error);
    return c.json(
      {
        error: "Internal Server Error",
      },
      500,
    );
  }
}
