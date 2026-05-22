import { ExecArgs } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';

export default async function seedDepots({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);

  logger.info('Début de la création des emplacements de stock pour les dépôts-vente...');

  const locationsToCreate = [
    { name: 'Miellerie Principale' },
    { name: 'Dépôt-vente Clamart' },
    { name: 'Dépôt-vente Paris' }
  ];

  for (const loc of locationsToCreate) {
    try {
      const existing = await stockLocationModule.listStockLocations({ name: loc.name });
      if (existing.length > 0) {
        logger.info(`L'emplacement de stock "${loc.name}" existe déjà.`);
      } else {
        const created = await stockLocationModule.createStockLocations(loc);
        logger.info(`Nouvel emplacement de stock créé avec succès : "${created.name}" (ID: ${created.id})`);
      }
    } catch (error: any) {
      logger.error(`Erreur lors de la création de l'emplacement "${loc.name}" : ${error.message}`);
    }
  }

  logger.info('Création des dépôts-vente terminée !');
}
