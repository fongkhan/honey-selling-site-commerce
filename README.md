# honey-selling-site-commerce

Backend e-commerce headless pour le site de vente de miel. Gère **produits,
variantes, prix, stock, paniers, commandes, paiements**. Le contenu
éditorial est dans [honey-selling-site-cms](../cms). Le site public statique
est [honey-selling-site-frontend](../frontend).

## Stack

- Medusa v2
- **PostgreSQL** (obligatoire) + **Redis 7** (obligatoire — event bus, cache, workflows)
- Node.js 24

> **Hébergement** : tourne sur **o2switch mutualisé** (Postgres + Redis 7 sur port `6381`
> disponibles via cPanel). Voir [O2SWITCH_DEPLOYMENT.md](./O2SWITCH_DEPLOYMENT.md).
> Alternative : VPS Cloud o2switch ou service managé (Railway / Render / Fly.io).

## Démarrage local avec Docker (le plus simple)

```bash
nvm use                              # 24.15.0
cp .env.example .env                 # éditer JWT_SECRET, COOKIE_SECRET, webhook
docker compose up -d --build         # postgres + redis + medusa
# Premier setup :
docker compose exec commerce npm run db:migrate
docker compose exec commerce npm run user:create -- --email admin@example.com --password change-me
```

Admin Medusa : <http://localhost:9000/app>
Store API : <http://localhost:9000/store/products>

## Démarrage local sans Docker

```bash
# Postgres + Redis doivent être installés et démarrés ailleurs.
nvm use
cp .env.example .env
npm install
npm run db:migrate
npm run dev                          # http://localhost:9000
```

## Webhook → rebuild Astro

`src/subscribers/trigger-build.ts` est abonné aux événements qui changent
ce que voit le visiteur :

- `product.{created,updated,deleted}`
- `product-variant.{created,updated,deleted}`
- `price.{created,updated,deleted}`
- `inventory-item.updated`

Les événements **panier / commande ne déclenchent pas** de rebuild (la
SSG ne contient pas ces données — elles sont dynamiques côté client).

Chaque déclenchement signe le payload en HMAC-SHA-256 avec
`BUILD_WEBHOOK_SECRET` (qui doit être identique dans les trois repos).

## Structure

```
commerce/
├── medusa-config.ts
├── Dockerfile
├── docker-compose.yml
├── O2SWITCH_DEPLOYMENT.md
└── src/
    └── subscribers/
        └── trigger-build.ts
```

## À compléter avant le premier `npm install`

Medusa v2 a une arborescence opinante (admin, api, modules, workflows).
Génère-la une fois :

```bash
npx create-medusa-app@latest honey-commerce-tmp --skip-db
# Récupère les fichiers générés sauf : medusa-config.ts, src/subscribers/
```

## Variables d'environnement

Voir `.env.example`. Variables critiques :

- `DATABASE_URL` — Postgres
- `REDIS_URL` — Redis
- `JWT_SECRET`, `COOKIE_SECRET` — 32+ caractères aléatoires
- `BUILD_WEBHOOK_URL`, `BUILD_WEBHOOK_SECRET` — flux rebuild

## Voir aussi

- [O2SWITCH_DEPLOYMENT.md](./O2SWITCH_DEPLOYMENT.md) — déploiement VPS o2switch (systemd, nginx, certbot).
