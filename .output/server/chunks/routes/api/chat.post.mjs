import { d as defineEventHandler, c as createError, r as readBody, s as setHeader, a as sendStream } from '../../nitro/nitro.mjs';
import { d as detectProviderFromModel, c as createSafeProviderAdapter } from '../../_/modelRegistry.mjs';
import { z } from 'zod';
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

function isValidIP(ip) {
  if (!ip || typeof ip !== "string") {
    return false;
  }
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  if (ipv4Regex.test(ip)) {
    const octets = ip.split(".");
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  if (ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isPrivateIP(ip) {
  if (!isValidIP(ip)) {
    return false;
  }
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/
  ];
  return privateRanges.some((range) => range.test(ip));
}
function getClientIp(event) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
  try {
    const nodeContext = (_c = (_b = (_a = event.node) == null ? void 0 : _a.req) == null ? void 0 : _b.socket) == null ? void 0 : _c.remoteAddress;
    if (nodeContext && isValidIP(nodeContext)) {
      return nodeContext;
    }
  } catch {
  }
  const realIP = (_e = (_d = event.node) == null ? void 0 : _d.req) == null ? void 0 : _e.headers["x-real-ip"];
  if (realIP && typeof realIP === "string") {
    const ip = realIP.trim();
    if (isValidIP(ip) && !isPrivateIP(ip)) {
      return ip;
    }
  }
  const forwardedFor = (_g = (_f = event.node) == null ? void 0 : _f.req) == null ? void 0 : _g.headers["x-forwarded-for"];
  if (forwardedFor && typeof forwardedFor === "string") {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    for (const ip of ips) {
      if (isValidIP(ip) && !isPrivateIP(ip)) {
        return ip;
      }
    }
  }
  const cfIP = (_i = (_h = event.node) == null ? void 0 : _h.req) == null ? void 0 : _i.headers["cf-connecting-ip"];
  if (cfIP && typeof cfIP === "string") {
    const ip = cfIP.trim();
    if (isValidIP(ip)) {
      return ip;
    }
  }
  const headers = [
    (_k = (_j = event.node) == null ? void 0 : _j.req) == null ? void 0 : _k.headers["x-client-ip"],
    (_m = (_l = event.node) == null ? void 0 : _l.req) == null ? void 0 : _m.headers["x-forwarded"],
    (_o = (_n = event.node) == null ? void 0 : _n.req) == null ? void 0 : _o.headers["forwarded-for"],
    (_q = (_p = event.node) == null ? void 0 : _p.req) == null ? void 0 : _q.headers["forwarded"]
  ];
  for (const header of headers) {
    if (header && typeof header === "string") {
      const ip = header.trim();
      if (isValidIP(ip)) {
        return ip;
      }
    }
  }
  return "anonymous";
}

const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "function"], {
    errorMap: () => ({ message: "Invalid message role. Must be one of: system, user, assistant, function" })
  }),
  content: z.string().min(1, "Message content cannot be empty").max(5e4, "Message content exceeds maximum length of 50000 characters").refine(
    (content) => {
      if (content.includes("\0")) {
        return false;
      }
      return true;
    },
    { message: "Message content contains invalid characters" }
  ),
  name: z.string().optional(),
  functionCall: z.any().optional()
  // Allow for function call objects
});
const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message is required").max(100, "Cannot process more than 100 messages in a single request").refine(
    (messages) => {
      const firstMsg = messages[0];
      return firstMsg.role === "user" || firstMsg.role === "system";
    },
    { message: "First message must be from user or system" }
  ),
  model: z.string().min(1, "Model name cannot be empty").max(100, "Model name exceeds maximum length").regex(/^[a-zA-Z0-9/_-]+$/, "Model name contains invalid characters").optional(),
  temperature: z.number().min(0, "Temperature must be at least 0").max(2, "Temperature must be at most 2").optional(),
  maxTokens: z.number().int("Max tokens must be an integer").positive("Max tokens must be positive").max(32e3, "Max tokens cannot exceed 32000").optional(),
  topP: z.number().min(0, "Top P must be at least 0").max(1, "Top P must be at most 1").optional(),
  stream: z.boolean().optional(),
  stop: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  presencePenalty: z.number().min(-2, "Presence penalty must be at least -2").max(2, "Presence penalty must be at most 2").optional(),
  frequencyPenalty: z.number().min(-2, "Frequency penalty must be at least -2").max(2, "Frequency penalty must be at most 2").optional()
});
function sanitizeMessageContent(content) {
  let sanitized = content.replace(/\0/g, "");
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  sanitized = sanitized.replace(/[ \t]{20,}/g, "                    ");
  return sanitized;
}
function validateChatRequest(data) {
  try {
    const result = chatRequestSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message
      }));
      return {
        success: false,
        errors,
        data: null
      };
    }
    const sanitized = {
      ...result.data,
      messages: result.data.messages.map((msg) => ({
        ...msg,
        content: sanitizeMessageContent(msg.content)
      }))
    };
    return {
      success: true,
      errors: null,
      data: sanitized
    };
  } catch (error) {
    return {
      success: false,
      errors: [{ field: "unknown", message: "Validation failed" }],
      data: null
    };
  }
}

const chat_post = defineEventHandler(async (event) => {
  var _a;
  try {
    const clientId = getClientIp(event);
    const rateLimitResult = rateLimiter.checkLimit(clientId, "chat");
    if (!rateLimitResult.allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: "Rate limit exceeded. Please try again later."
      });
    }
    const rawBody = await readBody(event);
    const validation = validateChatRequest(rawBody);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${(_a = validation.errors) == null ? void 0 : _a.map((e) => e.message).join(", ")} || 'Invalid request'`
      });
    }
    const body = validation.data;
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
            const doneData = JSON.stringify({
              content: fullContent,
              done: true
            });
            controller.enqueue(encoder.encode(`data: ${doneData}

`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Streaming error";
            const errorData = JSON.stringify({
              error: errorMessage,
              done: true
            });
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
