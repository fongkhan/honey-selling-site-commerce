import { loadEnv, defineConfig } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV ?? 'development', process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS ?? '',
      adminCors: process.env.ADMIN_CORS ?? '',
      authCors: process.env.AUTH_CORS ?? '',
      jwtSecret: process.env.JWT_SECRET ?? 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET ?? 'supersecret',
    },
  },
  admin: {
    disable: false,
    path: '/app',
  },
  modules: [
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
  ],
});
