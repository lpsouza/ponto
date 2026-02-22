# Stage 1: Build React app
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: PocketBase
FROM alpine:latest AS production-stage

# Install dependencies for PocketBase (unzip, ca-certificates)
RUN apk add --no-cache \
    unzip \
    ca-certificates \
    curl \
    sqlite

# PocketBase version
ENV PB_VERSION=0.36.4

# Download and install PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip

# Copy the built frontend to PocketBase's public folder
COPY --from=build-stage /app/dist /pb/pb_public
COPY ./pb_hooks /pb/pb_hooks

EXPOSE 8080

# Start PocketBase and serve the app
# --http=0.0.0.0:8080 allows external access
# --dir=/pb/pb_data ensures data persistence if mounted as volume
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb/pb_data"]
