FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* se incrusta en el bundle del navegador en tiempo de BUILD,
# no al arrancar el contenedor, así que debe llegar como build-arg (ver
# docker-compose.yml) y no como una variable de entorno normal de runtime.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
