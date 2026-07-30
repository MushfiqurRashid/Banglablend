import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils";
import {
  createCollectionsWorkflow,
  createCustomersWorkflow,
  createProductVariantsWorkflow,
  deleteProductsWorkflow,
  deleteProductVariantsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  setProductProductOptionsWorkflow,
  updateProductsWorkflow
} from "@medusajs/medusa/core-flows";
import {
  activeCatalogRevision,
  retiredSampleProductHandles,
  sampleCatalog,
  sampleCollections
} from "../seeds/catalog";
import { sampleRegions, sampleShippingOptions } from "../seeds/markets";
import { sampleCategories, sampleCustomers, sampleInventoryBySku, samplePromotions } from "../seeds/operations";
import { defaultAdminSettings } from "../seeds/admin-settings";
import { ADMIN_CONTROL_MODULE } from "../modules/admin-control";
import type AdminControlModuleService from "../modules/admin-control/service";
import { wrapSettingValue } from "../modules/admin-control/value";

export default async function seedBanglaBlend({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const adminControlService = container.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  logger.info("Seeding clearly marked Bangla Blend sample commerce data.");
  const existingSettings = await adminControlService.listAppSettings({}, { take: 500 });
  const existingSettingKeys = new Set(existingSettings.map((setting) => setting.key));
  const settingsToCreate = defaultAdminSettings.filter((setting) => !existingSettingKeys.has(setting.key));
  if (settingsToCreate.length) {
    await adminControlService.createAppSettings(
      settingsToCreate.map((setting) => ({
        ...setting,
        value: wrapSettingValue(setting.value),
        updated_by: "system:seed",
        metadata: { seeded: true }
      }))
    );
  }
  const { data: existingRegions } = await query.graph({ entity: "region", fields: ["id", "name", "metadata"] });
  const existingRegionCodes = new Set(
    existingRegions.flatMap((region) => {
      const marketCode = region.metadata?.market_code;
      return typeof marketCode === "string" ? [marketCode] : [];
    })
  );
  const regionsToCreate = sampleRegions
    .filter((region) => !existingRegionCodes.has(region.metadata.market_code))
    .map((region) =>
      region.metadata.market_code === "bd" && process.env.SSLCOMMERZ_ENABLED === "true"
        ? { ...region, payment_providers: [...region.payment_providers, "pp_sslcommerz_sslcommerz"] }
        : region
    );
  if (regionsToCreate.length) await createRegionsWorkflow(container).run({ input: { regions: regionsToCreate } });
  const { data: collections } = await query.graph({ entity: "product_collection", fields: ["id", "handle"] });
  const existingCollectionHandles = new Set(collections.map((collection) => collection.handle));
  const collectionsToCreate = sampleCollections.filter((collection) => !existingCollectionHandles.has(collection.handle));
  if (collectionsToCreate.length) await createCollectionsWorkflow(container).run({ input: { collections: collectionsToCreate } });
  const { data: categories } = await query.graph({ entity: "product_category", fields: ["id", "handle"] });
  const existingCategoryHandles = new Set(categories.map((category) => category.handle));
  const categoriesToCreate = sampleCategories.filter((category) => !existingCategoryHandles.has(category.handle));
  if (categoriesToCreate.length) await createProductCategoriesWorkflow(container).run({ input: { product_categories: categoriesToCreate } });
  const { data: currentCollections } = await query.graph({ entity: "product_collection", fields: ["id", "handle"] });
  const { data: stores } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] });
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id", "type"] });
  if (!stores[0]?.default_sales_channel_id || !profiles[0]?.id) throw new Error("Run the Medusa initial store setup so a sales channel and shipping profile exist before seeding products.");
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "metadata",
      "options.id",
      "options.title",
      "options.values.value",
      "variants.id",
      "variants.sku"
    ]
  });
  const existingProductsByHandle = new Map(
    existingProducts.map((product) => [product.handle, product])
  );
  const activeHandles = new Set(sampleCatalog.map((product) => product.handle));
  const retiredHandles = new Set<string>(retiredSampleProductHandles);
  const retiredProducts = existingProducts.filter((product) => {
    if (activeHandles.has(product.handle)) return false;
    const hasSeededSku = (product.variants ?? []).some(
      (variant: { sku?: string | null }) =>
        typeof variant.sku === "string" && variant.sku.startsWith("SAMPLE-")
    );
    return (
      retiredHandles.has(product.handle) ||
      hasSeededSku ||
      typeof product.metadata?.catalog_revision === "string"
    );
  });

  if (retiredProducts.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: retiredProducts.map((product) => product.id) }
    });
  }

  for (const product of sampleCatalog) {
    const existingProduct = existingProductsByHandle.get(product.handle);
    if (!existingProduct) continue;

    const existingVariants = (existingProduct.variants ?? []) as {
      id: string;
      sku: string | null;
    }[];
    const existingSkus = existingVariants
      .map((variant) => variant.sku)
      .filter((sku): sku is string => Boolean(sku))
      .sort();
    const desiredSkus = product.variants.map((variant) => variant.sku).sort();
    const variantsMatch =
      existingSkus.length === desiredSkus.length &&
      existingSkus.every((sku, index) => sku === desiredSkus[index]);
    const needsVariantSync =
      existingProduct.metadata?.catalog_revision !== activeCatalogRevision ||
      !variantsMatch;

    if (needsVariantSync) {
      const variantIds = existingVariants.map((variant) => variant.id);
      if (variantIds.length) {
        await deleteProductVariantsWorkflow(container).run({
          input: { ids: variantIds }
        });
      }
      const sizeOption = (
        (existingProduct.options ?? []) as {
          id: string;
          title: string;
          values?: { value: string }[];
        }[]
      ).find((option) => option.title === "Size");
      if (!sizeOption) {
        throw new Error(`Product ${product.handle} is missing its Size option.`);
      }
      const existingOptionValues = new Set(
        (sizeOption.values ?? []).map((optionValue) => optionValue.value)
      );
      const optionValuesToAdd = product.variants
        .map((variant) => variant.title)
        .filter((value) => !existingOptionValues.has(value));
      if (optionValuesToAdd.length) {
        await setProductProductOptionsWorkflow(container).run({
          input: {
            product_id: existingProduct.id,
            update: [{
              product_option_id: sizeOption.id,
              add: optionValuesToAdd.map((value) => ({ value }))
            }]
          }
        });
      }
      await createProductVariantsWorkflow(container).run({
        input: {
          product_variants: product.variants.map((variant) => ({
            product_id: existingProduct.id,
            title: variant.title,
            sku: variant.sku,
            manage_inventory: true,
            options: { Size: variant.title },
            prices: Object.entries(variant.prices).map(([currency_code, amount]) => ({
              currency_code,
              amount
            }))
          }))
        }
      });
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: existingProduct.id },
        update: {
          title: product.title,
          subtitle: product.subtitle,
          description: product.description,
          thumbnail: product.thumbnail,
          status: ProductStatus.PUBLISHED,
          collection_id: currentCollections.find(
            (collection) => collection.handle === product.collection
          )?.id,
          metadata: {
            region: product.region,
            eligible_markets: product.markets,
            product_badges: product.badges,
            best_seller: product.bestSeller === true,
            catalog_revision: activeCatalogRevision,
            is_placeholder: false,
            verified: true
          }
        }
      }
    });
  }

  const existingHandles = new Set(existingProducts.map((product) => product.handle));
  const products = sampleCatalog.filter((product) => !existingHandles.has(product.handle)).map((product) => ({
    title: product.title,
    handle: product.handle,
    subtitle: product.subtitle,
    description: product.description,
    thumbnail: product.thumbnail,
    status: ProductStatus.PUBLISHED,
    collection_id: currentCollections.find((collection) => collection.handle === product.collection)?.id,
    shipping_profile_id: profiles[0]!.id,
    sales_channels: [{ id: stores[0]!.default_sales_channel_id }],
    metadata: {
      region: product.region,
      eligible_markets: product.markets,
      product_badges: product.badges,
      best_seller: product.bestSeller === true,
      catalog_revision: activeCatalogRevision,
      is_placeholder: false,
      verified: true
    },
    options: [{
      title: "Size",
      values: product.variants.map((variant) => variant.title)
    }],
    variants: product.variants.map((variant) => ({
      title: variant.title,
      sku: variant.sku,
      manage_inventory: true,
      options: { Size: variant.title },
      prices: Object.entries(variant.prices).map(([currency_code, amount]) => ({
        currency_code,
        amount
      }))
    }))
  }));
  if (products.length) await createProductsWorkflow(container).run({ input: { products } });

  const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id", "name"] });
  let location = locations.find((entry) => entry.name === "Sample Bangladesh warehouse");
  if (!location) {
    const created = await createStockLocationsWorkflow(container).run({ input: { locations: [{ name: "Sample Bangladesh warehouse", metadata: { isPlaceholder: true, verified: false } }] } });
    location = created.result[0];
    if (location && stores[0]?.default_sales_channel_id) await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [stores[0].default_sales_channel_id] } });
  }
  const { data: seededProducts } = await query.graph({ entity: "product", fields: ["handle", "variants.sku", "variants.inventory_items.inventory_item_id"], filters: { handle: sampleCatalog.map((product) => product.handle) } });
  const { data: inventoryLevels } = await query.graph({ entity: "inventory_level", fields: ["inventory_item_id", "location_id"], filters: { location_id: location?.id } });
  const existingInventoryIds = new Set(inventoryLevels.map((level) => level.inventory_item_id));
  const newLevels = seededProducts.flatMap((product) => product.variants ?? []).flatMap((variant) => (variant.inventory_items ?? []).map((link: { inventory_item_id: string }) => ({ inventory_item_id: link.inventory_item_id, location_id: location!.id, stocked_quantity: sampleInventoryBySku[variant.sku ?? ""] ?? 0 }))).filter((level) => !existingInventoryIds.has(level.inventory_item_id));
  if (newLevels.length) await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: newLevels } });

  const { data: customers } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { email: sampleCustomers[0]!.email } });
  if (!customers.length) await createCustomersWorkflow(container).run({ input: { customersData: sampleCustomers } });
  const { data: promotions } = await query.graph({ entity: "promotion", fields: ["id", "code"], filters: { code: samplePromotions[0]!.code } });
  if (!promotions.length) await createPromotionsWorkflow(container).run({ input: { promotionsData: [...samplePromotions] } });
  const { data: shippingOptions } = await query.graph({ entity: "shipping_option", fields: ["id", "name"] });
  const { data: serviceZones } = await query.graph({ entity: "service_zone", fields: ["id", "name"] });
  const domesticZone = serviceZones.find((zone) => /bangladesh/i.test(zone.name ?? "")) ?? serviceZones[0];
  const existingShippingOptionNames = new Set(shippingOptions.map((option) => option.name));
  const shippingOptionsToCreate = sampleShippingOptions
    .filter((option) => option.market === "bd")
    .filter((option) => !existingShippingOptionNames.has(option.name));
  if (shippingOptionsToCreate.length && domesticZone) {
    await createShippingOptionsWorkflow(container).run({ input: shippingOptionsToCreate.map((option) => ({ name: option.name, service_zone_id: domesticZone.id, shipping_profile_id: profiles[0]!.id, provider_id: "manual_manual", price_type: "flat" as const, type: { label: option.name, description: "Clearly marked sample delivery option; replace with approved carrier terms.", code: option.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-") }, prices: [{ amount: option.price, currency_code: option.currency_code }], data: { isPlaceholder: true, verified: false } })) });
  } else if (shippingOptionsToCreate.length) {
    logger.warn("Sample shipping options were not created because no service zone exists. Create an approved Bangladesh fulfillment set/service zone in Admin, then rerun the seed.");
  }
  logger.info(`Seed complete. ${retiredProducts.length} retired sample products removed, ${products.length} sample products and ${newLevels.length} sample inventory levels created. Configure real shipping options against approved service zones before checkout testing; international regions remain disabled operationally.`);
}
