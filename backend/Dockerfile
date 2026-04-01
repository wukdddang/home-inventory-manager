FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# ── 빌드 ──
FROM base AS build
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/ ./backend/
COPY packages/app-styles/package.json packages/app-styles/package.json
RUN pnpm install --frozen-lockfile
RUN pnpm --filter=backend run build
# 프로덕션 의존성만 재설치
RUN pnpm install --frozen-lockfile --prod

# ── 실행 ──
FROM node:20-alpine AS runner
WORKDIR /app
# pnpm symlink 구조를 유지하기 위해 workspace 전체 node_modules 복사
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
ENV NODE_ENV=production
EXPOSE 4200
CMD ["node", "backend/dist/main"]
