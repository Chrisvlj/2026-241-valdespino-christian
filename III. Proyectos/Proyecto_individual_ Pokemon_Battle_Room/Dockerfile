FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
RUN bun run vite build

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
