FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_TOKEN_URL
ARG VITE_LIVEKIT_URL

ENV VITE_TOKEN_URL=${VITE_TOKEN_URL}
ENV VITE_LIVEKIT_URL=${VITE_LIVEKIT_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
