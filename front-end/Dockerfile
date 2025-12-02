# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code (includes .env.production for Vite)
COPY . .

# Build the application (Vite uses .env.production automatically)
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy nginx config template
COPY nginx.conf /etc/nginx/conf.d/configfile.template

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run provides PORT env variable, default to 8080
ENV PORT=8080
ENV HOST=0.0.0.0

EXPOSE 8080

# Use envsubst to replace $PORT in nginx config, then start nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/configfile.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
