# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: PocketBase Server
FROM alpine:latest

# Install CA certificates and unzip
RUN apk add --no-cache ca-certificates unzip wget

# Download PocketBase
ARG PB_VERSION=0.26.8
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x /pocketbase \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Create directories for PocketBase
RUN mkdir -p /pb/pb_data /pb/pb_migrations /pb/pb_public

# Copy the PocketBase binary
RUN cp /pocketbase /pb/pocketbase

# Copy the compiled Vite frontend to pb_public
COPY --from=builder /app/dist /pb/pb_public

# Copy migration files (if any exist locally)
COPY pb_migrations /pb/pb_migrations

WORKDIR /pb

# Expose the default PocketBase port
EXPOSE 8090

# Start PocketBase. We assume migrations are managed via UI and generated into pb_migrations,
# but the container will automatically apply them on startup if present.
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
