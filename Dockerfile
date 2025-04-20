FROM oven/bun:1 AS base
WORKDIR /app
RUN apt-get update && apt-get install -y dnsutils curl && rm -rf /var/lib/apt/lists/*
COPY . .
RUN bun install
CMD ["bun", "run", "start"]