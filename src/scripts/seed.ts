import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { createProductsWorkflow } from '@medusajs/medusa/core-flows';

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModule = container.resolve(Modules.PRODUCT);
  const regionModule = container.resolve(Modules.REGION);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

  logger.info('Début du seeding de la boutique de miel...');

  // 1. Créer une région par défaut (Europe / France)
  logger.info('Création de la région Europe...');
  let region;
  try {
    const existingRegions = await regionModule.listRegions({ name: 'Europe' });
    if (existingRegions.length > 0) {
      region = existingRegions[0];
    } else {
      region = await regionModule.createRegions({
        name: 'Europe',
        currency_code: 'eur',
        countries: ['fr', 'be', 'ch', 'lu'],
      });
    }
  } catch (error: any) {
    logger.error('Erreur lors de la création de la région : ' + error.message);
  }

  // 2. Créer un canal de vente par défaut
  logger.info('Création du canal de vente...');
  let salesChannel: any;
  try {
    const existingChannels = await salesChannelModule.listSalesChannels({ name: 'Boutique Miel' });
    if (existingChannels.length > 0) {
      salesChannel = existingChannels[0];
    } else {
      salesChannel = await salesChannelModule.createSalesChannels({
        name: 'Boutique Miel',
        description: 'Canal de vente principal pour le miel artisanal',
      });
    }
  } catch (error: any) {
    logger.error('Erreur lors de la création du canal de vente : ' + error.message);
  }

  // 2.5. Créer et associer une clé API publishable
  logger.info('Création de la clé API publishable...');
  let publishableKey: any;
  try {
    const apiKeyModule = container.resolve('api_key');
    const remoteLink = container.resolve('link');
    
    const existingKeys = await apiKeyModule.listApiKeys({ title: 'Local Dev' });
    if (existingKeys.length > 0) {
      publishableKey = existingKeys[0];
      logger.info(`Clé API existante trouvée : ${publishableKey.token}`);
    } else {
      publishableKey = await apiKeyModule.createApiKeys({
        title: 'Local Dev',
        type: 'publishable',
        created_by: 'seed',
      });
      logger.info(`Nouvelle clé API créée : ${publishableKey.token}`);
    }

    // Associer la clé API au canal de vente
    logger.info('Association de la clé API au canal de vente...');
    await remoteLink.create({
      api_key: {
        publishable_key_id: publishableKey.id,
      },
      sales_channel: {
        sales_channel_id: salesChannel.id,
      },
    });
    logger.info('Association de la clé API réussie !');
  } catch (error: any) {
    logger.error('Erreur lors de la création/association de la clé API : ' + error.message);
  }

  // 3. Créer un emplacement de stock
  logger.info('Création de l\'emplacement de stock...');
  let stockLocation;
  try {
    const existingLocations = await stockLocationModule.listStockLocations({ name: 'Miellerie Principale' });
    if (existingLocations.length > 0) {
      stockLocation = existingLocations[0];
    } else {
      stockLocation = await stockLocationModule.createStockLocations({
        name: 'Miellerie Principale',
      });
    }
  } catch (error: any) {
    logger.error('Erreur lors de la création de l\'emplacement de stock : ' + error.message);
  }

  // 3.5. Obtenir l'ID du profil de livraison par défaut
  logger.info('Récupération du profil de livraison par défaut...');
  let shippingProfileId: string | undefined;
  try {
    const shippingProfiles = await fulfillmentModule.listShippingProfiles();
    shippingProfileId = shippingProfiles[0]?.id;
    logger.info(`Profil de livraison trouvé : ${shippingProfileId}`);
  } catch (error: any) {
    logger.error('Erreur lors de la récupération du profil de livraison : ' + error.message);
  }

  // 4. Créer les miels de démonstration
  logger.info('Création des miels artisanaux...');

  const honeys = [
    {
      title: 'Miel de Lavande de Provence',
      handle: 'miel-de-lavande',
      description: 'Un miel crémeux d\'une grande finesse, très aromatique et légèrement fruité. Récolté au cœur des plateaux de lavande en Provence.',
      subtitle: 'Doux, fleuri, notes de vanille',
      variants: [
        { title: 'Pot de 250g', sku: 'MIEL-LAV-250', weight: 250, price: 7.90 },
        { title: 'Pot de 500g', sku: 'MIEL-LAV-500', weight: 500, price: 13.50 }
      ]
    },
    {
      title: 'Miel de Châtaignier d\'Ardèche',
      handle: 'miel-de-chataignier',
      description: 'Miel corsé et boisé, avec une amertume caractéristique et une belle robe ambrée foncée. Idéal pour les amateurs de sensations fortes.',
      subtitle: 'Robuste, boisé, amertume subtile',
      variants: [
        { title: 'Pot de 250g', sku: 'MIEL-CHA-250', weight: 250, price: 8.20 },
        { title: 'Pot de 500g', sku: 'MIEL-CHA-500', weight: 500, price: 14.50 }
      ]
    },
    {
      title: 'Miel d\'Acacia du Jura',
      handle: 'miel-d-acacia',
      description: 'Un miel très clair, liquide et particulièrement doux en bouche. Sa douceur convient à toute la famille et est parfaite pour sucrer sans dénaturer.',
      subtitle: 'Liquide, très doux, délicat',
      variants: [
        { title: 'Pot de 250g', sku: 'MIEL-ACA-250', weight: 250, price: 6.90 },
        { title: 'Pot de 500g', sku: 'MIEL-ACA-500', weight: 500, price: 12.00 }
      ]
    },
    {
      title: 'Miel de Sapin des Vosges',
      handle: 'miel-de-sapin',
      description: 'Miel de miellat rare et prestigieux. Sa robe est très sombre, et ses arômes résineux et maltés sont d\'une complexité unique.',
      subtitle: 'Malté, résineux, arômes des bois',
      variants: [
        { title: 'Pot de 250g', sku: 'MIEL-SAP-250', weight: 250, price: 9.80 },
        { title: 'Pot de 500g', sku: 'MIEL-SAP-500', weight: 500, price: 17.50 }
      ]
    }
  ];

  // Supprimer les produits existants s'ils existent déjà
  for (const honey of honeys) {
    try {
      const existing = await productModule.listProducts({ handle: honey.handle });
      if (existing.length > 0) {
        logger.info(`Le produit ${honey.title} existe déjà. Suppression...`);
        await productModule.deleteProducts(existing.map((p) => p.id));
      }
    } catch (error: any) {
      logger.error(`Erreur lors de la suppression de ${honey.title} : ${error.message}`);
    }
  }

  // Préparer les entrées pour createProductsWorkflow
  const productsToCreate = honeys.map((honey) => ({
    title: honey.title,
    handle: honey.handle,
    subtitle: honey.subtitle,
    description: honey.description,
    is_giftcard: false,
    status: 'published' as any,
    options: [{ title: 'Format', values: honey.variants.map((v) => v.title.replace('Pot de ', '')) }],
    variants: honey.variants.map((v) => ({
      title: v.title,
      sku: v.sku,
      manage_inventory: false,
      options: { Format: v.title.replace('Pot de ', '') },
      prices: [
        {
          currency_code: 'eur',
          amount: v.price, // Medusa v2 utilise l'unité principale (major unit)
        }
      ]
    })),
    shipping_profile_id: shippingProfileId,
  }));

  // Lancer le workflow de création de produits avec prix associés
  try {
    logger.info('Lancement de createProductsWorkflow...');
    const { result: createdProducts } = await createProductsWorkflow(container).run({
      input: {
        products: productsToCreate,
      },
    });

    logger.info(`${createdProducts.length} produits créés avec succès.`);

    // Associer les produits au canal de vente
    const remoteLink = container.resolve('link');
    for (const product of createdProducts) {
      await remoteLink.create({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [Modules.SALES_CHANNEL]: {
          sales_channel_id: salesChannel.id,
        },
      });
      logger.info(`Produit ${product.title} lié au canal de vente Boutique Miel.`);
    }

  } catch (error: any) {
    logger.error('Erreur lors de l\'exécution de createProductsWorkflow : ' + error.message);
  }

  logger.info('Seeding de MedusaJS terminé avec succès !');
}
