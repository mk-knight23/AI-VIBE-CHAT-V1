/**
 * Settings Types for AI-VIBE-CHAT-V1
 */

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  sidebarCollapsed: boolean
  enterToSend: boolean
  soundEnabled: boolean
  notifications: NotificationSettings
  privacy: PrivacySettings
}

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  messagePreview: boolean
}

export interface PrivacySettings {
  encryptChats: boolean
  autoDelete: number // days, 0 = never
  shareAnalytics: boolean
}

export interface ProviderSettings {
  defaultProvider: string
  defaultModel: string
  apiKeys: Record<string, string>
  customEndpoints: Record<string, string>
}

export interface SecuritySettings {
  encryptionEnabled: boolean
  encryptionPassword?: string
  sessionTimeout: number // minutes
}
