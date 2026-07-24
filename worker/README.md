# Live profile clock Worker

Cloudflare Worker generates Tashkent date/time SVG on each request. It replaces minute-by-minute GIF regeneration and GitHub commits.

## Local development

```sh
cd worker
npx wrangler dev
```

Request `http://localhost:8787/clock?theme=dark`.

Run tests from repository root:

```sh
node --test worker/test/clock.test.js
```

## Deploy

Authenticate Wrangler, then deploy from `worker/`:

```sh
npx wrangler login
npx wrangler deploy
```

Replace `YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev` in root `README.md` with deployed hostname.

Do not add cron triggers. Worker computes time when GitHub requests SVG. GitHub Camo can cache images, so README cannot guarantee second-by-second refresh.
