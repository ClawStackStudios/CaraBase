# Stage 1: Builder (Compiles frontend, backend, and native modules)
FROM node:22-bookworm AS builder
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
FROM node:22-bookworm AS prod-deps
WORKDIR /app

# Install native compilation toolchain
RUN apt-get update && apt-get install -y python3 make g++

COPY package.json package-lock.json ./
# Install only production dependencies to keep the image lightweight
RUN npm ci --omit=dev


# Stage 3: Runner (Minimal production image)
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5353

# Copy production node_modules from the prod-deps stage
COPY --from=prod-deps /app/node_modules ./node_modules
# Copy built assets and package config from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create the data directory for SQLite and adjust permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

# Switch to the non-root node user for security
USER node

VOLUME ["/app/data"]
EXPOSE 5353

# Start the Node.js server
CMD ["npm", "start"]
