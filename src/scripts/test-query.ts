import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

export default async function testQuery({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve('query');

  logger.info('--- TESTING SHIPPING OPTIONS WITH THE QUERY SERVICE ---');

  try {
    const { data: options } = await query.graph({
      entity: 'shipping_option',
      fields: [
        'id',
        'name',
        'price_type',
        'service_zone_id',
        'service_zone.id',
        'service_zone.name',
        'service_zone.fulfillment_set.id',
        'service_zone.fulfillment_set.name',
        'service_zone.fulfillment_set.location.id',
        'service_zone.fulfillment_set.location.name'
      ]
    });
    logger.info('Query Result:');
    logger.info(JSON.stringify(options, null, 2));
  } catch (err: any) {
    logger.error(`Error querying: ${err.message}`);
    logger.error(err.stack);
  }
}
