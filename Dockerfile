FROM node:24-slim AS build
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=/data/santa.db \
    DATA_DIR=/data \
    MIGRATIONS_DIR=/app/drizzle \
    BODY_SIZE_LIMIT=12M
COPY --from=build /app/build build
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/drizzle drizzle
COPY package.json .
# uid 1000 (the image's "node" user) so files in ./data stay owned by the host user
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "build"]
