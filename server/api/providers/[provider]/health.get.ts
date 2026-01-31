import { defineEventHandler, createError, getRouterParam } from 'h3'
import { createProviderAdapter } from '~/server/utils/modelRegistry'
import type { ProviderId } from '~/server/utils/providers'

export default defineEventHandler(async (event) => {
  try {
    const providerParam = getRouterParam(event, 'provider')

    if (!providerParam) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Provider parameter required',
      })
    }

    const provider = providerParam as ProviderId
    const validProviders = ['openrouter', 'megallm', 'agentrouter', 'routeway']

    if (!validProviders.includes(provider)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid provider: ${provider}`,
      })
    }

    const adapter = createProviderAdapter(provider)
    const health = await adapter.healthCheck()

    return {
      success: health.status === 'healthy',
      data: health,
    }
  } catch (error) {
    console.error('Health check error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      data: {
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
})
