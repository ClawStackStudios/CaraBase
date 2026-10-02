# Stage 1: Builder (Compiles frontend, backend, and native modules)
<<<<<<< HEAD
<<<<<<< HEAD
FROM node:25-bookworm AS builder
=======
FROM node:25-bookworm AS builder
>>>>>>> origin/dependabot/docker/node-25-bookworm-slim
=======
FROM node:22-bookworm AS builder
>>>>>>> origin/dependabot/npm_and_yarn/minor-and-patch-6f77824635
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
<<<<<<< HEAD
<<<<<<< HEAD
FROM node:25-bookworm AS prod-deps
=======
FROM node:25-bookworm AS prod-deps
>>>>>>> origin/dependabot/docker/node-25-bookworm-slim
=======
FROM node:22-bookworm AS prod-deps
>>>>>>> origin/dependabot/npm_and_yarn/minor-and-patch-6f77824635
WORKDIR /app

# Install native compilation toolchain
RUN apt-get update && apt-get install -y python3 make g++

COPY package.json package-lock.json ./
# Install only production dependencies to keep the image lightweight
RUN npm ci --omit=dev


# Stage 3: Runner (Minimal production image)
<<<<<<< HEAD
<<<<<<< HEAD
FROM node:25-bookworm-slim AS runner
=======
FROM node:25-bookworm-slim AS runner
>>>>>>> origin/dependabot/docker/node-25-bookworm-slim
=======
FROM node:22-bookworm-slim AS runner
>>>>>>> origin/dependabot/npm_and_yarn/minor-and-patch-6f77824635
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
