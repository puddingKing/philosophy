FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY packages/shared ./packages/shared
COPY services/api ./services/api

RUN yarn install --frozen-lockfile --registry https://registry.npmmirror.com \
  && yarn workspace @philosophy/api build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/services/api/dist ./services/api/dist
COPY --from=builder /app/services/api/package.json ./services/api/package.json

RUN mkdir -p /app/services/api/uploads

WORKDIR /app/services/api

EXPOSE 3000

CMD ["node", "dist/index.js"]
