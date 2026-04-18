FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
RUN rm -f .env
RUN npx prisma generate
RUN npm run build

FROM base AS backend
WORKDIR /app
COPY package*.json ./
RUN npm install --force --omit=dev
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/src/main"]