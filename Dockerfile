FROM node:20-alpine AS deps
WORKDIR /app
# Pin npm to 11.x — the lockfile is generated against npm 11's peer
# resolver, and npm 10 (shipped with Node 20) rejects it with
# "Missing: @swc/helpers@0.5.21 from lock file".
RUN npm install -g npm@11
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* must be available at build time so they get inlined into
# the client bundle. In Coolify, set these as build-time variables on the
# application (Build Configuration → Build Args), or rely on the defaults
# below for first-pass deploys.
ARG NEXT_PUBLIC_SUPABASE_URL=https://api-ris.aliraqia.edu.iq
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL=https://ris.aliraqia.edu.iq
ARG NEXT_PUBLIC_OPENALEX_INSTITUTION_ID
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_OPENALEX_INSTITUTION_ID=$NEXT_PUBLIC_OPENALEX_INSTITUTION_ID
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Coolify health check hits "/" by default; the Next.js server replies 200
# on the locale-redirected landing page once the app boots.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
