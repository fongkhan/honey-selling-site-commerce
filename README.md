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
# 1. Copier et configurer le fichier d'environnement
cp .env.example .env

# 2. Démarrer les bases de données Postgres + Redis locales
# Note: Pour éviter les conflits de ports sous Windows, Postgres écoute localement sur le port 5435
docker compose up -d postgres redis

# 3. Installer les dépendances localement
npm install

# 4. Appliquer les migrations de base de données
npm run db:migrate

# 5. Lancer le script de seeding (Miels Premium)
# Remplit le catalogue avec 4 miels bio premium (formats 250g et 500g, stocks et prix configurés)
npm run seed

# 6. Créer le compte administrateur pour le tableau de bord
npx medusa user -e admin@miel.fr -p adminpassword

# 7. Démarrer le serveur de développement Medusa v2
npm run dev
```

*   **Admin Dashboard** : <http://localhost:9000/app> (identifiants: `admin@miel.fr` / `adminpassword`)
*   **Store API** : <http://localhost:9000/store/products>

## Démarrage local sans Docker

```bash
# S'assurer qu'une base Postgres (port 5435) et Redis tournent sur la machine
cp .env.example .env
npm install
npm run db:migrate
npm run seed
npx medusa user -e admin@miel.fr -p adminpassword
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
    ├── scripts/
    │   ├── seed.ts              # Seeding du catalogue (Acacia, Lavande, etc.)
    │   ├── seed-shipping.ts     # Seeding des tarifs et modes de livraison
    │   └── test-query.ts        # Script utilitaire de tests de requêtes
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
- `STRIPE_API_KEY` — Clé Stripe secrète (ex: `sk_test_...`) pour l'autorisation des paiements Stripe.

## Voir aussi

- [O2SWITCH_DEPLOYMENT.md](./O2SWITCH_DEPLOYMENT.md) — déploiement VPS o2switch (systemd, nginx, certbot).
