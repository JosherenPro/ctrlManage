FROM node:22-alpine AS base
WORKDIR /app

FROM base AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate
RUN npm run build

FROM base AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main"]