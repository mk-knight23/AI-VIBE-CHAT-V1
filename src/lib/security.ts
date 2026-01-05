// Security and Validation Utilities for CHUTES AI Chat v5
// OWASP Top 10 Compliance Enhanced Security

export interface SecurityConfig {
  maxMessageLength: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimitWindow: number; // milliseconds
  maxRequestsPerWindow: number;
  enableCSP: boolean;
  sanitizeHTML: boolean;
  enableCSRF: boolean;
  enableEncryption: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstSeen: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: string[];
}

export interface SecurityThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
}

class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /fetch\s*\(/gi,
    /XMLHttpRequest/gi
  ];

  constructor() {
    this.config = {
      maxMessageLength: 10000,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'application/pdf', 'text/plain', 'text/markdown', 'application/json',
        'text/javascript', 'text/typescript', 'text/jsx', 'text/tsx',
        'text/python', 'text/html', 'text/css', 'text/sql',
        'text/java', 'text/cpp', 'text/c', 'text/rust', 'text/go'
      ],
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 30,
      enableCSP: true,
      sanitizeHTML: true,
      enableCSRF: true,
      enableEncryption: true,
      sessionTimeout: 3600000, // 1 hour
      maxLoginAttempts: 5,
      lockoutDuration: 900000 // 15 minutes
    };
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Input Validation
  validateMessage(content: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
      threats: []
    };

    // Check message length
    if (content.length > this.config.maxMessageLength) {
      result.errors.push(`Message too long. Maximum ${this.config.maxMessageLength} characters allowed.`);
      result.valid = false;
    }

    // Check for empty message
    if (!content.trim()) {
      result.errors.push('Message cannot be empty.');
      result.valid = false;
    }

    // Check for suspicious patterns
    const suspiciousContent = this.detectSuspiciousContent(content);
    if (suspiciousContent.length > 0) {
      result.warnings.push('Message contains potentially suspicious content.');
    }

    // Check for excessive special characters
    const specialCharRatio = this.calculateSpecialCharRatio(content);
    if (specialCharRatio > 0.3) {
      result.warnings.push('Message contains many special characters.');
    }

    // Check for repeated characters (potential spam)
    if (this.hasExcessiveRepeatingChars(content)) {
      result.warnings.push('Message contains excessive repeating characters.');
    }

    return result;
  }

  validateFile(file: File): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
      threats: []
    };

    // Check file size
    if (file.size > this.config.maxFileSize) {
      result.errors.push(`File too large. Maximum ${this.config.maxFileSize / 1024 / 1024}MB allowed.`);
      result.valid = false;
    }

    // Check file type
    if (!this.config.allowedFileTypes.includes(file.type)) {
      // Check by extension as fallback
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'sql', 'java', 'cpp', 'c', 'rs', 'go'];
      
      if (!extension || !allowedExtensions.includes(extension)) {
        result.errors.push(`File type not allowed. Supported types: ${allowedExtensions.join(', ')}`);
        result.valid = false;
      }
    }

    // Check for suspicious file names
    if (this.isSuspiciousFileName(file.name)) {
      result.warnings.push('File name appears suspicious.');
    }

    // Check for executable files
    if (this.isExecutableFile(file.name)) {
      result.errors.push('Executable files are not allowed.');
      result.valid = false;
    }

    return result;
  }

  // Rate Limiting
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstSeen: now
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Reset window
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstSeen: now
      });
      return true;
    }

    if (entry.count >= this.config.maxRequestsPerWindow) {
      return false; // Rate limit exceeded
    }

    entry.count++;
    return true;
  }

  getRateLimitStatus(identifier: string): { remaining: number; resetTime: number } {
    const entry = this.rateLimitMap.get(identifier);
    if (!entry) {
      return { remaining: this.config.maxRequestsPerWindow, resetTime: Date.now() + this.config.rateLimitWindow };
    }

    return {
      remaining: Math.max(0, this.config.maxRequestsPerWindow - entry.count),
      resetTime: entry.resetTime
    };
  }

  // Content Sanitization
  sanitizeHTML(input: string): string {
    if (!this.config.sanitizeHTML) return input;

    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Remove eval() calls
    sanitized = sanitized.replace(/eval\s*\(/gi, '');
    
    // Remove dangerous object references
    sanitized = sanitized.replace(/document\./gi, '');
    sanitized = sanitized.replace(/window\./gi, '');
    
    return sanitized;
  }

  sanitizeUserInput(input: string): string {
    return this.sanitizeHTML(input.trim());
  }

  // Content Detection
  private detectSuspiciousContent(content: string): string[] {
    const detections: string[] = [];
    
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(content)) {
        detections.push(pattern.source);
      }
    }

    return detections;
  }

  private calculateSpecialCharRatio(content: string): number {
    const specialChars = content.match(/[^a-zA-Z0-9\s]/g);
    return specialChars ? specialChars.length / content.length : 0;
  }

  private hasExcessiveRepeatingChars(content: string): boolean {
    // Check for sequences of 5+ repeated characters
    return /(.)\1{4,}/.test(content);
  }

  private isSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
      /^\./,
      /\.\./,
      /[<>:"|?*]/,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  private isExecutableFile(fileName: string): boolean {
    const executableExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.rpm'];
    return executableExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  // Content Security Policy
  generateCSP(): string {
    if (!this.config.enableCSP) return '';

    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }

  // IP Blocking
  blockIP(ip: string, duration: number = 3600000): void { // 1 hour default
    this.blockedIPs.add(ip);
    setTimeout(() => {
      this.blockedIPs.delete(ip);
    }, duration);
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Enhanced Encryption Methods (AES-GCM)
  async encryptData(data: string, password?: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password || this.generateSecureToken(32)),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt))
    };
  }

  async decryptData(encryptedData: EncryptedData, password?: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password || this.generateSecureToken(32)),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const salt = new Uint8Array(atob(encryptedData.salt).split('').map(char => char.charCodeAt(0)));
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      const iv = new Uint8Array(atob(encryptedData.iv).split('').map(char => char.charCodeAt(0)));
      const data = new Uint8Array(atob(encryptedData.data).split('').map(char => char.charCodeAt(0)));
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      return decoder.decode(decryptedData);
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }

  // CSRF Protection
  generateCSRFToken(): string {
    return this.generateSecureToken(32);
  }

  validateCSRFToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  // Enhanced Input Validation for OWASP Top 10
  validateSQLInput(input: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
      threats: []
    };

    // SQL injection patterns
    const sqlPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      /((\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b))/i,
      /(UNION(.*?)SELECT)/i,
      /(SCRIPT)/i,
      /(<iframe|<script|<object|<embed)/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        result.threats.push('Potential SQL injection detected');
        result.riskLevel = 'high';
        result.valid = false;
        result.errors.push('Input contains potentially malicious SQL patterns');
      }
    }

    return result;
  }

  // XSS Protection Enhancement
  validateXSSInput(input: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
      threats: []
    };

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<\s*img[^>]*src\s*=\s*["']javascript:/gi,
      /<\s*link[^>]*href\s*=\s*["']javascript:/gi,
      /<\s*style[^>]*>.*?<\/style>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        result.threats.push('Potential XSS attack detected');
        result.riskLevel = 'critical';
        result.valid = false;
        result.errors.push('Input contains potentially malicious XSS patterns');
      }
    }

    return result;
  }

  // Security Headers Generation
  generateSecurityHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.generateCSP(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }

  // Data Classification
  classifyData(data: string): 'public' | 'internal' | 'confidential' | 'restricted' {
    const sensitivePatterns = [
      /password|passwd|pass/i,
      /credit\s*card|card\s*number|cvv|cvc/i,
      /ssn|social\s*security/i,
      /api\s*key|secret\s*key|token/i,
      /email.*@.*\..*/i,
      /phone\s*number|telephone/i
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(data)) {
        return 'restricted';
      }
    }

    // Check for internal data patterns
    const internalPatterns = [
      /internal|private|confidential/i,
      /employee|staff|hr/i,
      /financial|revenue|profit/i
    ];

    for (const pattern of internalPatterns) {
      if (pattern.test(data)) {
        return 'confidential';
      }
    }

    return 'public';
  }

  // Enhanced Rate Limiting with Intelligence
  checkAdvancedRateLimit(identifier: string, action: string): { allowed: boolean; remaining: number; resetTime: number; riskScore: number } {
    const now = Date.now();
    const key = `${identifier}:${action}`;
    const entry = this.rateLimitMap.get(key);

    let riskScore = 0;
    
    if (!entry) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstSeen: now
      });
      return { allowed: true, remaining: this.config.maxRequestsPerWindow - 1, resetTime: now + this.config.rateLimitWindow, riskScore: 0 };
    }

    if (now > entry.resetTime) {
      // Reset window
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
        firstSeen: now
      });
      return { allowed: true, remaining: this.config.maxRequestsPerWindow - 1, resetTime: now + this.config.rateLimitWindow, riskScore: 0 };
    }

    // Calculate risk score based on request patterns
    const timeSpan = now - entry.firstSeen;
    const requestsPerSecond = (entry.count / timeSpan) * 1000;
    
    if (requestsPerSecond > 10) riskScore += 30;
    if (entry.count > this.config.maxRequestsPerWindow * 0.8) riskScore += 20;
    if (timeSpan < 1000) riskScore += 25; // Very fast requests

    const remaining = Math.max(0, this.config.maxRequestsPerWindow - entry.count);
    const allowed = entry.count < this.config.maxRequestsPerWindow && riskScore < 50;

    if (allowed) {
      entry.count++;
    }

    return { allowed, remaining, resetTime: entry.resetTime, riskScore };
  }

  // Utility Methods
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
    
    return result;
  }

  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || this.generateSecureToken(16);
    const encoder = new TextEncoder();
    const data = encoder.encode(password + actualSalt);
    
    // Simple hash (in production, use a proper hashing library like bcrypt)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return {
      hash: Math.abs(hash).toString(16),
      salt: actualSalt
    };
  }

  // Cleanup
  cleanup(): void {
    const now = Date.now();
    
    // Clean up expired rate limit entries
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }
}

