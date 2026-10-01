FROM node:22-alpine AS build
WORKDIR /app
# Por defecto la SPA llama a la API en el mismo origen (/api), via el proxy de nginx.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/cabeceras-seguridad.conf /etc/nginx/snippets/cabeceras-seguridad.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
