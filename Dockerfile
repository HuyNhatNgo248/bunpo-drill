FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/

FROM base AS build-env
RUN pnpm install --frozen-lockfile
COPY . /app/
RUN pnpm run build

FROM base AS production-dependencies-env
RUN pnpm install --frozen-lockfile --prod

FROM node:22-alpine
WORKDIR /app
COPY package.json server.ts /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
CMD ["npm", "run", "start"]