export const security = SecurityManager.getInstance();

// React Hook for Security
export function useSecurity() {
  return {
    // Basic validation
    validateMessage: security.validateMessage.bind(security),
    validateFile: security.validateFile.bind(security),
    validateSQLInput: security.validateSQLInput.bind(security),
    validateXSSInput: security.validateXSSInput.bind(security),
    
    // Rate limiting
    checkRateLimit: security.checkRateLimit.bind(security),
    getRateLimitStatus: security.getRateLimitStatus.bind(security),
    checkAdvancedRateLimit: security.checkAdvancedRateLimit.bind(security),
    
    // Sanitization and security
    sanitizeInput: security.sanitizeUserInput.bind(security),
    generateCSP: security.generateCSP.bind(security),
    generateSecurityHeaders: security.generateSecurityHeaders.bind(security),
    
    // Encryption and protection
    encryptData: security.encryptData.bind(security),
    decryptData: security.decryptData.bind(security),
    generateCSRFToken: security.generateCSRFToken.bind(security),
    validateCSRFToken: security.validateCSRFToken.bind(security),
    
    // IP management
    blockIP: security.blockIP.bind(security),
    isIPBlocked: security.isIPBlocked.bind(security),
    
    // Data classification
    classifyData: security.classifyData.bind(security),
    
    // Configuration
    updateConfig: security.updateConfig.bind(security),
    getConfig: security.getConfig.bind(security),
    
    // Utilities
    generateSecureToken: security.generateSecureToken.bind(security),
    hashPassword: security.hashPassword.bind(security),
    cleanup: security.cleanup.bind(security)
  };
}