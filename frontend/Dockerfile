# The ping-post dashboard is a React app living outside this directory,
# so it is built here rather than committed as build output. Build
# context is the repo root (see deploy workflows), not frontend/.
FROM node:20-alpine AS ping-post-build

WORKDIR /build

# Install against the lockfiles alone first, so edits to source do not
# invalidate the dependency layer.
COPY ping-post/frontend/package.json ping-post/frontend/package-lock.json ./
RUN npm ci

COPY ping-post/frontend/ ./

# base must match the path nginx serves it from, or every asset 404s.
ENV VITE_BASE=/ping-post/
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


FROM nginx:alpine

COPY frontend/ /usr/share/nginx/html

COPY --from=ping-post-build /build/dist /usr/share/nginx/html/ping-post

RUN rm -f /usr/share/nginx/html/.env \
          /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/.dockerignore

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
