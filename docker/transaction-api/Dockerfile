FROM node:18-alpine AS builder

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

WORKDIR /app

COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules

COPY --chown=nodeuser:nodejs . .

USER nodeuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]