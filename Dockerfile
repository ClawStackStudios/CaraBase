# Stage 1: Builder (Compiles frontend, backend, and native modules)
FROM node:26-bookworm AS builder
WORKDIR /app

# Install native compilation toolchain for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++

# Install all dependencies (including devDependencies required for vite/esbuild)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend (Vite) and backend (esbuild)
RUN npm run build


# Stage 2: Production Dependencies Only
FROM node:26-bookworm AS prod-deps
WORKDIR /app

# Install native compilation toolchain
RUN apt-get update && apt-get install -y python3 make g++

COPY package.json package-lock.json ./
# Install only production dependencies to keep the image lightweight
RUN npm ci --omit=dev


# Stage 3: Runner (Minimal production image)
FROM node:26-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5353

# Install user/group management utilities for PUID/PGID support
RUN apt-get update && apt-get install -y --no-install-recommends passwd \
    && rm -rf /var/lib/apt/lists/*

# Copy production node_modules from the prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules
# Copy built assets and package config from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy and configure entrypoint
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create the data directory (ownership is handled dynamically by entrypoint)
RUN mkdir -p /app/data

VOLUME ["/app/data"]
EXPOSE 5353

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
