/**
 * OpenAI GPT-4 Adapter for CHUTES AI Chat v4
 */

import {
  ModelAdapter,
  ModelRequest,
  ModelResponse,
  ProviderHealth,
  ProviderError,
  AuthError,
  RateLimitError,
} from '../index';

const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

export class OpenAIAdapter implements ModelAdapter {
  readonly providerId = 'openai';
  readonly baseUrl = 'https://api.openai.com/v1';
  readonly apiKey: string;

  private retryConfig: typeof DEFAULT_RETRY_CONFIG;

  constructor(apiKey?: string, retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>) {
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private getApiKey(): string {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (!key) {
      throw new AuthError('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.');
    }
    return key;
  }

  async models(): Promise<string[]> {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  }

  async request(params: ModelRequest): Promise<ModelResponse> {
    return this.withRetry(async () => {
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.transformRequest(params)),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return this.transformResponse(data);
    });
  }

  async stream(params: ModelRequest, onChunk: (chunk: string) => void): Promise<void> {
    return this.withRetry(async () => {
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...this.transformRequest(params), stream: true }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }

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
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) onChunk(content);
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
      const response = await this.makeRequest('/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
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
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  supportsStreaming(): boolean { return true; }
  supportsAttachments(): boolean { return true; }

  private transformRequest(params: ModelRequest): Record<string, unknown> {
    return {
      model: params.model || 'gpt-4o-mini',
      messages: params.messages,
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature ?? 0.7,
      top_p: params.topP ?? 0.9,
      frequency_penalty: params.frequencyPenalty ?? 0,
      presence_penalty: params.presencePenalty ?? 0,
    };
  }

  private transformResponse(data: Record<string, unknown>): ModelResponse {
    const choice = data.choices?.[0] as { message?: { content?: string }; finish_reason?: string } | undefined;
    const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
    return {
      text: choice?.message?.content || '',
      tokens: usage ? { input: usage.prompt_tokens || 0, output: usage.completion_tokens || 0, total: usage.total_tokens || 0 } : undefined,
      metadata: { model: data.model as string || 'gpt-4', provider: 'openai', finishReason: choice?.finish_reason },
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: Record<string, unknown> = {};
    try { errorData = await response.json(); } catch { }
    const message = (errorData.error as { message?: string })?.message || response.statusText;
    if (response.status === 401 || response.status === 403) throw new AuthError(message);
    if (response.status === 429) {
      const resetTime = response.headers.get('retry-after');
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1000 : undefined);
    }
    if (response.status >= 500) throw new ProviderError(message, 'server_error', 'server', true, response.status);
    throw new ProviderError(message, 'api_error', 'unknown', false, response.status);
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    return fetch(`${this.baseUrl}${endpoint}`, { ...options, headers: { 'Authorization': `Bearer ${this.apiKey}`, ...options.headers } });
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
