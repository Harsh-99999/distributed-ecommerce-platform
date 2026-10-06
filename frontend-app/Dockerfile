# Multi-stage build: Vite production bundle on top of nginx static server.
# Build-time env: VITE_API_URL is intentionally left blank so the SPA emits
# relative /api/... URLs that nginx proxies to api-gateway in the same network.

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV VITE_API_URL=""
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Allow runtime substitution if ever needed.
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD curl -fs http://localhost/ >/dev/null || exit 1
