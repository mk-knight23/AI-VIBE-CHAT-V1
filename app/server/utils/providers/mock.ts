/**
 * Mock Provider Adapter for AI-VIBE-CHAT-V1
 *
 * Provides simulated responses for development and testing
 * when real API keys are not available.
 */

import type {
  ModelAdapter,
  ModelRequest,
  ModelResponse,
  ProviderHealth,
} from './index';

export class MockAdapter implements ModelAdapter {
  readonly providerId = 'mock';
  readonly baseUrl = 'http://localhost:3000/mock';
  readonly apiKey = 'mock-api-key';

  // Simulated response delays for realistic feel
  private readonly minDelay = 500;
  private readonly maxDelay = 2000;

  async models(): Promise<string[]> {
    return [
      'mock/gpt-4o-mini',
      'mock/gpt-4o',
      'mock/claude-3-haiku',
      'mock/claude-3-sonnet',
    ];
  }

  async request(params: ModelRequest): Promise<ModelResponse> {
    // Simulate network delay
    await this.delay();

    const lastMessage = params.messages[params.messages.length - 1];
    const content = lastMessage?.content || '';

    const response = this.generateResponse(content);

    return {
      text: response,
      tokens: {
        input: content.length / 4,
        output: response.length / 4,
        total: (content.length + response.length) / 4,
      },
      metadata: {
        model: params.model || 'mock/gpt-4o-mini',
        provider: 'mock',
        finishReason: 'stop',
      },
    };
  }

  async stream(
    params: ModelRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const lastMessage = params.messages[params.messages.length - 1];
    const content = lastMessage?.content || '';
    const response = this.generateResponse(content);

    // Stream response word by word for realistic effect
    const words = response.split(' ');
    const delayPerWord = Math.min(100, this.maxDelay / words.length);

    for (const word of words) {
      await this.delay(delayPerWord);
      onChunk(word + ' ');
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      status: 'healthy',
      latency: 50,
      lastChecked: new Date(),
      rateLimit: {
        remaining: 1000,
      },
    };
  }

  async validateApiKey(): Promise<boolean> {
    return true;
  }

  async getRateLimit(): Promise<{ remaining: number; resetTime?: number }> {
    return { remaining: 1000 };
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsAttachments(): boolean {
    return false;
  }

  private generateResponse(input: string): string {
    const lowerInput = input.toLowerCase();

    // Pattern-based responses for common queries
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm a mock AI assistant running in development mode. How can I help you today?";
    }

    if (lowerInput.includes('help')) {
      return "I'm here to help! This is a mock response for testing purposes. In production, I would connect to real AI providers like OpenRouter, MegaLLM, or others.";
    }

    if (lowerInput.includes('weather')) {
      return "I don't have access to real-time weather data in mock mode. In production, I could help you find weather information through various tools and APIs.";
    }

    if (lowerInput.includes('code') || lowerInput.includes('programming')) {
      return "Here's a simple example in mock mode:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n```\n\nIn production, I'd provide more comprehensive coding assistance.";
    }

    if (lowerInput.includes('thank')) {
      return "You're welcome! I'm glad I could help. Remember, this is a mock response for development and testing purposes.";
    }

    // Default response
    return `I received your message: "${input}"\n\nThis is a mock response since no real AI provider API key is configured. To use real AI providers, please set one of the following environment variables:\n\n- NUXT_OPENROUTER_API_KEY\n- NUXT_MEGALLM_API_KEY\n- NUXT_AGENTROUTER_API_KEY\n- NUXT_ROUTEWAY_API_KEY\n\nThe mock provider allows you to test the chat interface and functionality without consuming real API credits.`;
  }

  private delay(ms?: number): Promise<void> {
    const delayMs = ms || this.minDelay + Math.random() * (this.maxDelay - this.minDelay);
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
