import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';

export default async function listProviders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const regionModule = container.resolve(Modules.REGION);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

  logger.info('--- LISTING PROVIDERS AND REGIONS ---');
  
  try {
    const providers = await fulfillmentModule.listFulfillmentProviders({}, {});
    logger.info(`Providers found: ${JSON.stringify(providers, null, 2)}`);
  } catch (err: any) {
    logger.error(`Error listing providers: ${err.message}`);
  }

  try {
    const regions = await regionModule.listRegions({}, {});
    logger.info(`Regions found: ${JSON.stringify(regions, null, 2)}`);
  } catch (err: any) {
    logger.error(`Error listing regions: ${err.message}`);
  }

  try {
    const locations = await stockLocationModule.listStockLocations({}, {});
    logger.info(`Stock locations found: ${JSON.stringify(locations, null, 2)}`);
  } catch (err: any) {
    logger.error(`Error listing stock locations: ${err.message}`);
  }
}
