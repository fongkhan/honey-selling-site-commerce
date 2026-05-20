import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

export default async function testQuery({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY);

  logger.info('--- TESTING REMOTE QUERY ON STOCK LOCATIONS ---');
  
  try {
    const locations = await remoteQuery({
      entryPoint: 'stock_location',
      fields: ['id', 'name', 'fulfillment_sets.id', 'fulfillment_sets.name', 'fulfillment_providers.id'],
    });
    logger.info(`Stock locations structure: ${JSON.stringify(locations, null, 2)}`);
  } catch (err: any) {
    logger.error(`Error querying stock locations: ${err.message}`);
  }
}
