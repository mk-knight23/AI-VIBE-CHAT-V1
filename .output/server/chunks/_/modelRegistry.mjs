class ProviderError extends Error {
  constructor(message, code, type, retryable = false, statusCode) {
    super(message);
    this.code = code;
    this.type = type;
    this.retryable = retryable;
    this.statusCode = statusCode;
    this.name = "ProviderError";
  }
}
class RateLimitError extends ProviderError {
  constructor(message, resetTime) {
    super(message, "rate_limit_exceeded", "rate_limit", true);
    this.resetTime = resetTime;
    this.name = "RateLimitError";
  }
}
class AuthError extends ProviderError {
  constructor(message) {
    super(message, "authentication_failed", "auth", false);
    this.name = "AuthError";
  }
}

var __defProp$5 = Object.defineProperty;
var __defNormalProp$5 = (obj, key, value) => key in obj ? __defProp$5(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$5 = (obj, key, value) => __defNormalProp$5(obj, typeof key !== "symbol" ? key + "" : key, value);
const DEFAULT_RETRY_CONFIG$3 = {
  maxAttempts: 3,
  baseDelay: 1e3,
  maxDelay: 1e4,
  backoffFactor: 2,
  jitter: true
};
class OpenRouterAdapter {
  constructor(apiKey, retryConfig = {}) {
    __publicField$5(this, "providerId", "openrouter");
    __publicField$5(this, "baseUrl", "https://openrouter.ai/api/v1");
    __publicField$5(this, "apiKey");
    __publicField$5(this, "retryConfig");
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG$3, ...retryConfig };
  }
  getApiKey() {
    const key = process.env.NUXT_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new AuthError("OpenRouter API key not found. Please set NUXT_OPENROUTER_API_KEY environment variable.");
    }
    return key;
  }
  async models() {
    var _a;
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      if (!response.ok) {
        throw new ProviderError(
          `Failed to fetch models: ${response.statusText}`,
          "models_fetch_failed",
          "server",
          true,
          response.status
        );
      }
      const data = await response.json();
      return ((_a = data.data) == null ? void 0 : _a.map((model) => model.id)) || [];
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Network error fetching models: ${error instanceof Error ? error.message : "Unknown error"}`,
        "network_error",
        "network",
        true
      );
    }
  }
  async request(params) {
    return this.withRetry(async () => {
      const openRouterRequest = this.transformRequest(params);
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(openRouterRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      const data = await response.json();
      return this.transformResponse(data, params.model);
    });
  }
  async stream(params, onChunk) {
    return this.withRetry(async () => {
      var _a, _b, _c, _d;
      const openRouterRequest = {
        ...this.transformRequest(params),
        stream: true
      };
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(openRouterRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      if (!reader) {
        throw new ProviderError(
          "Response body is not readable",
          "stream_error",
          "server",
          true
        );
      }
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = (_d = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta) == null ? void 0 : _d.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
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
  async healthCheck() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      }, 5e3);
      const latency = Date.now() - startTime;
      if (!response.ok) {
        return {
          status: "unhealthy",
          latency,
          lastChecked: /* @__PURE__ */ new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        status: "healthy",
        latency,
        lastChecked: /* @__PURE__ */ new Date(),
        rateLimit: remaining ? {
          remaining: parseInt(remaining),
          resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
        } : void 0
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - startTime,
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async validateApiKey() {
    try {
      const response = await this.makeRequest("/auth/key", {
        method: "GET"
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async getRateLimit() {
    try {
      const response = await this.makeRequest("/auth/key", {
        method: "GET"
      });
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        remaining: remaining ? parseInt(remaining) : 0,
        resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
      };
    } catch {
      return { remaining: 0 };
    }
  }
  supportsStreaming() {
    return true;
  }
  supportsAttachments() {
    return true;
  }
  transformRequest(params) {
    var _a, _b, _c, _d, _e;
    const messages = params.messages.map((msg) => {
      var _a2;
      return {
        role: msg.role,
        content: ((_a2 = msg.attachments) == null ? void 0 : _a2.length) ? [
          { type: "text", text: msg.content },
          ...msg.attachments.map((att) => ({
            type: att.type === "image" ? "image_url" : "text",
            image_url: att.type === "image" ? { url: att.data || att.url } : void 0,
            text: att.type !== "image" ? att.data || att.name : void 0
          }))
        ] : msg.content
      };
    });
    return {
      model: params.model || "openai/gpt-4o-mini",
      // default fallback
      messages,
      temperature: (_a = params.temperature) != null ? _a : 0.7,
      max_tokens: (_b = params.maxTokens) != null ? _b : 1024,
      top_p: (_c = params.topP) != null ? _c : 0.9,
      frequency_penalty: (_d = params.frequencyPenalty) != null ? _d : 0,
      presence_penalty: (_e = params.presencePenalty) != null ? _e : 0,
      stream: false
      // handled separately in stream method
    };
  }
  transformResponse(data, requestedModel) {
    var _a, _b;
    const choice = (_a = data.choices) == null ? void 0 : _a[0];
    if (!choice) {
      throw new ProviderError(
        "Invalid response format from OpenRouter",
        "invalid_response",
        "server",
        false
      );
    }
    const usage = data.usage;
    return {
      text: ((_b = choice.message) == null ? void 0 : _b.content) || "",
      tokens: usage ? {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      } : void 0,
      metadata: {
        model: data.model || requestedModel || "unknown",
        provider: "openrouter",
        finishReason: choice.finish_reason,
        usage: data.usage
      }
    };
  }
  async handleErrorResponse(response) {
    var _a, _b;
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const message = ((_a = errorData.error) == null ? void 0 : _a.message) || response.statusText;
    const code = ((_b = errorData.error) == null ? void 0 : _b.code) || `http_${response.status}`;
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message);
    }
    if (response.status === 429) {
      const resetTime = response.headers.get("retry-after");
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1e3 : void 0);
    }
    if (response.status >= 500) {
      throw new ProviderError(message, code, "server", true, response.status);
    }
    throw new ProviderError(message, code, "unknown", false, response.status);
  }
  async makeRequest(endpoint, options, timeout) {
    const url = `${this.baseUrl}${endpoint}`;
    const referer = process.env.NUXT_PUBLIC_APP_URL || "https://chutes-ai.dev";
    const fetchOptions = {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": referer,
        "X-Title": "CHUTES AI Chat v4",
        ...options.headers
      }
    };
    if (timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      fetchOptions.signal = controller.signal;
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    return fetch(url, fetchOptions);
  }
  async withRetry(operation) {
    let lastError;
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
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
    throw lastError;
  }
}

var __defProp$4 = Object.defineProperty;
var __defNormalProp$4 = (obj, key, value) => key in obj ? __defProp$4(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$4 = (obj, key, value) => __defNormalProp$4(obj, typeof key !== "symbol" ? key + "" : key, value);
const DEFAULT_RETRY_CONFIG$2 = {
  maxAttempts: 3,
  baseDelay: 1e3,
  maxDelay: 1e4,
  backoffFactor: 2,
  jitter: true
};
class MegaLLMAdapter {
  constructor(apiKey, retryConfig = {}) {
    __publicField$4(this, "providerId", "megallm");
    __publicField$4(this, "baseUrl", "https://ai.megallm.io/v1");
    __publicField$4(this, "apiKey");
    __publicField$4(this, "retryConfig");
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG$2, ...retryConfig };
  }
  getApiKey() {
    const key = process.env.NUXT_MEGALLM_API_KEY || process.env.MEGALLM_API_KEY;
    if (!key) {
      throw new AuthError("MegaLLM API key not found. Please set NUXT_MEGALLM_API_KEY environment variable.");
    }
    return key;
  }
  async models() {
    var _a;
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      if (!response.ok) {
        throw new ProviderError(
          `Failed to fetch models: ${response.statusText}`,
          "models_fetch_failed",
          "server",
          true,
          response.status
        );
      }
      const data = await response.json();
      return ((_a = data.data) == null ? void 0 : _a.map((model) => model.id)) || [];
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Network error fetching models: ${error instanceof Error ? error.message : "Unknown error"}`,
        "network_error",
        "network",
        true
      );
    }
  }
  async request(params) {
    return this.withRetry(async () => {
      const megaLLMRequest = this.transformRequest(params);
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(megaLLMRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      const data = await response.json();
      return this.transformResponse(data, params.model);
    });
  }
  async stream(params, onChunk) {
    return this.withRetry(async () => {
      var _a, _b, _c, _d;
      const megaLLMRequest = {
        ...this.transformRequest(params),
        stream: true
      };
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(megaLLMRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      if (!reader) {
        throw new ProviderError(
          "Response body is not readable",
          "stream_error",
          "server",
          true
        );
      }
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = (_d = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta) == null ? void 0 : _d.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
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
  async healthCheck() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      }, 5e3);
      const latency = Date.now() - startTime;
      if (!response.ok) {
        return {
          status: "unhealthy",
          latency,
          lastChecked: /* @__PURE__ */ new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        status: "healthy",
        latency,
        lastChecked: /* @__PURE__ */ new Date(),
        rateLimit: remaining ? {
          remaining: parseInt(remaining),
          resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
        } : void 0
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - startTime,
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async validateApiKey() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async getRateLimit() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        remaining: remaining ? parseInt(remaining) : 0,
        resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
      };
    } catch {
      return { remaining: 0 };
    }
  }
  supportsStreaming() {
    return true;
  }
  supportsAttachments() {
    return false;
  }
  transformRequest(params) {
    var _a, _b, _c, _d, _e;
    const messages = params.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
      // MegaLLM may not support attachments
    }));
    return {
      model: params.model || "gpt-3.5-turbo",
      // default fallback
      messages,
      temperature: (_a = params.temperature) != null ? _a : 0.7,
      max_tokens: (_b = params.maxTokens) != null ? _b : 1024,
      top_p: (_c = params.topP) != null ? _c : 0.9,
      frequency_penalty: (_d = params.frequencyPenalty) != null ? _d : 0,
      presence_penalty: (_e = params.presencePenalty) != null ? _e : 0,
      stream: false
      // handled separately in stream method
    };
  }
  transformResponse(data, requestedModel) {
    var _a, _b;
    const choice = (_a = data.choices) == null ? void 0 : _a[0];
    if (!choice) {
      throw new ProviderError(
        "Invalid response format from MegaLLM",
        "invalid_response",
        "server",
        false
      );
    }
    const usage = data.usage;
    return {
      text: ((_b = choice.message) == null ? void 0 : _b.content) || "",
      tokens: usage ? {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      } : void 0,
      metadata: {
        model: data.model || requestedModel || "unknown",
        provider: "megallm",
        finishReason: choice.finish_reason,
        usage: data.usage
      }
    };
  }
  async handleErrorResponse(response) {
    var _a, _b;
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const message = ((_a = errorData.error) == null ? void 0 : _a.message) || response.statusText;
    const code = ((_b = errorData.error) == null ? void 0 : _b.code) || `http_${response.status}`;
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message);
    }
    if (response.status === 429) {
      const resetTime = response.headers.get("retry-after");
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1e3 : void 0);
    }
    if (response.status >= 500) {
      throw new ProviderError(message, code, "server", true, response.status);
    }
    throw new ProviderError(message, code, "unknown", false, response.status);
  }
  async makeRequest(endpoint, options, timeout) {
    const url = `${this.baseUrl}${endpoint}`;
    const fetchOptions = {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    };
    if (timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      fetchOptions.signal = controller.signal;
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    return fetch(url, fetchOptions);
  }
  async withRetry(operation) {
    let lastError;
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
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
    throw lastError;
  }
}

