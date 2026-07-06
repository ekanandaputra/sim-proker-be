# ---- Build Stage ----
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma:generate
RUN pnpm build

# ---- Production Stage ----
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
