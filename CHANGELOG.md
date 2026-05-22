# Changelog

All notable changes to this project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- **Gestion des Dépôts-vente physiques** : Création du script de peuplement `src/scripts/seed-depots.ts` et enregistrement de la commande NPM `npm run seed:depots` pour peupler les emplacements de stock physique (`Miellerie Principale`, `Dépôt-vente Clamart`, `Dépôt-vente Paris`) dans l'inventaire MedusaJS v2.
- Intégration du module officiel de paiement `@medusajs/payment-stripe` et enregistrement du provider `pp_stripe_stripe` sous le module `@medusajs/payment` dans `medusa-config.ts` (actuellement masqué sur le tunnel frontend pour privilégier le paiement physique local).
- Script de peuplement automatisé pour les profils et options de livraison (`src/scripts/seed-shipping.ts`), indispensable au checkout Medusa v2.
- Utilitaires de débogage et de tests programmatiques de requêtes (`src/scripts/list-providers.ts`, `src/scripts/test-query.ts`) facilitant le développement et l'administration locale.

### Fixed
- Extension de la configuration CORS (`STORE_CORS` et `AUTH_CORS` dans `.env`) pour autoriser le port de développement alternatif `4322` du frontend Astro, résolvant l'anomalie d'ajout au panier.
- PostgreSQL port collision on local Windows hosts by mapping internal container port 5432 to host port `5435` in `docker-compose.yml` and updating `DATABASE_URL`.
- Medusa admin dashboard route conflict by changing the default dashboard prefix path from `/admin` to `/app` in `medusa-config.ts`.
- Seeding script strict TypeScript type compilation errors (unknown catch variables casting & CreateProductOptionDTO option values requirements).

