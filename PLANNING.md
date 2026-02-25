# Requirements
I translated the brief into user stories for my own clarity and to help you understand my process:

## As a User
* I want to select an animal from a dropdown, so that I can specify what type of animal to generate
* I want to select the number of images to generate, so that I can control the output quantity
* I want to click a "generate" button, so that I can trigger the image generation process
* I want to see a placeholder when my request is enqueued, so that I know my request is being processed
* I want to see all generated images in a grid, so that I can view my results
* I want the grid to support infinite scrolling, so that I can browse many images easily
* I want my placeholders and results to persist across page refreshes, so that I see a consistent experience

## As an Interviewer
* I want to see a comprehensive README.md, so that I can run the project locally without asking the original developer
* I want to see a method of changing the image generation provider, so that I understand the developer is considering vendor lifecycle while developing
* I want to see the service deployed on a real environment, so that I understand the developer has experience in cloud environments
* I want to see some tests, so that I understand the developer has experience testing
* I want to see error handling, so that I understand the developer has experience building robust services
* I want to see styling that matches Sourceful's branding, so that I can evaluate the developer's attention to design requirements and ability to implement brand guidelines


# Considerations
* Deployment Platform
    * Vercel
* Image Generation Provider
    * openai http api via qstack callbacks
* Async Processing / Job queue
    * I chose qstash because it gives a lot of processing features for free (retries, dlq, etc)
    * using qstash's callback feature to make qstash hold the blocking connection instead of the api (which vercel wont run)
* Image storage
    * currently stored in DB - should be in a CDN to take advantage of caching
        * vercel blob?
* Authentication
    * wasnt technically on the brief but i didnt want to put a real openAI key on a public url without auth!

* Rate limiting
    * did not implement but is possible with qstash
* Provider Failures
    * stored in db `error` field

## Other Decisions
* Frontend State management: provided via tanstack-query caching
* Infinite Scroll: provided via tanstack-query InfiniteQuery feature
* Styling & UI: using radix-ui + tailwind
* Environment Vars

## Assumptions
* Hardcoded list of animals

* database: postgres
    * locally: docker
    * remote: prisma
