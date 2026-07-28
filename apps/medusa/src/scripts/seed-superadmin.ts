import type { ExecArgs, QueryGraphFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, FeatureFlag, Modules } from "@medusajs/framework/utils";
import {
  batchLinksWorkflow,
  createLocationFulfillmentSetWorkflow,
  createRegionsWorkflow,
  createServiceZonesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ADMIN_CONTROL_MODULE } from "../modules/admin-control";
import type AdminControlModuleService from "../modules/admin-control/service";
import { wrapSettingValue } from "../modules/admin-control/value";
import { defaultAdminSettings } from "../seeds/admin-settings";

const EMAILPASS_PROVIDER = "emailpass";
const SUPERADMIN_ROLE_ID = "role_super_admin";
const PRIMARY_LOCATION_NAME = "Bangla Blend primary warehouse";
const PRIMARY_FULFILLMENT_SET_NAME = "Bangla Blend Bangladesh shipping";
const PRIMARY_SERVICE_ZONE_NAME = "Bangladesh";

interface BaselineRegion {
  id: string;
  name: string;
  currency_code: string;
  countries?: Array<{ iso_2?: string }>;
  metadata?: Record<string, unknown>;
}

interface BaselineServiceZone {
  id: string;
  name: string;
  geo_zones?: Array<{ type?: string; country_code?: string }>;
}

interface BaselineFulfillmentSet {
  id: string;
  name: string;
  type: string;
  service_zones?: BaselineServiceZone[];
}

interface BaselineLocation {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
  sales_channels?: Array<{ id: string }>;
  fulfillment_providers?: Array<{ id: string }>;
  fulfillment_sets?: BaselineFulfillmentSet[];
}

const DEVELOPMENT_DEFAULTS = {
  email: "superadmin@banglablend.local",
  password: "BanglaBlend-Local-Admin-2026!",
  firstName: "Bangla Blend",
  lastName: "Superadmin",
} as const;

function getRequiredProductionValue(name: string, developmentDefault: string) {
  const value = process.env[name]?.trim();

  if (process.env.NODE_ENV === "production" && (!value || value === developmentDefault)) {
    throw new Error(`${name} must be explicitly set to a non-development value in production.`);
  }

  return value || developmentDefault;
}

function getBootstrapCredentials() {
  const credentials = {
    email: getRequiredProductionValue("SUPERADMIN_EMAIL", DEVELOPMENT_DEFAULTS.email).toLowerCase(),
    password: getRequiredProductionValue("SUPERADMIN_PASSWORD", DEVELOPMENT_DEFAULTS.password),
    firstName: getRequiredProductionValue("SUPERADMIN_FIRST_NAME", DEVELOPMENT_DEFAULTS.firstName),
    lastName: getRequiredProductionValue("SUPERADMIN_LAST_NAME", DEVELOPMENT_DEFAULTS.lastName),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    throw new Error("SUPERADMIN_EMAIL must be a valid email address.");
  }

  if (credentials.password.length < 14) {
    throw new Error("SUPERADMIN_PASSWORD must contain at least 14 characters.");
  }

  return credentials;
}

