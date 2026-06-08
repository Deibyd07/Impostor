# --- build/install ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY server/package.json ./
RUN npm install --omit=dev

# --- runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/index.js ./
COPY server/wordBank.js ./
COPY server/avatars.js ./

# Usuario sin privilegios
RUN addgroup -S app && adduser -S app -G app && chown -R app /app
USER app

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["node", "index.js"]
