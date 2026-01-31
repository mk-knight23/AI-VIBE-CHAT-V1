import { defineEventHandler } from 'h3'
import { MODEL_REGISTRY, PROVIDER_CONFIGS } from '~/server/utils/modelRegistry'

export default defineEventHandler(() => {
  return {
    success: true,
    data: {
      providers: PROVIDER_CONFIGS,
      models: MODEL_REGISTRY,
    },
  }
})
