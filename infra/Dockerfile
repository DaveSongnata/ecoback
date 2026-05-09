# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
COPY backend/scripts ./scripts
RUN apk add --no-cache python3 make g++ \
 && npm ci --legacy-peer-deps \
 && apk del python3 make g++

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./
RUN node ace build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/build ./
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/scripts ./scripts

RUN npm ci --omit=dev --legacy-peer-deps \
 && npm cache clean --force

RUN mkdir -p /app/storage/uploads && chown -R node:node /app
USER node
EXPOSE 3333

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "bin/server.js"]
