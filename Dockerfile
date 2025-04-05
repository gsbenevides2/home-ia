FROM denoland/deno:latest
WORKDIR /app
RUN apt-get update && apt-get install -y dnsutils && rm -rf /var/lib/apt/lists/*
COPY . .
CMD ["deno", "run", "start"]