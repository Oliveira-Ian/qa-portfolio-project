# Build context is the repo root (npm workspaces; prisma/ lives there too) —
# see docker-compose.yml.
FROM node:22-slim AS deps
WORKDIR /repo
# Prisma's schema engine (`prisma migrate deploy`) needs libssl; node:22-slim doesn't ship it.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/schemas/package.json packages/schemas/package.json
RUN npm ci

FROM deps AS build
WORKDIR /repo
COPY . .
# The Prisma Client is generated source (git-ignored, written into
# apps/api/src/generated) — it must be generated here, never copied in from a
# host build.
RUN npm run db:generate
RUN npm run build -w packages/schemas
RUN npm run build -w apps/api

FROM node:22-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/prisma ./prisma
COPY --from=build /repo/prisma.config.ts ./prisma.config.ts
# The entrypoint's seed (prisma/seed.ts) imports the generated client from source.
COPY --from=build /repo/apps/api/src/generated ./apps/api/src/generated
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
EXPOSE 3000
# `--import` loads the OpenTelemetry bootstrap before the app, or the libraries
# it instruments would already be loaded. With no collector reachable the
# exporters drop their data quietly — see docs/operations/observability.md.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node --import ./apps/api/dist/instrumentation.js apps/api/dist/server.js"]
