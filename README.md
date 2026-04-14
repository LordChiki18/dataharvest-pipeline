  # DataHarvest Pipeline Service

  ## Architecture

  Scheduler → [scrape-pending] → Scraper Worker → [scrape-raw] → Transformer → [scrape-processed] → Persister → PostgreSQL

  ## Tech Stack
  - Node.js 20 + TypeScript
  - BullMQ (Redis-backed queues)
  - PostgreSQL + Knex.js migrations
  - Express.js REST API
  - Pino structured logging
  - Docker Compose

  ## Local Setup

  ### With Docker
  ```bash
  docker-compose up -d
  npm install
  npm run migrate
  npm run dev

  Without Docker

  1. Install PostgreSQL and Redis locally
  2. Copy .env.example to .env and fill in your values
  3. Run npm run migrate
  4. Run npm run dev

  Environment Variables

  ┌─────────────────────────┬──────────────────────────────────┬──────────────┐
  │        Variable         │           Description            │   Default    │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ DATABASE_URL            │ PostgreSQL connection string     │ -            │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ REDIS_URL               │ Redis connection string          │ -            │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ SCRAPER_CONCURRENCY     │ Max concurrent scraper jobs      │ 3            │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ TRANSFORMER_CONCURRENCY │ Max concurrent transformer jobs  │ 5            │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ PERSISTER_CONCURRENCY   │ Max concurrent persister jobs    │ 2            │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ BOOK_SCHEDULE           │ Cron schedule for books scrape   │ 0 2 * * *    │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ HN_SCHEDULE             │ Cron schedule for HN scrape      │ */15 * * * * │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ REQUEST_DELAY_MS        │ Delay between HTTP requests (ms) │ 1000         │
  ├─────────────────────────┼──────────────────────────────────┼──────────────┤
  │ PORT                    │ API server port                  │ 3000         │
  └─────────────────────────┴──────────────────────────────────┴──────────────┘

  Triggering a Scrape Job

  curl -X POST http://localhost:3000/api/v1/jobs/trigger \
    -H "Content-Type: application/json" \
    -d '{"source": "hackernews"}'

  Monitoring Queue Status

  curl http://localhost:3000/api/v1/metrics

  API Endpoints

  - POST /api/v1/jobs/trigger - Trigger a scrape job
  - POST /api/v1/jobs/dlq/:jobId/retry - Retry a DLQ job
  - GET /api/v1/jobs - List all jobs
  - GET /api/v1/jobs/dlq/:id - Get dlq contents
  - GET /api/v1/jobs/:id - Get job detail
  - GET /api/v1/books - List books
  - GET /api/v1/books/:upc - Get book by UPC
  - GET /api/v1/stories - List HN stories
  - GET /api/v1/stories/:hn_item_id - Get story by ID
  - GET /api/v1/metrics - Queue metrics
  - GET /api/v1/health - Health check
  - DELETE /api/v1/jobs/dlq/:id - Delete a DLQ job

  ## Retry Policies

  | Worker      | Attempts | Backoff              |
  |-------------|----------|----------------------|
  | Scraper     | 3        | Exponential (2000ms) |
  | Transformer | 2        | Fixed (5000ms)       |
  | Persister   | 5        | Fixed (5000ms)       |

  Jobs that exhaust all retries are moved to the Dead Letter Queue (DLQ) and can be retried manually via `POST /api/v1/jobs/dlq/:jobId/retry`.

  ## Running Tests

  ```bash
  npm test
  ```

  Unit tests cover book price parsing and star rating conversion (`tests/unit/bookTransformer.test.ts`).

  ## Known Limitations

  - Queue names use hyphens (`scrape-pending`, `scrape-raw`, `scrape-processed`) instead of colons as specified. BullMQ v5 rejects queue names containing `:` characters.
  - Category extraction defaults to 'Unknown' — full category scraping can be added by following the category page links