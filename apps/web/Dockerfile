# Build context is the repo root (npm workspaces) — see docker-compose.yml.
FROM node:20-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/schemas/package.json packages/schemas/package.json
RUN npm ci

FROM deps AS build
WORKDIR /repo
COPY . .
RUN npm run build -w packages/schemas
RUN npm run build -w apps/web

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# The API is called from the Next *server*, never the browser, so this is a
# plain runtime env var (not NEXT_PUBLIC_*, not a build ARG) — it can point at
# the in-network service name (http://api:3000) instead of a host-reachable
# URL, and changing it doesn't require a rebuild.
ENV API_URL=http://api:3000
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
