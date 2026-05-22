FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json turbo.json ./

COPY packages/remotion-mcp/package.json packages/remotion-mcp/tsconfig.json packages/remotion-mcp/

RUN npm ci

COPY packages/remotion-mcp/ packages/remotion-mcp/

RUN npx turbo run build --filter=@klip/remotion-mcp

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/remotion-mcp/dist /app/dist
COPY --from=builder /app/packages/remotion-mcp/package.json /app/

EXPOSE 3001

CMD ["node", "dist/http-server.js"]
