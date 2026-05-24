FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
# Skip vite build — dist/ is pre-built
# RUN bun run vite build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
