/**
 * Get the real client IP address from the request
 *
 * This function safely extracts the client IP address from various headers
 * that may be set by proxies/load balancers. It validates the IP format
 * to prevent header injection attacks.
 *
 * Security considerations:
 * - Validates IP address format before accepting
 * - Prefers direct connection address when available
 * - Handles X-Forwarded-For chain (leftmost is original client)
 * - Rejects invalid/private IPs in certain contexts
 */

import type { H3Event } from 'h3'

/**
 * Check if a string is a valid IP address (IPv4 or IPv6)
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false
  }

  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/

  if (ipv4Regex.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split('.')
    return octets.every(octet => {
      const num = parseInt(octet, 10)
      return num >= 0 && num <= 255
    })
  }

  if (ipv6Regex.test(ip)) {
    return true
  }

  return false
}

/**
 * Check if an IP is a private/internal address
 */
function isPrivateIP(ip: string): boolean {
  if (!isValidIP(ip)) {
    return false
  }

  // IPv4 private ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ]

  return privateRanges.some(range => range.test(ip))
}

/**
 * Extract and validate the real client IP from the event
 *
 * Priority order:
 * 1. Direct connection address (most reliable)
 * 2. X-Real-IP (set by trusted reverse proxy)
 * 3. X-Forwarded-For (leftmost IP is original client)
 * 4. CF-Connecting-IP (Cloudflare)
 * 5. Fall back to 'anonymous' if none found
 *
 * @param event - H3 event object
 * @returns Validated client IP address or 'anonymous'
 */
export function getClientIp(event: H3Event): string {
  // Try to get the direct connection address (Node.jsRequest.node.req.socket.remoteAddress)
  try {
    const nodeContext = event.node?.req?.socket?.remoteAddress
    if (nodeContext && isValidIP(nodeContext)) {
      return nodeContext
    }
  } catch {
    // Continue to header checks
  }

  // Check X-Real-IP header (set by nginx, apache, etc.)
  const realIP = event.node?.req?.headers['x-real-ip']
  if (realIP && typeof realIP === 'string') {
    const ip = realIP.trim()
    if (isValidIP(ip) && !isPrivateIP(ip)) {
      return ip
    }
  }

  // Check X-Forwarded-For header
  // This header contains a comma-separated list: client, proxy1, proxy2
  // The leftmost is the original client
  const forwardedFor = event.node?.req?.headers['x-forwarded-for']
  if (forwardedFor && typeof forwardedFor === 'string') {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    for (const ip of ips) {
      if (isValidIP(ip) && !isPrivateIP(ip)) {
        return ip
      }
    }
  }

  // Check Cloudflare connecting IP
  const cfIP = event.node?.req?.headers['cf-connecting-ip']
  if (cfIP && typeof cfIP === 'string') {
    const ip = cfIP.trim()
    if (isValidIP(ip)) {
      return ip
    }
  }

  // Check other common headers
  const headers = [
    event.node?.req?.headers['x-client-ip'],
    event.node?.req?.headers['x-forwarded'],
    event.node?.req?.headers['forwarded-for'],
    event.node?.req?.headers['forwarded'],
  ]

  for (const header of headers) {
    if (header && typeof header === 'string') {
      const ip = header.trim()
      if (isValidIP(ip)) {
        return ip
      }
    }
  }

  // Fall back to anonymous if no valid IP found
  return 'anonymous'
}

/**
 * Get a rate limit key for the client
 * Combines IP with optional user ID for more accurate rate limiting
 */
export function getRateLimitKey(event: H3Event, userId?: string): string {
  const ip = getClientIp(event)
  return userId ? `${ip}:${userId}` : ip
}
