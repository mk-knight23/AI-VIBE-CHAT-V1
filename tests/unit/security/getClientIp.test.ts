/**
 * Security Tests for Client IP Extraction
 *
 * Tests for secure IP address extraction to prevent spoofing
 */

import { describe, it, expect } from "vitest";
import { getClientIp } from "../../app/server/utils/getClientIp";

// Mock H3Event for testing
function createMockEvent(
  headers: Record<string, string> = {},
  remoteAddress?: string,
) {
  return {
    node: {
      req: {
        headers,
        socket: {
          remoteAddress,
        },
      },
    },
  } as any;
}

describe("Client IP Security", () => {
  describe("IP Validation", () => {
    it("should accept valid IPv4 addresses", () => {
      const event = createMockEvent({ "x-forwarded-for": "192.168.1.1" });
      const ip = getClientIp(event);
      expect(ip).toBe("192.168.1.1");
    });

    it("should accept valid public IPv4 addresses", () => {
      const event = createMockEvent({ "x-real-ip": "8.8.8.8" });
      const ip = getClientIp(event);
      expect(ip).toBe("8.8.8.8");
    });

    it("should reject invalid IP addresses", () => {
      const event = createMockEvent({ "x-forwarded-for": "not-an-ip" });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should reject IP addresses with invalid octets", () => {
      const event = createMockEvent({ "x-forwarded-for": "999.999.999.999" });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should prefer direct connection address", () => {
      const event = createMockEvent(
        { "x-forwarded-for": "1.2.3.4" },
        "5.6.7.8",
      );
      const ip = getClientIp(event);
      expect(ip).toBe("5.6.7.8");
    });

    it("should handle x-forwarded-for with multiple IPs", () => {
      const event = createMockEvent({
        "x-forwarded-for": "1.2.3.4, 5.6.7.8, 9.10.11.12",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("1.2.3.4");
    });

    it("should skip private IPs in x-forwarded-for chain", () => {
      const event = createMockEvent({
        "x-forwarded-for": "192.168.1.1, 8.8.8.8",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("8.8.8.8");
    });

    it("should use x-real-ip when available", () => {
      const event = createMockEvent({
        "x-real-ip": "1.2.3.4",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("1.2.3.4");
    });

    it("should handle Cloudflare connecting IP", () => {
      const event = createMockEvent({
        "cf-connecting-ip": "1.2.3.4",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("1.2.3.4");
    });

    it("should return anonymous when no valid IP found", () => {
      const event = createMockEvent({});
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should reject localhost IPs from x-real-ip", () => {
      const event = createMockEvent({
        "x-real-ip": "127.0.0.1",
      });
      const ip = getClientIp(event);
      // Falls back to anonymous since private IPs are rejected from headers
      expect(ip).toBe("anonymous");
    });

    it("should handle IPv6 addresses", () => {
      const event = createMockEvent({
        "x-forwarded-for": "2001:4860:4860::8888",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("2001:4860:4860::8888");
    });

    it("should handle IPv6 localhost", () => {
      const event = createMockEvent({
        "x-forwarded-for": "::1",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });
  });

  describe("Header Injection Prevention", () => {
    it("should not accept IPs with null bytes", () => {
      const event = createMockEvent({
        "x-forwarded-for": "1.2.3.4\x00.com",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should not accept IP with newline injection", () => {
      const event = createMockEvent({
        "x-forwarded-for": "1.2.3.4\nX-Another: header",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should not accept IP with carriage return injection", () => {
      const event = createMockEvent({
        "x-real-ip": "1.2.3.4\rX-Injected: true",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should handle empty string headers", () => {
      const event = createMockEvent({
        "x-forwarded-for": "",
        "x-real-ip": "",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });

    it("should handle whitespace-only headers", () => {
      const event = createMockEvent({
        "x-forwarded-for": "   ",
      });
      const ip = getClientIp(event);
      expect(ip).toBe("anonymous");
    });
  });
});
