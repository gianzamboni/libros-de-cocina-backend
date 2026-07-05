FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

COPY . .

# prisma.config.ts requires DATABASE_URL to resolve even for `prisma generate`
# (which never connects to the DB). docker-compose overrides this at runtime.
ENV DATABASE_URL="postgresql://postgres:postgres@db:5432/libros_de_cocina?schema=public"
RUN pnpm prisma:generate

EXPOSE 3001

CMD ["pnpm", "dev"]
