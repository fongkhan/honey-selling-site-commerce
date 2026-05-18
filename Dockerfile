FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ && \
    npm ci --include=dev && \
    apt-get purge -y --auto-remove python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npx medusa build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9000
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.medusa/server ./
COPY --from=builder /app/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/node_modules ./node_modules

VOLUME ["/app/uploads"]
EXPOSE 9000
CMD ["npm", "run", "start"]
