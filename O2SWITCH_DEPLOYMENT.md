# Déploiement de Medusa sur o2switch

Deux scénarios :
1. **Mutualisé o2switch** (cPanel + alt-nodejs + Postgres + Redis 7 cPanel) — ce guide.
2. **VPS Cloud** ou autre — voir la section [VPS](#alternative-vps) en fin de page.

## 1. Mutualisé o2switch (cPanel)

### 1.1 Récupérer / créer les ressources dans cPanel

| Ressource | Où dans cPanel | Notes |
|---|---|---|
| Base PostgreSQL | **PostgreSQL Databases** | Préfixe automatique `fongkhan_`. Crée la base, un user, attache le user à la base avec ALL privileges. |
| Redis 7 | **Redis Database** | Note le port (typiquement `6381` sur o2switch, **pas** 6379) et le mot de passe. Vérifier l'accès : `/opt/redis-7/src/redis-cli -p 6381 -a <pwd> ping` doit répondre `PONG`. |
| Node.js App | **Setup Node.js App** | Version 24.x, mode Production. |
| Sous-domaine | **Subdomains** | `shop.miellerie.fr` pointant vers un dossier dédié (ex. `~/shop_app`). |

### 1.2 Cloner et configurer

```bash
ssh fongkhan@fongkhan.o2switch.net
mkdir -p ~/repositories ~/data/honey-commerce ~/logs
cd ~/repositories
git clone git@github.com:fongkhan/honey-selling-site-commerce.git
cd honey-selling-site-commerce
cp .env.example .env
```

Édite `~/repositories/honey-selling-site-commerce/.env` :

```env
DATABASE_URL=postgres://fongkhan_honey:<DB_PWD>@127.0.0.1:5432/fongkhan_honey_selling_site
REDIS_URL=redis://:<REDIS_PWD>@127.0.0.1:6381
JWT_SECRET=<32+ caractères aléatoires>
COOKIE_SECRET=<32+ caractères aléatoires>
STORE_CORS=https://www.miellerie.fr
ADMIN_CORS=https://shop.miellerie.fr,https://shop.miellerie.fr/app
AUTH_CORS=https://www.miellerie.fr,https://shop.miellerie.fr
BUILD_WEBHOOK_URL=https://www.miellerie.fr/__hooks/rebuild.php
BUILD_WEBHOOK_SECRET=<le même secret que frontend/ et cms/>
PORT=9000
NODE_ENV=production
```

```bash
chmod 600 .env
```

### 1.3 Installer dans le venv cPanel

cPanel → **Setup Node.js App** → Create Application :

| Champ                  | Valeur                                                     |
|------------------------|------------------------------------------------------------|
| Node.js version        | 24.x                                                       |
| Application mode       | Production                                                 |
| Application root       | `repositories/honey-selling-site-commerce`                 |
| Application URL        | `shop.miellerie.fr`                                        |
| Application startup file | (laisse vide pour l'instant — Medusa génère sa propre entrée) |
| Passenger log file     | `logs/honey-commerce.log`                                  |

Click **Run NPM Install**, puis dans un terminal :

```bash
source /home/fongkhan/nodevenv/repositories/honey-selling-site-commerce/24/bin/activate
cd ~/repositories/honey-selling-site-commerce
npm run build
npm run db:migrate
npm run user:create -- --email admin@miellerie.fr --password <choisi>
```

Quand `medusa build` a tourné, le startup file devient `./.medusa/server/index.js`. Re-renseigne-le dans cPanel.

### 1.4 Démarrer et vérifier

cPanel → **Start App**. Ouvre `https://shop.miellerie.fr/app` → admin Medusa.

Test du Store API :

```bash
curl https://shop.miellerie.fr/store/products
```

Test du flux webhook : crée un produit dans l'admin, et côté frontend :

```bash
tail -f ~/logs/honey-webhook.log
```

doit afficher `OK build queued by webhook` puis le log de `build_astro.sh`.

### 1.5 Backups

cPanel → **Cron jobs** (une fois par jour à 03:30) :

```bash
30 3 * * * PGPASSWORD='<DB_PWD>' /usr/bin/pg_dump -U fongkhan_honey -h 127.0.0.1 fongkhan_honey_selling_site | gzip > /home/fongkhan/backups/commerce-$(date +\%F).sql.gz
0 4 * * 0 find /home/fongkhan/backups -name 'commerce-*.sql.gz' -mtime +30 -delete
```

`mkdir -p ~/backups && chmod 700 ~/backups` au préalable.

### 1.6 Pièges sur le mutualisé

- **Redis ne répond pas** : vérifier le port (6381, pas 6379) et que l'auth est activée. La connexion test :
  ```bash
  /opt/redis-7/src/redis-cli -p 6381 -a '<pwd>' ping
  ```
- **`SequelizeConnectionError`** : préfixe `fongkhan_` oublié sur le user/db, ou mot de passe avec caractère spécial mal URL-encodé. Encode `@ : / ? # &` en `%40 %3A %2F ...` dans `DATABASE_URL`.
- **`medusa build` consomme trop de RAM** : sur le mutualisé la limite est ~512 Mo. Build en local et committe `.medusa/server/` (ou rsync vers le serveur) plutôt que rebuilder sur place. Adapter `.gitignore` en conséquence si tu choisis cette voie.
- **Worker mode** : si Passenger relance souvent l'app, mets `MEDUSA_WORKER_MODE=server` dans `.env` pour désactiver le worker interne (et lance le worker via un second app Node si nécessaire).

## Alternative VPS

Sur **VPS Cloud o2switch** ou autre Linux : installe Node 24, Postgres 16, Redis 7,
nginx + certbot. Le service systemd ressemble à :

```ini
# /etc/systemd/system/honey-commerce.service
[Unit]
Description=Honey Commerce (Medusa v2)
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=honey
WorkingDirectory=/home/honey/honey-selling-site-commerce
EnvironmentFile=/home/honey/honey-selling-site-commerce/.env
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/honey/commerce.log
StandardError=append:/var/log/honey/commerce.err.log

[Install]
WantedBy=multi-user.target
```

Reverse proxy nginx :

```nginx
server {
    listen 80;
    server_name shop.miellerie.fr;
    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo certbot --nginx -d shop.miellerie.fr
```

## Docker (dev local uniquement)

```bash
docker compose up -d --build
docker compose exec commerce npm run db:migrate
```

Ne **pas** utiliser le `docker-compose.yml` en production sur o2switch
mutualisé — il instancie Postgres et Redis localement, ce qui doublonne avec
les services cPanel.