async function ensureOperationalBaseline({
  container,
  query,
  logger,
}: {
  container: ExecArgs["container"];
  query: { graph: QueryGraphFunction };
  logger: { warn: (message: string) => void };
}) {
  const regionResult = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2", "metadata"],
  });
  let region = (regionResult.data as BaselineRegion[]).find(
    (entry) =>
      entry.countries?.some((country) => country.iso_2 === "bd") ||
      entry.metadata?.market_code === "bd" ||
      (entry.name === "Bangladesh" && entry.currency_code === "bdt"),
  );

  if (!region) {
    const paymentProviders = ["pp_system_default"];
    if (process.env.SSLCOMMERZ_ENABLED === "true") {
      paymentProviders.push("pp_sslcommerz_sslcommerz");
    }

    const created = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Bangladesh",
            currency_code: "bdt",
            countries: ["bd"],
            payment_providers: paymentProviders,
            metadata: {
              market_code: "bd",
              enabled: true,
              bootstrap_created: true,
              review_required: true,
            },
          },
        ],
      },
    });
    region = created.result[0] as BaselineRegion | undefined;
  }

  if (!region) {
    throw new Error("The Bangladesh region could not be created.");
  }

  const storeResult = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id", "default_region_id", "default_location_id"],
  });
  const store = storeResult.data[0] as
    | {
        id: string;
        default_sales_channel_id?: string;
        default_region_id?: string | null;
        default_location_id?: string | null;
      }
    | undefined;
  const defaultSalesChannelId = store?.default_sales_channel_id;

  if (!store || !defaultSalesChannelId) {
    throw new Error(
      "The default Medusa sales channel is missing. Complete the native store setup and retry.",
    );
  }

  const listLocations = async () => {
    const result = await query.graph({
      entity: "stock_location",
      fields: [
        "id",
        "name",
        "metadata",
        "sales_channels.id",
        "fulfillment_providers.id",
        "fulfillment_sets.id",
        "fulfillment_sets.name",
        "fulfillment_sets.type",
        "fulfillment_sets.service_zones.id",
        "fulfillment_sets.service_zones.name",
        "fulfillment_sets.service_zones.geo_zones.id",
        "fulfillment_sets.service_zones.geo_zones.type",
        "fulfillment_sets.service_zones.geo_zones.country_code",
      ],
    });
    return result.data as BaselineLocation[];
  };

  let location = (await listLocations()).find(
    (entry) =>
      entry.name === PRIMARY_LOCATION_NAME ||
      entry.metadata?.bootstrap_key === "bangla_blend_primary_warehouse",
  );

  if (!location) {
    await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: PRIMARY_LOCATION_NAME,
            metadata: {
              bootstrap_key: "bangla_blend_primary_warehouse",
              review_required: true,
            },
          },
        ],
      },
    });
    location = (await listLocations()).find(
      (entry) =>
        entry.name === PRIMARY_LOCATION_NAME ||
        entry.metadata?.bootstrap_key === "bangla_blend_primary_warehouse",
    );
  }

  if (!location) {
    throw new Error("The primary stock location could not be created.");
  }

  if (!location.sales_channels?.some((channel) => channel.id === defaultSalesChannelId)) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: location.id,
        add: [defaultSalesChannelId],
      },
    });
  }

  const providerResult = await query.graph({
    entity: "fulfillment_provider",
    fields: ["id", "is_enabled"],
    filters: { id: "manual_manual" },
  });
  const manualProvider = (
    providerResult.data as Array<{ id: string; is_enabled?: boolean }>
  )[0];

  if (
    manualProvider?.is_enabled !== false &&
    manualProvider &&
    !location.fulfillment_providers?.some((provider) => provider.id === manualProvider.id)
  ) {
    await batchLinksWorkflow(container).run({
      input: {
        create: [
          {
            [Modules.STOCK_LOCATION]: {
              stock_location_id: location.id,
            },
            [Modules.FULFILLMENT]: {
              fulfillment_provider_id: manualProvider.id,
            },
          },
        ],
      },
    });
  } else if (!manualProvider) {
    logger.warn(
      "The manual fulfillment provider is unavailable; configure a provider before adding shipping options.",
    );
  }

  const storeUpdate: { default_region_id?: string; default_location_id?: string } = {};
  if (!store.default_region_id) {
    storeUpdate.default_region_id = region.id;
  }
  if (!store.default_location_id) {
    storeUpdate.default_location_id = location.id;
  }
  if (Object.keys(storeUpdate).length) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: storeUpdate,
      },
    });
  }

  let fulfillmentSet = location.fulfillment_sets?.find(
    (entry) =>
      entry.name === PRIMARY_FULFILLMENT_SET_NAME &&
      entry.type === "shipping",
  );

  if (!fulfillmentSet) {
    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: location.id,
        fulfillment_set_data: {
          name: PRIMARY_FULFILLMENT_SET_NAME,
          type: "shipping",
        },
      },
    });

    location = (await listLocations()).find((entry) => entry.id === location?.id);
    fulfillmentSet = location?.fulfillment_sets?.find(
      (entry) =>
        entry.name === PRIMARY_FULFILLMENT_SET_NAME &&
        entry.type === "shipping",
    );
  }

  if (!fulfillmentSet) {
    throw new Error("The primary fulfillment set could not be created.");
  }

  const bangladeshZone = fulfillmentSet.service_zones?.find((zone) =>
    zone.geo_zones?.some(
      (geoZone) => geoZone.type === "country" && geoZone.country_code === "bd",
    ),
  );
  const conflictingNamedZone = fulfillmentSet.service_zones?.find(
    (zone) => zone.name === PRIMARY_SERVICE_ZONE_NAME,
  );

  if (!bangladeshZone && conflictingNamedZone) {
    throw new Error(
      `The ${PRIMARY_SERVICE_ZONE_NAME} service zone exists without Bangladesh country coverage. Review it in Admin before rerunning the bootstrap.`,
    );
  }

  if (!bangladeshZone) {
    await createServiceZonesWorkflow(container).run({
      input: {
        data: [
          {
            name: PRIMARY_SERVICE_ZONE_NAME,
            fulfillment_set_id: fulfillmentSet.id,
            geo_zones: [
              {
                type: "country",
                country_code: "bd",
                metadata: {
                  bootstrap_created: true,
                  review_required: true,
                },
              },
            ],
          },
        ],
      },
    });
  }
}

