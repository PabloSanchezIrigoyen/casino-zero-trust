FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src

ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

RUN npm ci && npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "scripts/start.mjs"]
