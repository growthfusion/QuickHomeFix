FROM node:20-alpine

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --production

COPY backend/server.js ./
COPY backend/jobs/ ./jobs/

COPY frontend/ /app/frontend/

EXPOSE 8080

ENV PORT=8080

CMD ["node", "server.js"]
