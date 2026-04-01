FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── 빌드 ──
FROM base AS build
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/ ./frontend/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=frontend run build

# ── 실행 ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public
EXPOSE 3000
CMD ["node", "frontend/server.js"]
