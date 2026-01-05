/**
 * Ollama Local Model Adapter for CHUTES AI Chat v4
 */

import {
  ModelAdapter,
  ModelRequest,
  ModelResponse,
  ProviderHealth,
  ProviderError,
} from '../index';

export class OllamaAdapter implements ModelAdapter {
  readonly providerId = 'ollama';
  readonly baseUrl: string;
  readonly apiKey = ''; // Ollama doesn't require API key

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async models(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/api/tags', { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return (data.models as Array<{ name: string }>)?.map((m) => m.name.replace(':', '-')) || [];
    } catch {
      return ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3', 'gemma2'];
    }
  }

  async request(params: ModelRequest): Promise<ModelResponse> {
    const response = await this.makeRequest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.transformRequest(params)),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ProviderError(error.error || 'Request failed', 'api_error', 'server', false, response.status);
    }

    const data = await response.json();
    return this.transformResponse(data);
  }

  async stream(params: ModelRequest, onChunk: (chunk: string) => void): Promise<void> {
    const response = await this.makeRequest('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...this.transformRequest(params), stream: true }),
    });

    if (!response.ok) return;

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) onChunk(parsed.message.content);
          } catch { continue; }
        }
      }
    } finally { reader.releaseLock(); }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest('/api/tags', { method: 'GET', signal: AbortSignal.timeout(3000) });
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  supportsStreaming(): boolean { return true; }
  supportsAttachments(): boolean { return false; }

  private transformRequest(params: ModelRequest): Record<string, unknown> {
    return {
      model: params.model || 'llama3.2',
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
      options: {
        num_predict: params.maxTokens || 4096,
        temperature: params.temperature ?? 0.7,
      },
    };
  }

  private transformResponse(data: Record<string, unknown>): ModelResponse {
    return {
      text: (data.message as { content?: string })?.content || '',
      metadata: { model: 'ollama', provider: 'ollama', finishReason: 'stop' },
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl}${endpoint}`, options);
  }
}
