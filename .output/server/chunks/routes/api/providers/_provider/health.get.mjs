import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { a as createProviderAdapter } from '../../../../_/modelRegistry.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const health_get = defineEventHandler(async (event) => {
  try {
    const providerParam = getRouterParam(event, "provider");
    if (!providerParam) {
      throw createError({
        statusCode: 400,
        statusMessage: "Provider parameter required"
      });
    }
    const provider = providerParam;
    const validProviders = ["openrouter", "megallm", "agentrouter", "routeway"];
    if (!validProviders.includes(provider)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid provider: ${provider}`
      });
    }
    const adapter = createProviderAdapter(provider);
    const health = await adapter.healthCheck();
    return {
      success: health.status === "healthy",
      data: health
    };
  } catch (error) {
    console.error("Health check error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
      data: {
        status: "unhealthy",
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
});

export { health_get as default };
//# sourceMappingURL=health.get.mjs.map
