# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Initial Medusa v2 scaffold (`medusa-config.ts`).
- `src/subscribers/trigger-build.ts` — HMAC-signed webhook to Astro rebuild on product / variant / price / inventory events.
- `Dockerfile` (multi-stage, Node 24) + `docker-compose.yml` (Postgres 16 + Redis 7 + Medusa).
- `O2SWITCH_DEPLOYMENT.md` — shared hosting guide (cPanel Node.js App + Redis 7 on port 6381 + cPanel Postgres) with VPS as alternative section.
