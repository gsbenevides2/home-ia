FROM oven/bun:latest
WORKDIR /app
RUN apt-get update && apt-get install -y dnsutils curl wget && rm -rf /var/lib/apt/lists/*

COPY . .
RUN bun install
RUN bun run build
CMD ["bun", "run", "start"]