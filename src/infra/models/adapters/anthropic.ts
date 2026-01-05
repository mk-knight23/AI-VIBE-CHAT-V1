/**
 * Anthropic Claude Adapter for CHUTES AI Chat v4
 *
 * Supports Claude models through Anthropic's API:
 * - Claude 3.5 Sonnet
 * - Claude 3 Haiku
 * - Claude 3 Opus
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

export class AnthropicAdapter implements ModelAdapter {
  readonly providerId = 'anthropic';
  readonly baseUrl = 'https://api.anthropic.com/v1';
  readonly apiKey: string;

  private retryConfig: typeof DEFAULT_RETRY_CONFIG;

  constructor(apiKey?: string, retryConfig?: Partial<typeof DEFAULT_RETRY_CONFIG>) {
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private getApiKey(): string {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!key) {
      throw new AuthError('Anthropic API key not found. Please set VITE_ANTHROPIC_API_KEY environment variable.');
    }
    return key;
  }

  async models(): Promise<string[]> {
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  async request(params: ModelRequest): Promise<ModelResponse> {
    return this.withRetry(async () => {
      const response = await this.makeRequest('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xanthropic-version': '2023-06-01',
        },
        body: JSON.stringify(this.transformRequest(params)),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return this.transformResponse(data);
    });
  }

  async stream(
    params: ModelRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    return this.withRetry(async () => {
      const response = await this.makeRequest('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xanthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          ...this.transformRequest(params),
          stream: true,
        }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError('Response body is not readable', 'stream_error', 'server', true);
      }

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
                if (parsed.delta?.text) {
                  onChunk(parsed.delta.text);
                }
              } catch {
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    });
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest('/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xanthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          status: 'unhealthy',
          latency,
          lastChecked: new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        status: 'healthy',
        latency,
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

  supportsStreaming(): boolean {
    return true;
  }

  supportsAttachments(): boolean {
    return true; // Claude 3 supports vision
  }

  private transformRequest(params: ModelRequest): Record<string, unknown> {
    const messages = params.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'user' : 'user',
      content: msg.content,
    }));

    return {
      model: params.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature ?? 0.7,
      messages,
    };
  }

  private transformResponse(data: Record<string, unknown>): ModelResponse {
    const content = (data.content as Array<{ text?: string }>)?.find((c) => c.text)?.text || '';
    const usage = data.usage as { input_tokens?: number; output_tokens?: number } | undefined;

    return {
      text: content,
      tokens: usage
        ? {
            input: usage.input_tokens || 0,
            output: usage.output_tokens || 0,
            total: (usage.input_tokens || 0) + (usage.output_tokens || 0),
          }
        : undefined,
      metadata: {
        model: data.model as string || 'anthropic',
        provider: 'anthropic',
        finishReason: (data.stop_reason as string) || 'stop',
      },
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: Record<string, unknown> = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const message = (errorData.error as { message?: string })?.message || response.statusText;
    const errorType = (errorData.error as { type?: string })?.type;

    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message);
    }

    if (response.status === 429) {
      const resetTime = response.headers.get('retry-after');
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1000 : undefined);
    }

    if (response.status >= 500) {
      throw new ProviderError(message, 'server_error', 'server', true, response.status);
    }

    if (errorType === 'rate_limit_error') {
      throw new RateLimitError(message);
    }

    throw new ProviderError(message, 'api_error', 'unknown', false, response.status);
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof ProviderError && !error.retryable) {
          throw error;
        }

        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        const baseDelay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
        const jitter = this.retryConfig.jitter ? Math.random() * 0.1 * baseDelay : 0;
        const delay = Math.min(baseDelay + jitter, this.retryConfig.maxDelay);

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
