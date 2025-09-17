# Stage 1: The Build Stage
# -------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Run the build command to generate the static assets.
RUN npm run build

# Add this line to see what's in the dist directory
RUN ls -l /app/dist

# Stage 2: The Run Stage (using Nginx)
# -------------------------
FROM nginx:stable-alpine

# Set working directory for Nginx.
WORKDIR /usr/share/nginx/html

# Remove the default Nginx static files.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]