export default async function seedSuperadmin({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  if (!FeatureFlag.isFeatureEnabled("rbac")) {
    throw new Error("Medusa RBAC is disabled. Set MEDUSA_FF_RBAC=true, run migrations, and retry.");
  }

  const credentials = getBootstrapCredentials();
  const userService = container.resolve(Modules.USER);
  const authService = container.resolve(Modules.AUTH);
  const rbacService = container.resolve(Modules.RBAC);
  const query = container.resolve<{ graph: QueryGraphFunction }>(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  const [superadminRole] = await rbacService.listRbacRoles({ id: SUPERADMIN_ROLE_ID });
  if (!superadminRole) {
    throw new Error(
      `Medusa RBAC role ${SUPERADMIN_ROLE_ID} is missing. Run pnpm db:migrate and retry.`,
    );
  }

  const [existingUser] = await userService.listUsers({ email: credentials.email });
  const user = existingUser
    ? await userService.updateUsers({
        id: existingUser.id,
        first_name: credentials.firstName,
        last_name: credentials.lastName,
      })
    : await userService.createUsers({
        email: credentials.email,
        first_name: credentials.firstName,
        last_name: credentials.lastName,
      });

  const { data: existingRoleLinks } = await query.graph({
    entity: "user_rbac_role",
    fields: ["user_id", "rbac_role_id"],
    filters: {
      user_id: user.id,
      rbac_role_id: SUPERADMIN_ROLE_ID,
    },
  });

  if (!existingRoleLinks.length) {
    await link.create([
      {
        [Modules.USER]: { user_id: user.id },
        [Modules.RBAC]: { rbac_role_id: SUPERADMIN_ROLE_ID },
      },
    ]);
  }

  const authIdentities = await authService.listAuthIdentities(
    {},
    { relations: ["provider_identities"] },
  );
  const existingAuthIdentity = authIdentities.find((identity) =>
    identity.provider_identities?.some(
      (providerIdentity) =>
        providerIdentity.provider === EMAILPASS_PROVIDER &&
        providerIdentity.entity_id.toLowerCase() === credentials.email,
    ),
  );

  const authResult = existingAuthIdentity
    ? await authService.updateProvider(EMAILPASS_PROVIDER, {
        entity_id: credentials.email,
        password: credentials.password,
      })
    : await authService.register(EMAILPASS_PROVIDER, {
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      });

  if (authResult.error || !authResult.authIdentity) {
    throw new Error(authResult.error ?? "The email/password auth identity could not be created.");
  }

  const attachedUserId = authResult.authIdentity.app_metadata?.user_id;
  if (typeof attachedUserId === "string" && attachedUserId !== user.id) {
    throw new Error(
      `The ${credentials.email} auth identity is already attached to a different user (${attachedUserId}).`,
    );
  }

  await authService.updateAuthIdentities({
    id: authResult.authIdentity.id,
    app_metadata: {
      ...(authResult.authIdentity.app_metadata ?? {}),
      user_id: user.id,
    },
  });

  const adminControlService = container.resolve<AdminControlModuleService>(ADMIN_CONTROL_MODULE);
  for (const setting of defaultAdminSettings) {
    const [existingSetting] = await adminControlService.listAppSettings({ key: setting.key });
    if (!existingSetting) {
      await adminControlService.createAppSettings({
        ...setting,
        value: wrapSettingValue(setting.value),
        updated_by: user.id,
        metadata: null,
      });
    }
  }

  await ensureOperationalBaseline({ container, query, logger });

  logger.info(
    `Superadmin ready: ${credentials.email}. User ${user.id} has ${SUPERADMIN_ROLE_ID}; the configured password was applied without being logged. Bangladesh region, stock, and fulfillment prerequisites are ready without sample products.`,
  );
}