var __defProp$3 = Object.defineProperty;
var __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$3 = (obj, key, value) => __defNormalProp$3(obj, typeof key !== "symbol" ? key + "" : key, value);
const DEFAULT_RETRY_CONFIG$1 = {
  maxAttempts: 3,
  baseDelay: 1e3,
  maxDelay: 1e4,
  backoffFactor: 2,
  jitter: true
};
class AgentRouterAdapter {
  constructor(apiKey, retryConfig = {}) {
    __publicField$3(this, "providerId", "agentrouter");
    __publicField$3(this, "baseUrl", "https://agentrouter.org/v1");
    __publicField$3(this, "apiKey");
    __publicField$3(this, "retryConfig");
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG$1, ...retryConfig };
  }
  getApiKey() {
    const key = process.env.NUXT_AGENTROUTER_API_KEY || process.env.AGENTROUTER_API_KEY;
    if (!key) {
      throw new AuthError("Agent Router API key not found. Please set NUXT_AGENTROUTER_API_KEY environment variable.");
    }
    return key;
  }
  async models() {
    var _a;
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      if (!response.ok) {
        throw new ProviderError(
          `Failed to fetch models: ${response.statusText}`,
          "models_fetch_failed",
          "server",
          true,
          response.status
        );
      }
      const data = await response.json();
      return ((_a = data.data) == null ? void 0 : _a.map((model) => model.id)) || [];
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Network error fetching models: ${error instanceof Error ? error.message : "Unknown error"}`,
        "network_error",
        "network",
        true
      );
    }
  }
  async request(params) {
    return this.withRetry(async () => {
      const agentRouterRequest = this.transformRequest(params);
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(agentRouterRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      const data = await response.json();
      return this.transformResponse(data, params.model);
    });
  }
  async stream(params, onChunk) {
    return this.withRetry(async () => {
      var _a, _b, _c, _d;
      const agentRouterRequest = {
        ...this.transformRequest(params),
        stream: true
      };
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(agentRouterRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      if (!reader) {
        throw new ProviderError(
          "Response body is not readable",
          "stream_error",
          "server",
          true
        );
      }
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = (_d = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta) == null ? void 0 : _d.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
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
  async healthCheck() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      }, 5e3);
      const latency = Date.now() - startTime;
      if (!response.ok) {
        return {
          status: "unhealthy",
          latency,
          lastChecked: /* @__PURE__ */ new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        status: "healthy",
        latency,
        lastChecked: /* @__PURE__ */ new Date(),
        rateLimit: remaining ? {
          remaining: parseInt(remaining),
          resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
        } : void 0
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - startTime,
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async validateApiKey() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async getRateLimit() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        remaining: remaining ? parseInt(remaining) : 0,
        resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
      };
    } catch {
      return { remaining: 0 };
    }
  }
  supportsStreaming() {
    return true;
  }
  supportsAttachments() {
    return false;
  }
  transformRequest(params) {
    var _a, _b, _c, _d, _e;
    const messages = params.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
      // Agent Router may not support attachments
    }));
    return {
      model: params.model || "gpt-3.5-turbo",
      // default fallback
      messages,
      temperature: (_a = params.temperature) != null ? _a : 0.7,
      max_tokens: (_b = params.maxTokens) != null ? _b : 1024,
      top_p: (_c = params.topP) != null ? _c : 0.9,
      frequency_penalty: (_d = params.frequencyPenalty) != null ? _d : 0,
      presence_penalty: (_e = params.presencePenalty) != null ? _e : 0,
      stream: false
      // handled separately in stream method
    };
  }
  transformResponse(data, requestedModel) {
    var _a, _b;
    const choice = (_a = data.choices) == null ? void 0 : _a[0];
    if (!choice) {
      throw new ProviderError(
        "Invalid response format from Agent Router",
        "invalid_response",
        "server",
        false
      );
    }
    const usage = data.usage;
    return {
      text: ((_b = choice.message) == null ? void 0 : _b.content) || "",
      tokens: usage ? {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      } : void 0,
      metadata: {
        model: data.model || requestedModel || "unknown",
        provider: "agentrouter",
        finishReason: choice.finish_reason,
        usage: data.usage
      }
    };
  }
  async handleErrorResponse(response) {
    var _a, _b;
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const message = ((_a = errorData.error) == null ? void 0 : _a.message) || response.statusText;
    const code = ((_b = errorData.error) == null ? void 0 : _b.code) || `http_${response.status}`;
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message);
    }
    if (response.status === 429) {
      const resetTime = response.headers.get("retry-after");
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1e3 : void 0);
    }
    if (response.status >= 500) {
      throw new ProviderError(message, code, "server", true, response.status);
    }
    throw new ProviderError(message, code, "unknown", false, response.status);
  }
  async makeRequest(endpoint, options, timeout) {
    const url = `${this.baseUrl}${endpoint}`;
    const fetchOptions = {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    };
    if (timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      fetchOptions.signal = controller.signal;
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    return fetch(url, fetchOptions);
  }
  async withRetry(operation) {
    let lastError;
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
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
    throw lastError;
  }
}

var __defProp$2 = Object.defineProperty;
var __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$2 = (obj, key, value) => __defNormalProp$2(obj, typeof key !== "symbol" ? key + "" : key, value);
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1e3,
  maxDelay: 1e4,
  backoffFactor: 2,
  jitter: true
};
class RoutewayAdapter {
  constructor(apiKey, retryConfig = {}) {
    __publicField$2(this, "providerId", "routeway");
    __publicField$2(this, "baseUrl", "https://api.routeway.ai/v1");
    __publicField$2(this, "apiKey");
    __publicField$2(this, "retryConfig");
    this.apiKey = apiKey || this.getApiKey();
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }
  getApiKey() {
    const key = process.env.NUXT_ROUTEWAY_API_KEY || process.env.ROUTEWAY_API_KEY;
    if (!key) {
      throw new AuthError("Routeway API key not found. Please set NUXT_ROUTEWAY_API_KEY environment variable.");
    }
    return key;
  }
  async models() {
    var _a;
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      if (!response.ok) {
        throw new ProviderError(
          `Failed to fetch models: ${response.statusText}`,
          "models_fetch_failed",
          "server",
          true,
          response.status
        );
      }
      const data = await response.json();
      return ((_a = data.data) == null ? void 0 : _a.map((model) => model.id)) || [];
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        `Network error fetching models: ${error instanceof Error ? error.message : "Unknown error"}`,
        "network_error",
        "network",
        true
      );
    }
  }
  async request(params) {
    return this.withRetry(async () => {
      const routewayRequest = this.transformRequest(params);
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(routewayRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      const data = await response.json();
      return this.transformResponse(data, params.model);
    });
  }
  async stream(params, onChunk) {
    return this.withRetry(async () => {
      var _a, _b, _c, _d;
      const routewayRequest = {
        ...this.transformRequest(params),
        stream: true
      };
      const response = await this.makeRequest("/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(routewayRequest)
      });
      if (!response.ok) {
        await this.handleErrorResponse(response);
        return;
      }
      const reader = (_a = response.body) == null ? void 0 : _a.getReader();
      if (!reader) {
        throw new ProviderError(
          "Response body is not readable",
          "stream_error",
          "server",
          true
        );
      }
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = (_d = (_c = (_b = parsed.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.delta) == null ? void 0 : _d.content;
                if (content) {
                  onChunk(content);
                }
              } catch (e) {
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
  async healthCheck() {
    const startTime = Date.now();
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      }, 5e3);
      const latency = Date.now() - startTime;
      if (!response.ok) {
        return {
          status: "unhealthy",
          latency,
          lastChecked: /* @__PURE__ */ new Date(),
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        status: "healthy",
        latency,
        lastChecked: /* @__PURE__ */ new Date(),
        rateLimit: remaining ? {
          remaining: parseInt(remaining),
          resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
        } : void 0
      };
    } catch (error) {
      return {
        status: "unhealthy",
        latency: Date.now() - startTime,
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async validateApiKey() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async getRateLimit() {
    try {
      const response = await this.makeRequest("/models", {
        method: "GET"
      });
      const remaining = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");
      return {
        remaining: remaining ? parseInt(remaining) : 0,
        resetTime: resetTime ? parseInt(resetTime) * 1e3 : void 0
      };
    } catch {
      return { remaining: 0 };
    }
  }
  supportsStreaming() {
    return true;
  }
  supportsAttachments() {
    return false;
  }
  transformRequest(params) {
    var _a, _b, _c, _d, _e;
    const messages = params.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
      // Routeway may not support attachments
    }));
    return {
      model: params.model || "gpt-3.5-turbo",
      // default fallback
      messages,
      temperature: (_a = params.temperature) != null ? _a : 0.7,
      max_tokens: (_b = params.maxTokens) != null ? _b : 1024,
      top_p: (_c = params.topP) != null ? _c : 0.9,
      frequency_penalty: (_d = params.frequencyPenalty) != null ? _d : 0,
      presence_penalty: (_e = params.presencePenalty) != null ? _e : 0,
      stream: false
      // handled separately in stream method
    };
  }
  transformResponse(data, requestedModel) {
    var _a, _b;
    const choice = (_a = data.choices) == null ? void 0 : _a[0];
    if (!choice) {
      throw new ProviderError(
        "Invalid response format from Routeway",
        "invalid_response",
        "server",
        false
      );
    }
    const usage = data.usage;
    return {
      text: ((_b = choice.message) == null ? void 0 : _b.content) || "",
      tokens: usage ? {
        input: usage.prompt_tokens || 0,
        output: usage.completion_tokens || 0,
        total: usage.total_tokens || 0
      } : void 0,
      metadata: {
        model: data.model || requestedModel || "unknown",
        provider: "routeway",
        finishReason: choice.finish_reason,
        usage: data.usage
      }
    };
  }
  async handleErrorResponse(response) {
    var _a, _b;
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
    }
    const message = ((_a = errorData.error) == null ? void 0 : _a.message) || response.statusText;
    const code = ((_b = errorData.error) == null ? void 0 : _b.code) || `http_${response.status}`;
    if (response.status === 401 || response.status === 403) {
      throw new AuthError(message);
    }
    if (response.status === 429) {
      const resetTime = response.headers.get("retry-after");
      throw new RateLimitError(message, resetTime ? parseInt(resetTime) * 1e3 : void 0);
    }
    if (response.status >= 500) {
      throw new ProviderError(message, code, "server", true, response.status);
    }
    throw new ProviderError(message, code, "unknown", false, response.status);
  }
  async makeRequest(endpoint, options, timeout) {
    const url = `${this.baseUrl}${endpoint}`;
    const fetchOptions = {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    };
    if (timeout) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      fetchOptions.signal = controller.signal;
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    return fetch(url, fetchOptions);
  }
  async withRetry(operation) {
    let lastError;
    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
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
    throw lastError;
  }
}

var __defProp$1 = Object.defineProperty;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, typeof key !== "symbol" ? key + "" : key, value);
class MockAdapter {
  constructor() {
    __publicField$1(this, "providerId", "mock");
    __publicField$1(this, "baseUrl", "http://localhost:3000/mock");
    __publicField$1(this, "apiKey", "mock-api-key");
    // Simulated response delays for realistic feel
    __publicField$1(this, "minDelay", 500);
    __publicField$1(this, "maxDelay", 2e3);
  }
  async models() {
    return [
      "mock/gpt-4o-mini",
      "mock/gpt-4o",
      "mock/claude-3-haiku",
      "mock/claude-3-sonnet"
    ];
  }
  async request(params) {
    await this.delay();
    const lastMessage = params.messages[params.messages.length - 1];
    const content = (lastMessage == null ? void 0 : lastMessage.content) || "";
    const response = this.generateResponse(content);
    return {
      text: response,
      tokens: {
        input: content.length / 4,
        output: response.length / 4,
        total: (content.length + response.length) / 4
      },
      metadata: {
        model: params.model || "mock/gpt-4o-mini",
        provider: "mock",
        finishReason: "stop"
      }
    };
  }
  async stream(params, onChunk) {
    const lastMessage = params.messages[params.messages.length - 1];
    const content = (lastMessage == null ? void 0 : lastMessage.content) || "";
    const response = this.generateResponse(content);
    const words = response.split(" ");
    const delayPerWord = Math.min(100, this.maxDelay / words.length);
    for (const word of words) {
      await this.delay(delayPerWord);
      onChunk(word + " ");
    }
  }
  async healthCheck() {
    return {
      status: "healthy",
      latency: 50,
      lastChecked: /* @__PURE__ */ new Date(),
      rateLimit: {
        remaining: 1e3
      }
    };
  }
  async validateApiKey() {
    return true;
  }
  async getRateLimit() {
    return { remaining: 1e3 };
  }
  supportsStreaming() {
    return true;
  }
  supportsAttachments() {
    return false;
  }
  generateResponse(input) {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      return "Hello! I'm a mock AI assistant running in development mode. How can I help you today?";
    }
    if (lowerInput.includes("help")) {
      return "I'm here to help! This is a mock response for testing purposes. In production, I would connect to real AI providers like OpenRouter, MegaLLM, or others.";
    }
    if (lowerInput.includes("weather")) {
      return "I don't have access to real-time weather data in mock mode. In production, I could help you find weather information through various tools and APIs.";
    }
    if (lowerInput.includes("code") || lowerInput.includes("programming")) {
      return "Here's a simple example in mock mode:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n```\n\nIn production, I'd provide more comprehensive coding assistance.";
    }
    if (lowerInput.includes("thank")) {
      return "You're welcome! I'm glad I could help. Remember, this is a mock response for development and testing purposes.";
    }
    return `I received your message: "${input}"

This is a mock response since no real AI provider API key is configured. To use real AI providers, please set one of the following environment variables:

- NUXT_OPENROUTER_API_KEY
- NUXT_MEGALLM_API_KEY
- NUXT_AGENTROUTER_API_KEY
- NUXT_ROUTEWAY_API_KEY

The mock provider allows you to test the chat interface and functionality without consuming real API credits.`;
  }
  delay(ms) {
    const delayMs = ms || this.minDelay + Math.random() * (this.maxDelay - this.minDelay);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const MODEL_REGISTRY = [
  // OpenRouter Models
  {
    id: "x-ai/grok-4.1-fast",
    name: "Grok 4.1 Fast",
    provider: "OpenRouter",
    providerId: "openrouter",
    description: "xAI's Grok model - fast and helpful",
    contextWindow: 128e3,
    maxTokens: 4096,
    capabilities: ["text", "reasoning", "coding"],
    status: "available",
    icon: "Bot",
    tags: ["xai", "grok", "fast"],
    priority: 1
  },
  {
    id: "z-ai/glm-4.5-air",
    name: "GLM-4.5 Air",
    provider: "OpenRouter",
    providerId: "openrouter",
    description: "Zhipu AI's GLM model - balanced performance",
    contextWindow: 128e3,
    maxTokens: 4096,
    capabilities: ["text", "multilingual", "reasoning"],
    status: "available",
    icon: "Brain",
    tags: ["zhipu", "glm", "balanced"],
    priority: 1
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek Chat v3",
    provider: "OpenRouter",
    providerId: "openrouter",
    description: "DeepSeek's advanced conversational AI",
    contextWindow: 32768,
    maxTokens: 4096,
    capabilities: ["text", "coding", "analysis"],
    status: "available",
    icon: "MessageSquare",
    tags: ["deepseek", "chat", "advanced"],
    priority: 1
  },
  {
    id: "qwen/qwen3-coder",
    name: "Qwen3 Coder",
    provider: "OpenRouter",
    providerId: "openrouter",
    description: "Alibaba's Qwen model specialized for coding",
    contextWindow: 32768,
    maxTokens: 4096,
    capabilities: ["text", "coding", "debugging"],
    status: "available",
    icon: "Code",
    tags: ["alibaba", "qwen", "coding"],
    priority: 1
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "OpenRouter",
    providerId: "openrouter",
    description: "Open-source GPT model with 20B parameters",
    contextWindow: 8192,
    maxTokens: 4096,
    capabilities: ["text", "reasoning"],
    status: "available",
    icon: "Zap",
    tags: ["openai", "gpt", "open-source"],
    priority: 1
  },
  {
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "OpenRouter",
    providerId: "openrouter",
    description: "Google's experimental Gemini model - fast and capable",
    contextWindow: 1048576,
    maxTokens: 4096,
    capabilities: ["text", "vision", "multimodal"],
    status: "available",
    icon: "Sparkles",
    tags: ["google", "gemini", "experimental", "vision"],
    priority: 1
  },
  // MegaLLM Models (placeholder - would be populated dynamically)
  {
    id: "megallm-gpt-4",
    name: "MegaLLM GPT-4",
    provider: "MegaLLM",
    providerId: "megallm",
    description: "GPT-4 through MegaLLM",
    contextWindow: 8192,
    maxTokens: 4096,
    capabilities: ["text", "reasoning"],
    status: "available",
    icon: "Brain",
    tags: ["megallm", "gpt-4"],
    priority: 2
  },
  // Agent Router Models (placeholder)
  {
    id: "agentrouter-claude",
    name: "Agent Router Claude",
    provider: "Agent Router",
    providerId: "agentrouter",
    description: "Claude through Agent Router",
    contextWindow: 1e5,
    maxTokens: 4096,
    capabilities: ["text", "analysis"],
    status: "available",
    icon: "Bot",
    tags: ["agentrouter", "claude"],
    priority: 2
  },
  // Routeway Models (placeholder)
  {
    id: "routeway-gemini",
    name: "Routeway Gemini",
    provider: "Routeway",
    providerId: "routeway",
    description: "Gemini through Routeway",
    contextWindow: 32768,
    maxTokens: 4096,
    capabilities: ["text", "multimodal"],
    status: "available",
    icon: "Sparkles",
    tags: ["routeway", "gemini"],
    priority: 2
  },
  // Mock Provider Models (for development/testing)
  {
    id: "mock/gpt-4o-mini",
    name: "Mock GPT-4o Mini",
    provider: "Mock",
    providerId: "mock",
    description: "Mock provider for development and testing",
    contextWindow: 128e3,
    maxTokens: 4096,
    capabilities: ["text", "reasoning", "coding"],
    status: "available",
    icon: "TestTube",
    tags: ["mock", "development", "testing"],
    priority: 99
  }
];
const PROVIDER_CONFIGS = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnvVar: "NUXT_OPENROUTER_API_KEY",
    models: MODEL_REGISTRY.filter((m) => m.providerId === "openrouter"),
    features: {
      streaming: true,
      attachments: true,
      functionCalling: false,
      vision: true
    },
    rateLimits: {
      requestsPerMinute: 50,
      requestsPerHour: 1e3,
      tokensPerMinute: 1e4
    }
  },
  megallm: {
    id: "megallm",
    name: "MegaLLM",
    baseUrl: "https://ai.megallm.io/v1",
    apiKeyEnvVar: "NUXT_MEGALLM_API_KEY",
    models: MODEL_REGISTRY.filter((m) => m.providerId === "megallm"),
    features: {
      streaming: true,
      attachments: false,
      functionCalling: false,
      vision: false
    },
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerHour: 1e3,
      tokensPerMinute: 15e3
    }
  },
  agentrouter: {
    id: "agentrouter",
    name: "Agent Router",
    baseUrl: "https://agentrouter.org/v1",
    apiKeyEnvVar: "NUXT_AGENTROUTER_API_KEY",
    models: MODEL_REGISTRY.filter((m) => m.providerId === "agentrouter"),
    features: {
      streaming: true,
      attachments: false,
      functionCalling: false,
      vision: false
    },
    rateLimits: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      tokensPerMinute: 8e3
    }
  },
  routeway: {
    id: "routeway",
    name: "Routeway",
    baseUrl: "https://api.routeway.ai/v1",
    apiKeyEnvVar: "NUXT_ROUTEWAY_API_KEY",
    models: MODEL_REGISTRY.filter((m) => m.providerId === "routeway"),
    features: {
      streaming: true,
      attachments: false,
      functionCalling: false,
      vision: false
    },
    rateLimits: {
      requestsPerMinute: 40,
      requestsPerHour: 800,
      tokensPerMinute: 12e3
    }
  },
  mock: {
    id: "mock",
    name: "Mock Provider",
    baseUrl: "http://localhost:3000/mock",
    apiKeyEnvVar: "MOCK_API_KEY",
    models: MODEL_REGISTRY.filter((m) => m.providerId === "mock"),
    features: {
      streaming: true,
      attachments: false,
      functionCalling: false,
      vision: false
    },
    rateLimits: {
      requestsPerMinute: 1e3,
      requestsPerHour: 1e4,
      tokensPerMinute: 1e5
    }
  }
};
function createProviderAdapter(providerId) {
  switch (providerId) {
    case "openrouter":
      return new OpenRouterAdapter();
    case "megallm":
      return new MegaLLMAdapter();
    case "agentrouter":
      return new AgentRouterAdapter();
    case "routeway":
      return new RoutewayAdapter();
    case "mock":
      return new MockAdapter();
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}
function createSafeProviderAdapter(providerId) {
  try {
    if (providerId !== "mock") {
      const config = PROVIDER_CONFIGS[providerId];
      if (config) {
        const apiKey = process.env[config.apiKeyEnvVar];
        if (!apiKey) {
          console.warn(`[Provider] ${providerId} API key not found (${config.apiKeyEnvVar}), falling back to mock provider`);
          return new MockAdapter();
        }
      }
    }
    return createProviderAdapter(providerId);
  } catch (error) {
    console.warn(`[Provider] Failed to create ${providerId} adapter, falling back to mock:`, error);
    return new MockAdapter();
  }
}
function detectProviderFromModel(modelId) {
  if (modelId.includes("megallm")) return "megallm";
  if (modelId.includes("agentrouter")) return "agentrouter";
  if (modelId.includes("routeway")) return "routeway";
  if (modelId.includes("mock")) return "mock";
  return "openrouter";
}
class ProviderHealthMonitor {
  constructor() {
    __publicField(this, "healthCache", /* @__PURE__ */ new Map());
    __publicField(this, "lastCheck", /* @__PURE__ */ new Map());
    __publicField(this, "CACHE_DURATION", 3e4);
  }
  // 30 seconds
  async getProviderHealth(providerId) {
    const now = Date.now();
    const lastCheck = this.lastCheck.get(providerId) || 0;
    if (now - lastCheck < this.CACHE_DURATION) {
      const cached = this.healthCache.get(providerId);
      if (cached) return cached;
    }
    try {
      const adapter = createProviderAdapter(providerId);
      const health = await adapter.healthCheck();
      this.healthCache.set(providerId, health);
      this.lastCheck.set(providerId, now);
      return health;
    } catch (error) {
      const unhealthyHealth = {
        status: "unknown",
        lastChecked: /* @__PURE__ */ new Date(),
        error: error instanceof Error ? error.message : "Unknown error"
      };
      this.healthCache.set(providerId, unhealthyHealth);
      this.lastCheck.set(providerId, now);
      return unhealthyHealth;
    }
  }
  async getAllProviderHealth() {
    const results = {};
    const providers = ["openrouter", "megallm", "agentrouter", "routeway"];
    await Promise.allSettled(
      providers.map(async (providerId) => {
        try {
          results[providerId] = await this.getProviderHealth(providerId);
        } catch (error) {
          results[providerId] = {
            status: "unknown",
            lastChecked: /* @__PURE__ */ new Date(),
            error: error instanceof Error ? error.message : "Health check failed"
          };
        }
      })
    );
    return results;
  }
  clearCache() {
    this.healthCache.clear();
    this.lastCheck.clear();
  }
}
new ProviderHealthMonitor();

export { MODEL_REGISTRY as M, PROVIDER_CONFIGS as P, createProviderAdapter as a, createSafeProviderAdapter as c, detectProviderFromModel as d };
//# sourceMappingURL=modelRegistry.mjs.map
