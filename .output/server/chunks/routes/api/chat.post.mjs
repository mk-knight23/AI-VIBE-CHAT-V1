import { d as defineEventHandler, g as getHeader, c as createError, r as readBody, s as setHeader, a as sendStream } from '../../nitro/nitro.mjs';
import { d as detectProviderFromModel, c as createSafeProviderAdapter } from '../../_/modelRegistry.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const rateLimiters = /* @__PURE__ */ new Map();
function cleanupRateLimiters(maxAge = 36e5) {
  for (const limiter of rateLimiters.values()) {
    limiter.cleanup(maxAge);
  }
}
{
  setInterval(() => {
    cleanupRateLimiters();
  }, 3e5);
}
class GlobalRateLimiter {
  constructor() {
    __publicField(this, "requests", /* @__PURE__ */ new Map());
    __publicField(this, "windowMs", 6e4);
    // 1 minute
    __publicField(this, "maxRequests", 50);
  }
  // 50 requests per minute
  checkLimit(key, _type) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);
    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      this.requests.set(key, timestamps);
      return { allowed: true };
    }
    const resetTime = timestamps[0] + this.windowMs;
    return { allowed: false, resetTime };
  }
}
const rateLimiter = new GlobalRateLimiter();

const chat_post = defineEventHandler(async (event) => {
  try {
    const clientId = getHeader(event, "x-forwarded-for") || "anonymous";
    const rateLimitResult = rateLimiter.checkLimit(clientId, "chat");
    if (!rateLimitResult.allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: "Rate limit exceeded. Please try again later."
      });
    }
    const body = await readBody(event);
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid request: messages array required"
      });
    }
    const model = body.model || "openai/gpt-4o-mini";
    const provider = detectProviderFromModel(model);
    const adapter = createSafeProviderAdapter(provider);
    if (body.stream) {
      setHeader(event, "Content-Type", "text/event-stream");
      setHeader(event, "Cache-Control", "no-cache");
      setHeader(event, "Connection", "keep-alive");
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullContent = "";
            await adapter.stream(body, (chunk) => {
              fullContent += chunk;
              const data = JSON.stringify({ content: chunk, done: false });
              controller.enqueue(encoder.encode(`data: ${data}

`));
            });
            const doneData = JSON.stringify({ content: fullContent, done: true });
            controller.enqueue(encoder.encode(`data: ${doneData}

`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Streaming error";
            const errorData = JSON.stringify({ error: errorMessage, done: true });
            controller.enqueue(encoder.encode(`data: ${errorData}

`));
            controller.close();
          }
        }
      });
      return sendStream(event, stream);
    }
    const response = await adapter.request(body);
    if (response.error) {
      throw createError({
        statusCode: 500,
        statusMessage: response.error.message
      });
    }
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("Chat API error:", error);
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Internal server error"
    });
  }
});

export { chat_post as default };
//# sourceMappingURL=chat.post.mjs.map
