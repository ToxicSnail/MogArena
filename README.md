# MogVS

MogVS is a social comparison service. It presents two profile photos, lets an authenticated user choose who "mogs", shows the live result, and closes community battles into an Elo-based leaderboard.

The repository is a working MVP: credentials authentication, profiles, safe image upload, battles, transactional voting, rating, history, user search, a fixture/external profile importer, PostgreSQL persistence, tests, and Docker.

## Architecture

- `src/app`: Next.js App Router pages and thin Route Handlers.
- `src/features`: client forms and feature UI.
- `src/server/services`: business rules (`BattleMatcher`, `VoteService`, `RatingService`, importer and image classifier).
- `src/server/repositories`: Prisma persistence adapters.
- `src/server/external/tsu`: fetch policy, parser, fixture transport and importer factory.
- `src/server/storage`: replaceable `StorageProvider`; local disk is the MVP implementation.
- `prisma`: PostgreSQL schema, migration and deterministic offline seed.

Battle closure uses a serializable PostgreSQL transaction. A battle closes when `BATTLE_VOTE_TARGET` votes are reached. Elo and win/loss counters change once; a tie closes without rating changes.

## Local Installation

Requirements: Node.js 22+, npm, Docker, and Docker Compose.

```bash
cp .env.example .env
# Set AUTH_SECRET in .env to the output of: openssl rand -base64 32
docker compose up -d postgres
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The development-only seed creates `alex@mogvs.local` with password `demo12345`. It refuses to run with `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is explicitly set.

To run the complete application in containers (the default Compose command starts only PostgreSQL for local Next.js development):

```bash
docker compose --profile full up --build
docker compose --profile full run --rm -e ALLOW_DEMO_SEED=true migrate npx prisma db seed
```

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run db:migrate
npm run db:seed
```

Integration tests use an isolated opt-in database and are skipped otherwise:

```bash
TEST_DATABASE_URL=postgresql://mogvs:mogvs@localhost:5432/mogvs_test npm test
```

## Profile Importer

Importer input is a pre-approved text/JSON list. It never scans or guesses IDs. Results are cached in `ImportedProfile`; use `--force` only for a manual refresh.

Fixture mode uses local HTML and generated JPEG fixtures and never contacts TSU:

```bash
PROFILE_IMPORT_SOURCE=fixtures npm run import:profiles -- data/profiles.txt
```

External mode permits HTTPS requests only to the exact configured hosts. Every redirect is revalidated, responses are size-limited and timed out, and 403/429/CAPTCHA/authentication responses stop processing without bypass attempts:

```bash
PROFILE_IMPORT_SOURCE=external npm run import:profiles -- data/profiles.txt
npm run import:profiles -- data/profiles.json --force
```

In development, authenticated users can also use `/admin/import`. This route returns 404 outside development.

## Storage

`StorageProvider` exposes `put`, `read`, and `delete`. `LocalStorageProvider` writes random keys below `LOCAL_STORAGE_PATH`; user filenames and paths are never used. Uploads are signature-checked, decoded, bounded by size/dimensions, rotated, stripped of metadata, and re-encoded to WebP with a thumbnail. An S3, MinIO, or R2 provider can implement the same interface.

## Security Notes

- Passwords use Argon2id and are never selected into public DTOs.
- Auth.js sessions stay in HttpOnly, SameSite=Lax cookies; production cookies are Secure.
- Mutating application endpoints validate same-origin requests and use Zod explicit mappings.
- Profile/photo authorization derives identity from the server session; photo deletion checks ownership.
- Voting validates participants, blocks self/duplicate votes, rate-limits calls and relies on both a unique constraint and serializable transaction.
- Import URLs and image URLs use exact HTTPS hostname allow-lists, bounded manual redirects, timeouts and byte limits.
- Local storage keys are generated and path traversal is rejected.
- User content is rendered as React text; the project does not use `dangerouslySetInnerHTML`.
- Structured logs redact passwords, cookies, tokens and authorization headers.

The in-memory rate limiter is suitable for one local process. Replace the `RateLimiter` implementation with Redis before horizontally scaling.
