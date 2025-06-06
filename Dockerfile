FROM oven/bun:latest
WORKDIR /app

# Install basic dependencies and nodejs
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    dnsutils curl wget procps ffmpeg psmisc \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs

# Set up environment variables
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FLUENTFFMPEG_COV=0

COPY . .
RUN bun install
RUN bun run build
ENV DATA_PATH=/app/data
RUN mkdir -p $DATA_PATH
RUN mkdir -p temp

CMD ["bun", "run", "start"]