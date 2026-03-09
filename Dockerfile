# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL deps (including dev for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build the Vite frontend
RUN npm run build


# ---- Stage 2: Production image ----
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server and supporting files
COPY server.ts ./
COPY tsconfig.json ./
COPY src/types.ts ./src/types.ts
COPY src/lib/ ./src/lib/

# tsx is needed to run server.ts directly (it's a devDependency but we need it in prod)
# Install tsx globally so we can run the TypeScript server
RUN npm install -g tsx

# Create a directory for the persistent SQLite database
RUN mkdir -p /app/data

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/auth/me || exit 0

# Start the server (server.ts serves static dist/ in production mode)
CMD ["tsx", "server.ts"]
