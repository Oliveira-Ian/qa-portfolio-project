# Build context is the repo root (npm workspaces; prisma/ lives there too) —
# see docker-compose.yml.
FROM node:20-slim AS deps
WORKDIR /repo
# Prisma's engine needs libssl; node:20-slim doesn't ship it.
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
# The Prisma Client's native engine is OS-specific — must be generated here
# (Linux), never copied in from a host build.
RUN npm run db:generate
RUN npm run build -w packages/schemas
RUN npm run build -w apps/api

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/prisma ./prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && npm run db:seed && node apps/api/dist/server.js"]
