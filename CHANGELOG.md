# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Initial Medusa v2 scaffold (`medusa-config.ts`).
- `src/subscribers/trigger-build.ts` — HMAC-signed webhook to Astro rebuild on product / variant / price / inventory events.
- `Dockerfile` (multi-stage) + `docker-compose.yml` (Postgres 16 + Redis 7 + Medusa).
- Custom seed script `src/scripts/seed.ts` creating 4 organic premium honey products (Acacia, Lavande, Châtaignier, Sapin) with weighted formats (250g, 500g), prices, and stock inventory.
- `O2SWITCH_DEPLOYMENT.md` — shared hosting guide (cPanel Node.js App + Redis 7 on port 6381 + cPanel Postgres) with VPS as alternative section.

### Fixed
- PostgreSQL port collision on local Windows hosts by mapping internal container port 5432 to host port `5435` in `docker-compose.yml` and updating `DATABASE_URL`.
- Medusa admin dashboard route conflict by changing the default dashboard prefix path from `/admin` to `/app` in `medusa-config.ts`.
- Seeding script strict TypeScript type compilation errors (unknown catch variables casting & CreateProductOptionDTO option values requirements).

