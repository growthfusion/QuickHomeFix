# Build context is the ping-post/ root, not sync/ -- the service applies
# the migrations, which live outside this folder. A COPY cannot reference
# a parent of its context, so the context is widened instead.
#
# Build with:  docker build -f sync/Dockerfile -t hsp-sync .
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY sync/package*.json ./
RUN npm install --omit=dev

COPY sync/src ./src
COPY clickhouse/migrations /clickhouse/migrations

# Cloud Run injects PORT and expects the container to listen on it.
# Declared for documentation and local runs; Cloud Run overrides it.
ENV PORT=8080
EXPOSE 8080

# HTTP server, not a cron loop: Cloud Scheduler is the clock. A container
# that schedules its own work has to stay warm to be correct, which
# fights scale-to-zero and pays for idle time.
CMD ["node", "src/server.js"]
