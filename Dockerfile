FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./
COPY backend/scripts ./scripts
COPY backend/src ./src

ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

RUN npm ci && npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "scripts/start.mjs"]
