/**
 * Input Validation Schemas for Chat API
 *
 * Provides Zod schemas for validating incoming request data
 * to prevent injection attacks and ensure data integrity.
 */

import { z } from 'zod'

/**
 * Chat message schema
 * Validates individual message structure
 */
export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function'], {
    errorMap: () => ({ message: 'Invalid message role. Must be one of: system, user, assistant, function' })
  }),
  content: z.string()
    .min(1, 'Message content cannot be empty')
    .max(50000, 'Message content exceeds maximum length of 50000 characters')
    .refine(
      (content) => {
        // Check for null bytes
        if (content.includes('\0')) {
          return false
        }
        return true
      },
      { message: 'Message content contains invalid characters' }
    ),
  name: z.string().optional(),
  functionCall: z.any().optional(), // Allow for function call objects
})

/**
 * Chat request schema
 * Validates the entire chat request payload
 */
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema)
    .min(1, 'At least one message is required')
    .max(100, 'Cannot process more than 100 messages in a single request')
    .refine(
      (messages) => {
        // Ensure first message is from user or system
        const firstMsg = messages[0]
        return firstMsg.role === 'user' || firstMsg.role === 'system'
      },
      { message: 'First message must be from user or system' }
    ),
  model: z.string()
    .min(1, 'Model name cannot be empty')
    .max(100, 'Model name exceeds maximum length')
    .regex(/^[a-zA-Z0-9/_-]+$/, 'Model name contains invalid characters')
    .optional(),
  temperature: z.number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .optional(),
  maxTokens: z.number()
    .int('Max tokens must be an integer')
    .positive('Max tokens must be positive')
    .max(32000, 'Max tokens cannot exceed 32000')
    .optional(),
  topP: z.number()
    .min(0, 'Top P must be at least 0')
    .max(1, 'Top P must be at most 1')
    .optional(),
  stream: z.boolean().optional(),
  stop: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  presencePenalty: z.number()
    .min(-2, 'Presence penalty must be at least -2')
    .max(2, 'Presence penalty must be at most 2')
    .optional(),
  frequencyPenalty: z.number()
    .min(-2, 'Frequency penalty must be at least -2')
    .max(2, 'Frequency penalty must be at most 2')
    .optional(),
})

/**
 * Sanitize message content to remove potential XSS patterns
 */
export function sanitizeMessageContent(content: string): string {
  // Remove null bytes
  let sanitized = content.replace(/\0/g, '')

  // Remove control characters except newlines, tabs, and carriage returns
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Limit consecutive whitespace to prevent abuse
  sanitized = sanitized.replace(/[ \t]{20,}/g, '                    ') // 20 spaces max

  return sanitized
}

/**
 * Validate and sanitize a chat request
 */
export function validateChatRequest(data: unknown) {
  try {
    const result = chatRequestSchema.safeParse(data)

    if (!result.success) {
      // Format Zod errors for API response
      const errors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))

      return {
        success: false,
        errors,
        data: null
      }
    }

    // Sanitize message content
    const sanitized = {
      ...result.data,
      messages: result.data.messages.map(msg => ({
        ...msg,
        content: sanitizeMessageContent(msg.content)
      }))
    }

    return {
      success: true,
      errors: null,
      data: sanitized
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
      data: null
    }
  }
}

/**
 * Type for validated chat request
 */
export type ValidatedChatRequest = z.infer<typeof chatRequestSchema>
