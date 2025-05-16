FROM oven/bun:latest
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends dnsutils curl wget procps ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY . .
RUN bun install
RUN bun run build
ENV DATA_PATH=/app/data
RUN mkdir -p $DATA_PATH
CMD ["bun", "run", "start"]