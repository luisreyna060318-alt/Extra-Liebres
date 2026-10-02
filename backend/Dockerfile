# Etapa de build
FROM node:22-alpine AS build
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Etapa de ejecucion
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
# Evita que el CLI de Prisma intente enviar telemetria al arrancar.
ENV CHECKPOINT_DISABLE=1
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# Los scripts de prisma/ (seed e importacion) se ejecutan con tsx e importan
# utilidades de src/ (calculo de desempeno, iniciales de IDs).
COPY --from=build /app/src ./src
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
# El proceso no necesita privilegios de root.
USER node
EXPOSE 4000
# Aplica las migraciones pendientes y arranca la API. "exec" deja a node como
# proceso principal para que reciba SIGTERM y cierre ordenadamente.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.js"]
