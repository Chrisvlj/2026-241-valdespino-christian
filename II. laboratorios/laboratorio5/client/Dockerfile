FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 5173
CMD ["bun", "x", "vite", "--host"]
