FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/medusa/package.json apps/medusa/package.json
RUN pnpm install --filter @bangla-blend/medusa... --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/medusa apps/medusa
RUN pnpm --filter @bangla-blend/medusa build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/apps/medusa/.medusa/server ./
EXPOSE 9000
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
