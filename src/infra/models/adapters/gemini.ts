/**
 * Google Gemini Adapter for CHUTES AI Chat v4
 */
import { ModelAdapter, ModelRequest, ModelResponse, ProviderHealth, ProviderError, AuthError, RateLimitError } from '../index';

const DEFAULT_RETRY_CONFIG = { maxAttempts: 3, baseDelay: 1000, maxDelay: 10000, backoffFactor: 2, jitter: true };

export class GeminiAdapter implements ModelAdapter {
  readonly providerId = 'gemini';
  readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  readonly apiKey: string;
  private retryConfig = DEFAULT_RETRY_CONFIG;

  constructor(apiKey?: string, retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>) {
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private getApiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) throw new AuthError('Google Gemini API key not found.');
    return key;
  }

  async models(): Promise<string[]> { return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']; }

  async request(params: ModelRequest): Promise<ModelResponse> {
    return this.withRetry(async () => {
      const model = params.model || 'gemini-1.5-flash';
      const response = await this.makeRequest(`/models/${  model  }:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.transformRequest(params))
      });
      if (!response.ok) await this.handleErrorResponse(response);
      return this.transformResponse(await response.json());
    });
  }

  async stream(params: ModelRequest, onChunk: (chunk: string) => void): Promise<void> {
    return this.withRetry(async () => {
      const model = params.model || 'gemini-1.5-flash';
      const response = await this.makeRequest(`/models/${  model  }:streamGenerateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.transformRequest(params), stream: true })
      });
      if (!response.ok) { await this.handleErrorResponse(response); return; }
      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) onChunk(text);
              } catch { continue; }
            }
          }
        }
      } finally { reader.releaseLock(); }
    });
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest('/models/gemini-1.5-flash', { method: 'GET', signal: AbortSignal.timeout(5000) });
      return { status: response.ok ? 'healthy' : 'unhealthy', latency: Date.now() - startTime, lastChecked: new Date() };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - startTime, lastChecked: new Date(), error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  supportsStreaming(): boolean { return true; }
  supportsAttachments(): boolean { return true; }

  private transformRequest(params: ModelRequest): Record<string, unknown> {
    return {
      contents: params.messages.map((msg) => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })),
      generationConfig: { maxOutputTokens: params.maxTokens || 4096, temperature: params.temperature ?? 0.7, topP: params.topP ?? 0.9 }
    };
  }

  private transformResponse(data: Record<string, unknown>): ModelResponse {
    const text = (data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>)?.[0]?.content?.parts?.[0]?.text || '';
    return { text, metadata: { model: 'gemini', provider: 'gemini', finishReason: 'stop' } };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const message = response.statusText;
    if (response.status === 401 || response.status === 403) throw new AuthError(message);
    if (response.status === 429) throw new RateLimitError(message);
    if (response.status >= 500) throw new ProviderError(message, 'server_error', 'server', true, response.status);
    throw new ProviderError(message, 'api_error', 'unknown', false, response.status);
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl + endpoint  }?key=${  this.apiKey}`, options);
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try { return await operation(); }
      catch (error) {
        lastError = error as Error;
        if (error instanceof ProviderError && !error.retryable) throw error;
        if (attempt === this.retryConfig.maxAttempts) break;
        await new Promise((r) => setTimeout(r, Math.min(this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1), this.retryConfig.maxDelay)));
      }
    }
    throw lastError!;
  }
}
