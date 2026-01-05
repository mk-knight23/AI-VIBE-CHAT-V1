/**
 * OpenRouter Adapter for CHUTES AI Chat v4
 *
 * Supports models from multiple providers through OpenRouter's unified API:
 * - x-ai/grok-4.1-fast
 * - z-ai/glm-4.5-air
 * - deepseek/deepseek-chat-v3-0324
 * - qwen/qwen3-coder
 * - openai/gpt-oss-20b
 * - google/gemini-2.0-flash-exp
 */

import {
  ModelAdapter,
  ModelRequest,
  ModelResponse,
  ProviderHealth,
  ProviderError,
  RateLimitError,
  AuthError,
  RetryConfig,
} from '../index';

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
};

export class OpenRouterAdapter implements ModelAdapter {
  readonly providerId = 'openrouter';
  readonly baseUrl = 'https://openrouter.ai/api/v1';
  readonly apiKey: string;

  private retryConfig: RetryConfig;

  constructor(apiKey?: string, retryConfig: Partial<RetryConfig> = {}) {
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private getApiKey(): string {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!key) {
      throw new AuthError('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY environment variable.');
    }
    return key;
  }

  async models(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/models', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new ProviderError(
          `Failed to fetch models: ${response.statusText}`,
          'models_fetch_failed',
          'server',
          true,
          response.status
        );
      }

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Network error fetching models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'network_error',
        'network',
        true
      );
    }
  }

  async request(params: ModelRequest): Promise<ModelResponse> {
    return this.withRetry(async () => {
      const openRouterRequest = this.transformRequest(params);

      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openRouterRequest),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return this.transformResponse(data, params.model);
    });
  }

  async stream(
    params: ModelRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    return this.withRetry(async () => {
      const openRouterRequest = {
        ...this.transformRequest(params),
        stream: true,
      };

      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openRouterRequest),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError(
          'Response body is not readable',
          'stream_error',
          'server',
          true
        );
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
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
                // Skip invalid JSON
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
      const response = await this.makeRequest('/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
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

      // Check rate limit headers
      const remaining = response.headers.get('x-ratelimit-remaining');
      const resetTime = response.headers.get('x-ratelimit-reset');

      return {
        status: 'healthy',
        latency,
        lastChecked: new Date(),
        rateLimit: remaining ? {
          remaining: parseInt(remaining),
          resetTime: resetTime ? parseInt(resetTime) * 1000 : undefined,
        } : undefined,
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

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/auth/key', {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime?: number }> {
    try {
      const response = await this.makeRequest('/auth/key', {
        method: 'GET',
      });

      const remaining = response.headers.get('x-ratelimit-remaining');
      const resetTime = response.headers.get('x-ratelimit-reset');

      return {
        remaining: remaining ? parseInt(remaining) : 0,
        resetTime: resetTime ? parseInt(resetTime) * 1000 : undefined,
      };
    } catch {
      return { remaining: 0 };
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsAttachments(): boolean {
    return true; // OpenRouter supports vision models
  }

  private transformRequest(params: ModelRequest): any {
    // Input validation and sanitization
    if (!params || typeof params !== 'object') {
      throw new ProviderError('Invalid request parameters', 'invalid_request', 'validation', false);
    }

    if (!params.messages || !Array.isArray(params.messages) || params.messages.length === 0) {
      throw new ProviderError('Messages array is required and cannot be empty', 'invalid_messages', 'validation', false);
    }

    // Validate and sanitize messages
    const messages = params.messages.map((msg, index) => {
      if (!msg || typeof msg !== 'object') {
        throw new ProviderError(`Invalid message at index ${index}`, 'invalid_message', 'validation', false);
      }

      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        throw new ProviderError(`Invalid message role at index ${index}: ${msg.role}`, 'invalid_role', 'validation', false);
      }

      if (typeof msg.content !== 'string') {
        throw new ProviderError(`Invalid message content at index ${index}: content must be a string`, 'invalid_content', 'validation', false);
      }

      // Sanitize content to prevent XSS
      const sanitizedContent = this.sanitizeInput(msg.content);
      if (sanitizedContent.length === 0) {
        throw new ProviderError(`Message content at index ${index} is empty after sanitization`, 'empty_content', 'validation', false);
      }

      // Validate message length
      if (sanitizedContent.length > 32768) {
        throw new ProviderError(`Message content at index ${index} exceeds maximum length of 32768 characters`, 'content_too_long', 'validation', false);
      }

      // Handle attachments if present
      if (msg.attachments?.length) {
        const attachmentContent = this.validateAndTransformAttachments(msg.attachments, index);
        return {
          role: msg.role,
          content: [
            { type: 'text', text: sanitizedContent },
            ...attachmentContent,
          ],
        };
      }

      return {
        role: msg.role,
        content: sanitizedContent,
      };
    });

    // Validate and sanitize model name
    const model = this.validateModelName(params.model);

    // Validate parameters with safe ranges
    return {
      model,
      messages,
      temperature: this.validateParameter(params.temperature ?? 0.7, 'temperature', 0, 2),
      max_tokens: this.validateParameter(params.maxTokens ?? 1024, 'max_tokens', 1, 32768),
      top_p: this.validateParameter(params.topP ?? 0.9, 'top_p', 0, 1),
      frequency_penalty: this.validateParameter(params.frequencyPenalty ?? 0, 'frequency_penalty', -2, 2),
      presence_penalty: this.validateParameter(params.presencePenalty ?? 0, 'presence_penalty', -2, 2),
      stream: false, // handled separately in stream method
    };
  }

  private sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  private validateAndTransformAttachments(attachments: any[], messageIndex: number): any[] {
    const maxAttachments = 10; // Reasonable limit
    if (attachments.length > maxAttachments) {
      throw new ProviderError(
        `Too many attachments in message ${messageIndex}: maximum ${maxAttachments} allowed`,
        'too_many_attachments',
        'validation',
        false
      );
    }

    return attachments.map((att, attIndex) => {
      if (!att || typeof att !== 'object') {
        throw new ProviderError(
          `Invalid attachment at index ${attIndex} in message ${messageIndex}`,
          'invalid_attachment',
          'validation',
          false
        );
      }

      const {type} = att;
      if (!type || !['image', 'text', 'file'].includes(type)) {
        throw new ProviderError(
          `Invalid attachment type at index ${attIndex} in message ${messageIndex}: ${type}`,
          'invalid_attachment_type',
          'validation',
          false
        );
      }

      const data = att.data || att.url;
      if (type === 'image') {
        if (!data || typeof data !== 'string') {
          throw new ProviderError(
            `Image attachment at index ${attIndex} in message ${messageIndex} requires valid data or URL`,
            'invalid_image_attachment',
            'validation',
            false
          );
        }
        return {
          type: 'image_url',
          image_url: { url: data },
        };
      } else {
        if (!data || typeof data !== 'string') {
          throw new ProviderError(
            `Text/file attachment at index ${attIndex} in message ${messageIndex} requires valid data`,
            'invalid_text_attachment',
            'validation',
            false
          );
        }
        return {
          type: 'text',
          text: this.sanitizeInput(data),
        };
      }
    });
  }

  private validateModelName(model?: string): string {
    const defaultModel = 'openai/gpt-4o-mini';
    
    if (!model || typeof model !== 'string') {
      return defaultModel;
    }

    // Sanitize model name
    const sanitizedModel = model.trim().replace(/[^a-zA-Z0-9\-_/]/g, '');
    
    if (sanitizedModel.length === 0) {
      return defaultModel;
    }

    // Validate against known models or allow if it matches pattern
    const knownModels = [
      'x-ai/grok-4.1-fast',
      'z-ai/glm-4.5-air',
      'deepseek/deepseek-chat-v3-0324',
      'qwen/qwen3-coder',
      'openai/gpt-oss-20b',
      'google/gemini-2.0-flash-exp',
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
    ];

    // Allow known models or models that match the provider/model pattern
    if (knownModels.includes(sanitizedModel) || /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(sanitizedModel)) {
      return sanitizedModel;
    }

    return defaultModel;
  }

  private validateParameter(value: number | undefined, paramName: string, min: number, max: number): number {
    if (value === undefined || value === null) {
      return (min + max) / 2; // Return midpoint as default
    }

    if (typeof value !== 'number' || isNaN(value)) {
      throw new ProviderError(
        `Invalid ${paramName}: must be a valid number`,
        'invalid_parameter',
        'validation',
        false
      );
    }

    if (value < min || value > max) {
      throw new ProviderError(
        `Invalid ${paramName}: must be between ${min} and ${max}, got ${value}`,
        'parameter_out_of_range',
        'validation',
        false
      );
    }

    return value;
  }

  private transformResponse(data: any, requestedModel?: string): ModelResponse {
    const choice = data.choices?.[0];
    if (!choice) {
      throw new ProviderError(
        'Invalid response format from OpenRouter',
        'invalid_response',
        'server',
        false
      );
    }

    const {usage} = data;
    const rateLimit = this.extractRateLimit(data);

    return {
      text: choice.message?.content || '',
      tokens: usage ? {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0,
      } : undefined,
      metadata: {
        model: data.model || requestedModel || 'unknown',
        provider: 'openrouter',
        finishReason: choice.finish_reason,
        usage: data.usage,
        rateLimit,
      },
    };
  }

  private extractRateLimit(data: any): ModelResponse['metadata']['rateLimit'] {
    // OpenRouter includes rate limit info in response headers, but for now we'll use defaults
    return undefined;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const message = errorData.error?.message || response.statusText;
    const code = errorData.error?.code || `http_${response.status}`;

    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message);
    }

    if (response.status === 429) {
      const resetTime = response.headers.get('retry-after');
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1000 : undefined);
    }

    if (response.status >= 500) {
      throw new ProviderError(message, code, 'server', true, response.status);
    }

    throw new ProviderError(message, code, 'unknown', false, response.status);
  }

  private async makeRequest(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    // Handle server-side rendering and testing environments
    const referer = typeof window !== 'undefined' && window.location
      ? window.location.origin
      : 'https://chutes-ai.dev';

    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': referer,
        'X-Title': 'CHUTES AI Chat v4',
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

        // Don't retry non-retryable errors
        if (error instanceof ProviderError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
        const jitter = this.retryConfig.jitter ? Math.random() * 0.1 * baseDelay : 0;
        const delay = Math.min(baseDelay + jitter, this.retryConfig.maxDelay);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
