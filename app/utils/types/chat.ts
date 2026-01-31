/**
 * Chat Types for AI-VIBE-CHAT-V1
 */

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  provider?: string
  isStreaming?: boolean
  attachments?: Attachment[]
  metadata?: MessageMetadata
}

export interface Attachment {
  id: string
  type: 'image' | 'document' | 'code' | 'other'
  name: string
  url?: string
  data?: string
  mimeType?: string
  size?: number
}

export interface MessageMetadata {
  tokens?: {
    input: number
    output: number
    total: number
  }
  latency?: number
  finishReason?: string
  error?: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  modelId: string
  providerId: string
  settings: ChatSettings
}

export interface ChatSettings {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  systemPrompt?: string
}

export interface StreamingState {
  isStreaming: boolean
  messageId?: string
  content: string
  error?: string
}
