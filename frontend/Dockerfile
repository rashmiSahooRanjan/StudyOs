# ==========================================
# StudyOS Frontend Production Dockerfile
# Stage 1: Vite + React Build
# Stage 2: Nginx Alpine Web Server
# ==========================================

# Stage 1: Build the Vite production bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install npm dependencies using clean install
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build production static bundle to /app/dist
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
