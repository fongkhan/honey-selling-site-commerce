import { createHmac } from 'node:crypto';
import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';

/**
 * Fires the Astro rebuild webhook whenever store-visible state changes
 * (product/variant/price/inventory). Cart/order events do NOT trigger a
 * rebuild — they don't affect what visitors see on the SSG pages.
 */
export default async function rebuildSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve('logger');
  const url = process.env.BUILD_WEBHOOK_URL;
  const secret = process.env.BUILD_WEBHOOK_SECRET;
  if (!url || !secret) {
    logger.warn('[trigger-build] BUILD_WEBHOOK_URL / SECRET missing — skipped');
    return;
  }

  const body = JSON.stringify({
    source: 'medusa',
    event: event.name,
    id: event.data?.id,
    at: new Date().toISOString(),
  });
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-medusa-signature': `sha256=${signature}`,
      },
      body,
    });
  } catch (err) {
    logger.error(`[trigger-build] webhook POST failed: ${(err as Error).message}`);
  }
}

export const config: SubscriberConfig = {
  event: [
    'product.created',
    'product.updated',
    'product.deleted',
    'product-variant.created',
    'product-variant.updated',
    'product-variant.deleted',
    'price.created',
    'price.updated',
    'price.deleted',
    'inventory-item.updated',
  ],
};
