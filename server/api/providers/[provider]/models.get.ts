import { defineEventHandler, createError, getRouterParam } from 'h3'
import { MODEL_REGISTRY } from '~/server/utils/modelRegistry'
import type { ProviderId } from '~/server/utils/providers'

export default defineEventHandler((event) => {
  try {
    const providerParam = getRouterParam(event, 'provider')

    if (!providerParam) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Provider parameter required',
      })
    }

    const provider = providerParam as ProviderId
    const models = MODEL_REGISTRY.filter(m => m.providerId === provider)

    return {
      success: true,
      data: models,
    }
  } catch (error) {
    console.error('Models fetch error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch models',
      data: [],
    }
  }
})
