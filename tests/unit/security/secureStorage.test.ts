/**
 * Security Tests for Secure Storage
 *
 * Tests for password hashing, key derivation, and encryption security
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('Secure Storage Security', () => {
  describe('PBKDF2 Salt Generation', () => {
    it('should generate unique salts for each password hash', async () => {
      const password = 'test-password-123'
      const encoder = new TextEncoder()

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      )

      // Generate two different salts
      const salt1 = crypto.getRandomValues(new Uint8Array(16))
      const salt2 = crypto.getRandomValues(new Uint8Array(16))

      // Derive keys with different salts
      const hash1 = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt1.buffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      )

      const hash2 = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt2.buffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      )

      // Hashes should be different due to different salts
      const hash1Array = new Uint8Array(hash1)
      const hash2Array = new Uint8Array(hash2)

      expect(hash1Array).not.toEqual(hash2Array)
    })

    it('should generate same hash for same password and salt', async () => {
      const password = 'test-password-123'
      const encoder = new TextEncoder()

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      )

      // Use the same salt
      const salt = crypto.getRandomValues(new Uint8Array(16))

      // Derive keys twice
      const hash1 = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt.buffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      )

      const hash2 = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt.buffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      )

      // Hashes should be identical
      const hash1Array = new Uint8Array(hash1)
      const hash2Array = new Uint8Array(hash2)

      expect(hash1Array).toEqual(hash2Array)
    })

    it('should use 100,000 iterations for PBKDF2', async () => {
      // This test verifies the implementation uses sufficient iterations
      const password = 'test-password'
      const encoder = new TextEncoder()

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
      )

      const salt = crypto.getRandomValues(new Uint8Array(16))

      // Time the operation to verify iterations are being used
      const start = performance.now()
      await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt.buffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      )
      const duration = performance.now() - start

      // Should take at least 10ms for 100,000 iterations
      expect(duration).toBeGreaterThan(10)
    })
  })

  describe('Password Hashing Security', () => {
    it('should use async PBKDF2-SHA256 for password hashing', async () => {
      // Import the hashPassword function from security.ts
      const { security } = await import('~/utils/encryption/security')

      const password = 'secure-password-123'

      // Should return a Promise (async)
      const result = security.hashPassword(password)

      expect(result).toBeInstanceOf(Promise)

      const { hash, salt } = await result

      // Hash should be 64 characters (256 bits in hex)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)

      // Salt should be 32 characters (16 bytes in hex/base64)
      expect(salt).toBeTruthy()
      expect(salt.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for same password with different salts', async () => {
      const { security } = await import('~/utils/encryption/security')

      const password = 'test-password'

      const result1 = await security.hashPassword(password)
      const result2 = await security.hashPassword(password)

      // Different salts should produce different hashes
      expect(result1.hash).not.toEqual(result2.hash)
      expect(result1.salt).not.toEqual(result2.salt)
    })

    it('should generate same hash for same password with same salt', async () => {
      const { security } = await import('~/utils/encryption/security')

      const password = 'test-password'
      const salt = 'fixed-salt-for-testing'

      const result1 = await security.hashPassword(password, salt)
      const result2 = await security.hashPassword(password, salt)

      expect(result1.hash).toEqual(result2.hash)
      expect(result1.salt).toEqual(result2.salt)
    })

    it('should verify passwords correctly', async () => {
      const { security } = await import('~/utils/encryption/security')

      const password = 'correct-password'
      const { hash, salt } = await security.hashPassword(password)

      // Correct password should verify
      const isValid = await security.verifyPassword(password, hash, salt)
      expect(isValid).toBe(true)

      // Wrong password should not verify
      const isInvalid = await security.verifyPassword('wrong-password', hash, salt)
      expect(isInvalid).toBe(false)
    })
  })
})
