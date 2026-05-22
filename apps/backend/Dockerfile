FROM node:22-bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json turbo.json ./

COPY apps/backend/package.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json apps/backend/

COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/

RUN npm ci

COPY packages/shared/ packages/shared/

RUN npx turbo run build --filter=@klip/shared

COPY apps/backend/ apps/backend/

COPY apps/backend/prisma apps/backend/prisma/
RUN cd apps/backend && npx prisma generate

RUN npx turbo run build --filter=@klip/backend

FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  python3 \
  curl \
  wget \
  ca-certificates \
  && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/dist /app/dist
COPY --from=builder /app/apps/backend/prisma /app/prisma
COPY --from=builder /app/apps/backend/package.json /app/

COPY --from=builder /app/packages/shared /app/packages/shared

RUN mkdir -p /tmp/klip

EXPOSE 8000

CMD ["node", "dist/main.js"]
