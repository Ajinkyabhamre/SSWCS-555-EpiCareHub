# Frontend Dockerfile - Multi-stage build for Vite React app

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app (will use VITE_API_BASE_URL from build args)
ARG VITE_API_BASE_URL
ARG VITE_PYTHON_API_URL
ARG VITE_EPICARE_DEV_MODE
ARG VITE_ENABLE_WEBGL_BRAIN

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_PYTHON_API_URL=$VITE_PYTHON_API_URL
ENV VITE_EPICARE_DEV_MODE=$VITE_EPICARE_DEV_MODE
ENV VITE_ENABLE_WEBGL_BRAIN=$VITE_ENABLE_WEBGL_BRAIN

RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
