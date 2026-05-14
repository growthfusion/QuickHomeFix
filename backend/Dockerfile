FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY server.js ./
COPY jobs/ ./jobs/

EXPOSE 8080

ENV PORT=8080

CMD ["node", "server.js"]
