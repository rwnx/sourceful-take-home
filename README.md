# Sourceful Take Home Project
Set your Node version — I'm using [mise](https://mise.jdx.dev).
See `mise.local.toml` and use this version if you're using a different version manager (e.g. nvm)

```sh
# Dependencies
pnpm i

cd apps/imagegen

# Dev services (run separately so you can manage them independently)
docker compose up -d        # start db
pnpm db migrate dev         # migrate dev db
pnpm db studio              # db studio at http://localhost:51212 (optional)
pnpm qstash dev             # start qstash for local testing
pnpm dev                    # start app

# Monitoring
# QStash CLI → https://console.upstash.com/qstash/local-mode-user

# Deploy
pnpm vercel deploy --prod  # requires .env.production
```