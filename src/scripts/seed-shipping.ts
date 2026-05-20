import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { createLocationFulfillmentSetWorkflow, createShippingOptionsWorkflow, linkSalesChannelsToStockLocationWorkflow } from '@medusajs/medusa/core-flows';

export default async function seedShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const regionModule = container.resolve(Modules.REGION);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const remoteLink = container.resolve('link');

  logger.info('--- RESET & SEEDING DE L\'INFRASTRUCTURE DE LIVRAISON ---');

  // 1. Récupérer la région Europe
  const regions = await regionModule.listRegions({ name: 'Europe' }, {});
  if (regions.length === 0) {
    throw new Error('Région Europe introuvable. Veuillez exécuter le seed initial d\'abord.');
  }
  const region = regions[0];
  logger.info(`Région trouvée : ${region.name} (${region.id})`);

  // 2. Récupérer le stock location principal
  const locations = await stockLocationModule.listStockLocations({ name: 'Miellerie Principale' }, {});
  if (locations.length === 0) {
    throw new Error('Stock location "Miellerie Principale" introuvable.');
  }
  const stockLocation = locations[0];
  logger.info(`Stock location trouvé : ${stockLocation.name} (${stockLocation.id})`);

  // 3. Récupérer le profil de livraison par défaut
  const shippingProfiles = await fulfillmentModule.listShippingProfiles({}, {});
  if (shippingProfiles.length === 0) {
    throw new Error('Aucun profil de livraison trouvé.');
  }
  const shippingProfile = shippingProfiles[0];
  logger.info(`Profil de livraison trouvé : ${shippingProfile.name} (${shippingProfile.id})`);

  // 3.8. Récupérer et lier le canal de vente "Boutique Miel" au Stock Location
  const salesChannels = await salesChannelModule.listSalesChannels({ name: 'Boutique Miel' }, {});
  if (salesChannels.length > 0) {
    const salesChannel = salesChannels[0];
    logger.info(`Liaison du canal de vente "${salesChannel.name}" (${salesChannel.id}) au stock location...`);
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [salesChannel.id],
      },
    });
    logger.info('Liaison canal de vente <-> stock location réussie !');
  } else {
    logger.warn('Canal de vente "Boutique Miel" introuvable.');
  }

  // 4. Nettoyage des anciennes données pour éviter les conflits et assurer l'idempotence
  logger.info('Nettoyage des anciennes options de livraison...');
  try {
    const existingOptions = await fulfillmentModule.listShippingOptions({ name: 'Livraison Standard à Domicile' }, {});
    if (existingOptions.length > 0) {
      logger.info(`Suppression de ${existingOptions.length} ancienne(s) option(s) de livraison...`);
      await fulfillmentModule.deleteShippingOptions(existingOptions.map(o => o.id));
    }
  } catch (err: any) {
    logger.warn(`Erreur lors de la suppression des anciennes options : ${err.message}`);
  }

  try {
    const existingZones = await fulfillmentModule.listServiceZones({ name: 'Europe Zone' }, {});
    if (existingZones.length > 0) {
      logger.info(`Suppression de ${existingZones.length} ancienne(s) zone(s) de service...`);
      await fulfillmentModule.deleteServiceZones(existingZones.map(z => z.id));
    }
  } catch (err: any) {
    logger.warn(`Erreur lors de la suppression des anciennes zones : ${err.message}`);
  }

  try {
    const existingSets = await fulfillmentModule.listFulfillmentSets({ name: 'Standard Shipping Set' }, {});
    if (existingSets.length > 0) {
      logger.info(`Suppression de ${existingSets.length} ancien(s) Fulfillment Set(s)...`);
      await fulfillmentModule.deleteFulfillmentSets(existingSets.map(s => s.id));
    }
  } catch (err: any) {
    logger.warn(`Erreur lors de la suppression des anciens sets : ${err.message}`);
  }

  // 5. Associer le Stock Location au Fulfillment Provider manual_manual
  try {
    logger.info('Association du stock location au provider manual_manual...');
    await remoteLink.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: 'manual_manual',
      },
    });
    logger.info('Association réussie !');
  } catch (err: any) {
    logger.info(`Association déjà existante ou ignorée : ${err.message}`);
  }

  // 6. Créer le nouveau Fulfillment Set et le lier au Stock Location
  logger.info('Création du nouveau Fulfillment Set...');
  const workflowResult = await createLocationFulfillmentSetWorkflow(container).run({
    input: {
      location_id: stockLocation.id,
      fulfillment_set_data: {
        name: 'Standard Shipping Set',
        type: 'shipping',
      },
    },
  });
  
  // Si le workflow ne renvoie pas direct .result, on liste les sets pour choper le bon
  const sets = await fulfillmentModule.listFulfillmentSets({ name: 'Standard Shipping Set' }, {});
  if (sets.length === 0) {
    throw new Error('Le Fulfillment Set n\'a pas pu être créé ou trouvé.');
  }
  const fulfillmentSet = sets[0];
  logger.info(`Fulfillment Set validé : ${fulfillmentSet.name} (${fulfillmentSet.id})`);

  // 7. Créer la Service Zone
  logger.info('Création de la Service Zone Europe...');
  const serviceZones = await fulfillmentModule.createServiceZones([
    {
      name: 'Europe Zone',
      fulfillment_set_id: fulfillmentSet.id,
      geo_zones: [
        { country_code: 'fr', type: 'country' },
        { country_code: 'be', type: 'country' },
        { country_code: 'ch', type: 'country' },
        { country_code: 'lu', type: 'country' },
      ],
    },
  ]);
  const serviceZone = serviceZones[0];
  logger.info(`Service Zone créée : ${serviceZone.name} (${serviceZone.id})`);

  // 8. Créer l'option de livraison avec le workflow
  logger.info('Lancement de createShippingOptionsWorkflow...');
  const shippingOptionsResult = await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: 'Livraison Standard à Domicile',
        price_type: 'flat',
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        provider_id: 'manual_manual',
        type: {
          label: 'Standard',
          description: 'Livraison standard à domicile sous 3 à 5 jours ouvrés',
          code: 'standard',
        },
        prices: [
          {
            amount: 0, // Gratuit
            currency_code: 'eur',
          },
        ],
      },
    ],
  });

  const createdShippingOptions = (shippingOptionsResult as any).result;
  logger.info(`Shipping Option créée avec succès : ${createdShippingOptions[0].name} (${createdShippingOptions[0].id})`);
  logger.info('--- FIN RESET & SEEDING DE L\'INFRASTRUCTURE DE LIVRAISON AVEC SUCCÈS ---');
}
