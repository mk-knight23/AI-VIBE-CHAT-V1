import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { M as MODEL_REGISTRY, P as PROVIDER_CONFIGS } from '../../_/modelRegistry.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const providers_get = defineEventHandler(() => {
  return {
    success: true,
    data: {
      providers: PROVIDER_CONFIGS,
      models: MODEL_REGISTRY
    }
  };
});

export { providers_get as default };
//# sourceMappingURL=providers.get.mjs.map
