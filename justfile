# AreteLifeOS — Justfile

build:
    pnpm build

test:
    pnpm test

test:coverage:
    pnpm test --coverage

typecheck:
    pnpm typecheck

lint:
    pnpm lint

lint:fix:
    pnpm lint --fix

dev:
    pnpm dev

deploy:
    vercel deploy --prod

preview:
    vercel

install:
    pnpm install

clean:
    rm -rf node_modules dist .next

health:
    bash .agent/scripts/health.sh
