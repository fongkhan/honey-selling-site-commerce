import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

export default async function testSCQuery({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve('query');

  logger.info('--- TESTING SALES CHANNEL & STOCK LOCATIONS QUERY ---');

  try {
    const { data: channels } = await query.graph({
      entity: 'sales_channels',
      filters: { id: 'sc_01KS186G3VVRSQRC50B0FET330' },
      fields: [
        'id',
        'name',
        'stock_locations.id',
        'stock_locations.name',
        'stock_locations.fulfillment_sets.id',
        'stock_locations.fulfillment_sets.name'
      ]
    });
    logger.info('Sales Channel Query Result:');
    logger.info(JSON.stringify(channels, null, 2));
  } catch (err: any) {
    logger.error(`Error querying sales channels: ${err.message}`);
    logger.error(err.stack);
  }
}
