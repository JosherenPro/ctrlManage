FROM node:20 AS base
WORKDIR /app

# --- Backend ---
FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/ ./
RUN rm -f .env
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate
RUN npm run build

FROM base AS backend
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/backend/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main"]

# --- Frontend ---
FROM base AS frontend-build
WORKDIR /app/frontend
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM base AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=frontend-build /app/frontend/.next ./.next
COPY --from=frontend-build /app/frontend/public ./public
COPY --from=frontend-build /app/frontend/next.config.js* ./
COPY --from=frontend-build /app/frontend/next.config.mjs* ./
EXPOSE 3000
CMD ["npm", "run", "start"]