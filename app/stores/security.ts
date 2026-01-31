import { defineStore } from 'pinia'
import { encryptData, decryptData, generateEncryptionKey, hashPassword } from '~/utils/encryption'

export interface SecurityState {
  encryptionKey: string | null
  isUnlocked: boolean
  lockTimeout: number // minutes
  lastActivity: number
  passwordHash: string | null
}

export const useSecurityStore = defineStore('security', {
  state: (): SecurityState => ({
    encryptionKey: null,
    isUnlocked: false,
    lockTimeout: 30, // 30 minutes default
    lastActivity: Date.now(),
    passwordHash: null,
  }),

  getters: {
    isLocked: (state): boolean => {
      if (!state.encryptionKey) return false // No encryption set up
      if (state.isUnlocked) {
        // Check if timeout has expired
        const timeoutMs = state.lockTimeout * 60 * 1000
        if (Date.now() - state.lastActivity > timeoutMs) {
          return true
        }
      }
      return !state.isUnlocked
    },

    hasEncryption: (state): boolean => {
      return !!state.encryptionKey
    },
  },

  actions: {
    initializeEncryption(password: string) {
      const key = generateEncryptionKey(password)
      this.encryptionKey = key
      this.passwordHash = hashPassword(password)
      this.isUnlocked = true
      this.lastActivity = Date.now()
    },

    unlock(password: string): boolean {
      const hashed = hashPassword(password)
      if (hashed === this.passwordHash) {
        this.encryptionKey = generateEncryptionKey(password)
        this.isUnlocked = true
        this.lastActivity = Date.now()
        return true
      }
      return false
    },

    lock() {
      this.encryptionKey = null
      this.isUnlocked = false
    },

    updateActivity() {
      this.lastActivity = Date.now()
    },

    setLockTimeout(minutes: number) {
      this.lockTimeout = Math.max(1, Math.min(240, minutes))
    },

    encrypt(data: string): string {
      if (!this.encryptionKey) {
        throw new Error('Encryption not initialized')
      }
      return encryptData(data, this.encryptionKey)
    },

    decrypt(encryptedData: string): string {
      if (!this.encryptionKey) {
        throw new Error('Encryption not initialized or locked')
      }
      this.updateActivity()
      return decryptData(encryptedData, this.encryptionKey)
    },

    changePassword(oldPassword: string, newPassword: string): boolean {
      if (!this.unlock(oldPassword)) {
        return false
      }

      this.encryptionKey = generateEncryptionKey(newPassword)
      this.passwordHash = hashPassword(newPassword)
      return true
    },

    clearEncryption() {
      this.$reset()
    },
  },

  persist: {
    key: 'security-store',
    paths: ['passwordHash', 'lockTimeout', 'lastActivity'],
  },
})
