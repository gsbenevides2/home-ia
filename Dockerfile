FROM denoland/deno:latest
WORKDIR /app
COPY . .
CMD ["deno", "run", "start"]