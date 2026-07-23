# cypod-telemetry
# Frontend/Dockerfile

# --- build: type-check and produce the static bundle ------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# note: the poll interval is a BUILD argument, not a runtime environment variable. Vite inlines
# every VITE_* value into the bundle at build time, so there is nothing left to configure once the
# image exists — changing it means rebuilding. VITE_API_TARGET is deliberately absent: it only
# configures the dev server's proxy, and in this image nginx plays that role instead.
ARG VITE_TELEMETRY_POLL_INTERVAL_MS=5000
ENV VITE_TELEMETRY_POLL_INTERVAL_MS=$VITE_TELEMETRY_POLL_INTERVAL_MS

RUN npm run build

# --- runtime: nginx serving the bundle and proxying /api --------------------------------------
FROM nginx:1.27-alpine AS runtime

# note: the built app is static files. There is no Node process in this image — shipping one to
# serve a folder of assets would carry an entire runtime, and its CVE surface, for nothing.
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# note: envsubst would otherwise eat nginx's own $host, $uri and friends. Naming the variables
# explicitly limits substitution to the one value that is actually configurable.
ENV API_UPSTREAM=http://api:3000
ENV NGINX_ENVSUBST_VARS="API_UPSTREAM"

EXPOSE 80
