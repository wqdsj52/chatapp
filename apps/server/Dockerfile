FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY apps/server/package.json apps/server/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY apps/server/ .
RUN pnpm build
EXPOSE 3001
CMD ["node", "dist/main.js"]
