# --- build/install ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev --workspace server

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
WORKDIR /app/server
COPY server/package.json ./
COPY server/*.js ./

# Usuario sin privilegios
RUN addgroup -S app && adduser -S app -G app && chown -R app /app
USER app

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3001}/health" || exit 1

CMD ["node", "index.js"]
