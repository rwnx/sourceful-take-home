# Requirements
I translated the brief into user stories for clarity.

## As a User
* ✅ I want to select an animal from a dropdown, so that I can specify what type of animal to generate
* ✅ I want to select the number of images to generate, so that I can control the output quantity
* ✅ I want to click a "generate" button, so that I can trigger the image generation process
* ✅ I want to see a placeholder when my request is enqueued, so that I know my request is being processed
* ✅ I want to see all generated images in a grid, so that I can view my results
* ✅ I want the grid to support infinite scrolling, so that I can browse many images easily
* ✅ I want my placeholders and results to persist across page refreshes, so that I see a consistent experience

## As an Interviewer
* ✅ I want to see a comprehensive README.md, so that I can run the project locally without asking the original developer
* ✅ I want to see a method of changing the image generation provider, so that I understand the developer is considering vendor lifecycle while developing
* ⁉️ I want to see the service deployed on a real environment, so that I understand the developer has experience in cloud environments (not fully documented yet)
* ✅ I want to see some tests, so that I understand the developer has experience testing
* ✅ I want to see error handling, so that I understand the developer has experience building robust services
* ❌ I want to see styling that matches Sourceful's branding, so that I can evaluate the developer's attention to design requirements and ability to implement brand guidelines

# Considerations
- Deployment Platform: Vercel
- Image Generation Provider: OpenAI HTTP API via QStash callback flow
- Async Processing / Queue: QStash (retries, DLQ, callback support for serverless limits)
- Image Storage: currently database-backed, should move to CDN/object storage
- Authentication: added to protect real API keys on public endpoints
- Rate Limiting: not implemented (possible via QStash/API layer)
- Provider Failures: stored in DB `error` field

## Other Decisions
- Frontend state management: TanStack Query caching
- Infinite scroll: TanStack Query `useInfiniteQuery`
- Styling/UI: Radix UI + Tailwind

## Assumptions
- Hardcoded list of animals
- Database: Postgres (local via Docker, remote via Prisma)
