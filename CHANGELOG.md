# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Script de peuplement automatisé pour les profils et options de livraison (`src/scripts/seed-shipping.ts`), indispensable au checkout Medusa v2.
- Utilitaires de débogage et de tests programmatiques de requêtes (`src/scripts/list-providers.ts`, `src/scripts/test-query.ts`) facilitant le développement et l'administration locale.

### Fixed
- PostgreSQL port collision on local Windows hosts by mapping internal container port 5432 to host port `5435` in `docker-compose.yml` and updating `DATABASE_URL`.
- Medusa admin dashboard route conflict by changing the default dashboard prefix path from `/admin` to `/app` in `medusa-config.ts`.
- Seeding script strict TypeScript type compilation errors (unknown catch variables casting & CreateProductOptionDTO option values requirements).

