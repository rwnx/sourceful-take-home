# Mock OpenAI Image Service

Simple local HTTP service to mock the OpenAI image generations endpoint.

## Run

```sh
pnpm install
pnpm dev
```

Optional port override:

```sh
PORT=8787 pnpm dev
```

CLI (from any workspace that has `mock-openai-service` as a dependency):

```sh
pnpm exec mock-openai-service --watch
```

## Configure `imagegen`

Set:

```sh
OPENAI_API_URL=http://127.0.0.1:8787
```

The mock service:
- Validates incoming generation payloads with Zod.
- Loads a random `.jpg`/`.jpeg` from `images/` and returns it as `b64_json`.

Create and populate `/Users/rtwell/Developer/sourceful-take-home/tests/mock-openai-service/images`:

```sh
mkdir -p images
```
