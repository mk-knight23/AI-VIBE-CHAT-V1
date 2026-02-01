import { defineEventHandler, readBody, createError, getHeader, setHeader, sendStream } from 'h3'
import { createSafeProviderAdapter, detectProviderFromModel } from '~/server/utils/modelRegistry'
import { rateLimiter } from '~/server/utils/rateLimiter'
import type { ModelRequest, ProviderId } from '~/server/utils/providers'

export default defineEventHandler(async (event) => {
  try {
    // Rate limiting check
    const clientId = getHeader(event, 'x-forwarded-for') || 'anonymous'
    const rateLimitResult = rateLimiter.checkLimit(clientId, 'chat')

    if (!rateLimitResult.allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Rate limit exceeded. Please try again later.',
      })
    }

    // Read request body
    const body = await readBody<ModelRequest>(event)

    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: messages array required',
      })
    }

    // Extract provider from model or use default
    const model = body.model || 'openai/gpt-4o-mini'
    const provider: ProviderId = detectProviderFromModel(model)

    // Create provider adapter with fallback to mock
    const adapter = createSafeProviderAdapter(provider)

    // Check if streaming is requested
    if (body.stream) {
      // Set up SSE response
      setHeader(event, 'Content-Type', 'text/event-stream')
      setHeader(event, 'Cache-Control', 'no-cache')
      setHeader(event, 'Connection', 'keep-alive')

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullContent = ''

            await adapter.stream(body, (chunk) => {
              fullContent += chunk
              const data = JSON.stringify({ content: chunk, done: false })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            })

            // Send completion
            const doneData = JSON.stringify({ content: fullContent, done: true })
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Streaming error'
            const errorData = JSON.stringify({ error: errorMessage, done: true })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
          }
        },
      })

      return sendStream(event, stream)
    }

    // Non-streaming response
    const response = await adapter.request(body)

    if (response.error) {
      throw createError({
        statusCode: 500,
        statusMessage: response.error.message,
      })
    }

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error('Chat API error:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Internal server error',
    })
  }
})
