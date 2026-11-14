FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Sin scripts de instalación de terceros
RUN npm ci --ignore-scripts
COPY . .
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Imagen de nginx que corre con un usuario sin privilegios (puerto 8080)
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
