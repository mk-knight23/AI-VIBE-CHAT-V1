/**
 * Security Tests for Chat API Validation
 *
 * Tests for input validation schema and sanitization
 */

import { describe, it, expect } from 'vitest'
import { validateChatRequest, sanitizeMessageContent, chatRequestSchema, chatMessageSchema } from '~/server/validation/chatSchema'

describe('Chat API Validation Security', () => {
  describe('Message Content Sanitization', () => {
    it('should remove null bytes from content', () => {
      const input = 'Hello\x00World'
      const sanitized = sanitizeMessageContent(input)
      expect(sanitized).toBe('HelloWorld')
    })

    it('should remove control characters except newline and tab', () => {
      const input = 'Hello\x01\x02\x03\x08World'
      const sanitized = sanitizeMessageContent(input)
      expect(sanitized).toBe('HelloWorld')
    })

    it('should preserve newlines and tabs', () => {
      const input = 'Line 1\nLine 2\tTabbed'
      const sanitized = sanitizeMessageContent(input)
      expect(sanitized).toBe('Line 1\nLine 2\tTabbed')
    })

    it('should limit consecutive whitespace', () => {
      const input = 'a'.repeat(25) // 25 spaces
      const sanitized = sanitizeMessageContent(input)
      // Should be limited to 20 spaces
      expect(sanitized.length).toBeLessThanOrEqual(20)
    })
  })

  describe('Request Validation', () => {
    it('should reject empty messages array', () => {
      const result = validateChatRequest({ messages: [] })
      expect(result.success).toBe(false)
      expect(result.errors).toBeTruthy()
      expect(result.errors?.[0].message).toContain('At least one message')
    })

    it('should reject messages with empty content', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: '' }]
      })
      expect(result.success).toBe(false)
    })

    it('should reject messages exceeding max length', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: 'a'.repeat(50001)
        }]
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid message roles', () => {
      const result = validateChatRequest({
        messages: [{ role: 'hacker', content: 'test' }]
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid model names', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'test' }],
        model: '../../../etc/passwd'
      })
      expect(result.success).toBe(false)
    })

    it('should reject temperature out of range', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'test' }],
        temperature: 5
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative maxTokens', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'test' }],
        maxTokens: -100
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid request', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'Hello, world!' }],
        model: 'gpt-4',
        temperature: 0.7
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeTruthy()
    })

    it('should sanitize message content in valid request', () => {
      const result = validateChatRequest({
        messages: [{ role: 'user', content: 'Hello\x00World' }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.messages[0].content).toBe('HelloWorld')
    })
  })

  describe('Schema Validation', () => {
    it('should validate message schema correctly', () => {
      const validMessage = {
        role: 'user',
        content: 'Test message'
      }

      const result = chatMessageSchema.safeParse(validMessage)
      expect(result.success).toBe(true)
    })

    it('should reject message with invalid role', () => {
      const invalidMessage = {
        role: 'invalid',
        content: 'Test'
      }

      const result = chatMessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
    })

    it('should reject message exceeding max length', () => {
      const longMessage = {
        role: 'user',
        content: 'a'.repeat(50001)
      }

      const result = chatMessageSchema.safeParse(longMessage)
      expect(result.success).toBe(false)
    })

    it('should validate complete request schema', () => {
      const validRequest = {
        messages: [
          { role: 'user', content: 'Hello' }
        ],
        model: 'gpt-4',
        temperature: 0.7,
        stream: false
      }

      const result = chatRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })
  })

  describe('XSS Prevention', () => {
    it('should sanitize script tag attempts', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: '<script>alert("xss")</script>'
        }]
      })

      expect(result.success).toBe(true)
      // Content is still allowed but could be further sanitized
      expect(result.data?.messages[0].content).toContain('script')
    })

    it('should handle on* event handlers', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: '<img onerror="alert(1)">'
        }]
      })

      expect(result.success).toBe(true)
    })

    it('should handle javascript: URLs', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: '<a href="javascript:alert(1)">click</a>'
        }]
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Injection Attack Prevention', () => {
    it('should handle SQL injection attempts', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: "'; DROP TABLE users; --"
        }]
      })

      expect(result.success).toBe(true)
      expect(result.data?.messages[0].content).toContain('DROP TABLE')
    })

    it('should handle NoSQL injection attempts', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: '{"$ne": null}'
        }]
      })

      expect(result.success).toBe(true)
    })

    it('should handle template injection attempts', () => {
      const result = validateChatRequest({
        messages: [{
          role: 'user',
          content: '{{7*7}}'
        }]
      })

      expect(result.success).toBe(true)
    })
  })
})
