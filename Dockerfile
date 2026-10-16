# ═════════════════════════════════════════════════════════
# SAMS EDUTECH — PRODUCTION MULTI-STAGE DOCKERFILE
# ═════════════════════════════════════════════════════════

# Base image with Alpine Linux & Node 20 LTS
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Step 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Step 2: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Pass build environment variables if needed
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Disable Turbopack for headless container builds if needed
RUN npm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for maximum container security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create persistent data directory for fallback storage
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
