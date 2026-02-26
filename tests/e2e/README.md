# Playwright E2E Smoke Test

- Signs in through the SlashID UI using env-based credentials.
- Triggers image generation from the app form.
- Verifies a new image appears in the grid.
- Fails if generation/load error tiles appear.
- Records Playwright artifacts:
  - video
  - trace

Set environment vars:
```
E2E_BASE_URL="http://localhost:3005"
E2E_USER_EMAIL="your-test-user@example.com"
E2E_USER_PASSWORD="your-test-password"
```

Playwright loads env files automatically from `tests/e2e` in this order:
- `.env.development`
- `.env.local` (overrides `.env.development`)

```sh
pnpm i
# Install Playwright browser(s) 
pnpm playwright install

# Run tests!
pnpm playwright test

# Look at the report
pnpm playwright show-report
```
