FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY packages/shared ./packages/shared
COPY apps/admin ./apps/admin

RUN yarn install --frozen-lockfile --registry https://registry.npmmirror.com \
  && yarn workspace @philosophy/admin build

FROM nginx:alpine

COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
