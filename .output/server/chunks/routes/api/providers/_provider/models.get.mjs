import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { M as MODEL_REGISTRY } from '../../../../_/modelRegistry.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const models_get = defineEventHandler((event) => {
  try {
    const providerParam = getRouterParam(event, "provider");
    if (!providerParam) {
      throw createError({
        statusCode: 400,
        statusMessage: "Provider parameter required"
      });
    }
    const provider = providerParam;
    const models = MODEL_REGISTRY.filter((m) => m.providerId === provider);
    return {
      success: true,
      data: models
    };
  } catch (error) {
    console.error("Models fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch models",
      data: []
    };
  }
});

export { models_get as default };
//# sourceMappingURL=models.get.mjs.map
