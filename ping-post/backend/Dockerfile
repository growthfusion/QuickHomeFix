# The read-only API. Nothing else.
#
# It does NOT build or serve the frontend: Caddy serves both static
# sites directly from mounted folders, which means a UI change is a file
# copy rather than an image rebuild.
#
# Build context is the ping-post/ root:
#   docker build -f backend/Dockerfile -t gf-backend .
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/src ./src

ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.js"]
