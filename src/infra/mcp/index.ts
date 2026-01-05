/**
 * Model Context Protocol (MCP) Server Implementation
 * CHUTES AI Chat v5 - Enterprise Edition
 */

import { z } from 'zod';
import type { 
  MCPTool, 
  ToolResponse, 
  MCPSession, 
  MCPSessionContext,
  MCPServerConfig,
  ToolRegistry 
} from './types';
import { fileSystemTools } from './tools/filesystem';
import { calculatorTools } from './tools/calculator';
import { webTools } from './tools/web';

// ============================================================================
// Tool Registry Implementation
// ============================================================================

class ToolRegistryImpl implements ToolRegistry {
  tools: Map<string, MCPTool> = new Map();
  categories: Map<string, string[]> = new Map();
  permissions: Map<string, string[]> = new Map();

  register(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    
    // Add to category
    const category = tool.tags?.[0] || 'uncategorized';
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(tool.name);
    
    // Set permissions
    this.permissions.set(tool.name, tool.tags || []);
  }

  unregister(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;
    
    this.tools.delete(name);
    
    // Remove from categories
    for (const [, tools] of this.categories) {
      const index = tools.indexOf(name);
      if (index !== -1) tools.splice(index, 1);
    }
    
    this.permissions.delete(name);
    return true;
  }

  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  list(category?: string): MCPTool[] {
    if (category) {
      const toolNames = this.categories.get(category) || [];
      return toolNames.map(name => this.tools.get(name)!).filter(Boolean);
    }
    return Array.from(this.tools.values());
  }

  categoriesList(): string[] {
    return Array.from(this.categories.keys());
  }
}

// ============================================================================
// Session Manager Implementation
// ============================================================================

class SessionManagerImpl {
  sessions: Map<string, MCPSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  create(userId?: string): MCPSession {
    const session: MCPSession = {
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      context: {
        variables: new Map(),
        history: [],
        permissions: [],
      },
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  get(sessionId: string): MCPSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  update(sessionId: string, updates: Partial<MCPSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date();
    }
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  list(userId?: string): MCPSession[] {
    if (userId) {
      return Array.from(this.sessions.values()).filter(s => s.userId === userId);
    }
    return Array.from(this.sessions.values());
  }

  cleanupExpired(maxAgeMs: number): number {
    const now = Date.now();
    let count = 0;
    
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > maxAgeMs) {
        this.sessions.delete(id);
        count++;
      }
    }
    
    return count;
  }

  startCleanup(maxAgeMs: number, intervalMs: number = 60000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired(maxAgeMs);
    }, intervalMs);
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ============================================================================
// MCP Server Implementation
// ============================================================================

export class MCPServer {
  private registry: ToolRegistryImpl;
  private sessionManager: SessionManagerImpl;
  private config: MCPServerConfig;
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config?: Partial<MCPServerConfig>) {
    this.registry = new ToolRegistryImpl();
    this.sessionManager = new SessionManagerImpl();
    this.config = {
      name: config?.name || 'CHUTES MCP Server',
      version: config?.version || '1.0.0',
      capabilities: {
        tools: true,
        resources: true,
        prompts: true,
        ...config?.capabilities,
      },
      serverInfo: {
        name: config?.serverInfo?.name || 'chutes-mcp',
        version: config?.serverInfo?.version || '1.0.0',
      },
      settings: {
        maxConcurrentTools: 10,
        toolTimeout: 30000,
        enableRateLimiting: true,
        rateLimit: {
          windowMs: 60000,
          maxRequests: 100,
        },
        allowedDirectories: ['.'],
        blockedPatterns: ['**/.*', '**/node_modules/**', '**/dist/**'],
        ...config?.settings,
      },
    };
    
    this.registerDefaultTools();
  }

  private registerDefaultTools(): void {
    // Register file system tools
    for (const tool of fileSystemTools) {
      this.registry.register(tool);
    }
    
    // Register calculator tools
    for (const tool of calculatorTools) {
      this.registry.register(tool);
    }
    
    // Register web tools
    for (const tool of webTools) {
      this.registry.register(tool);
    }
  }

  // Tool Registration
  registerTool(tool: MCPTool): void {
    this.registry.register(tool);
  }

  unregisterTool(name: string): boolean {
    return this.registry.unregister(name);
  }

  getTool(name: string): MCPTool | undefined {
    return this.registry.get(name);
  }

  listTools(category?: string): MCPTool[] {
    return this.registry.list(category);
  }

  listCategories(): string[] {
    return this.registry.categoriesList();
  }

  // Session Management
  createSession(userId?: string): MCPSession {
    return this.sessionManager.create(userId);
  }

  getSession(sessionId: string): MCPSession | undefined {
    return this.sessionManager.get(sessionId);
  }

  // Tool Execution
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    sessionId?: string
  ): Promise<ToolResponse> {
    // Check rate limit
    if (this.config.settings.enableRateLimiting) {
      const clientId = sessionId || 'anonymous';
      if (!this.checkRateLimit(clientId)) {
        return {
          content: [{ type: 'error', text: 'Rate limit exceeded. Please try again later.' }],
          isError: true,
        };
      }
    }
    
    // Get tool
    const tool = this.registry.get(toolName);
    if (!tool) {
      return {
        content: [{ type: 'error', text: `Tool not found: ${toolName}` }],
        isError: true,
      };
    }
    
    // Validate input
    try {
      const parsedArgs = tool.inputSchema.parse(args) as Record<string, unknown>;
      
      // Execute tool
      const startTime = Date.now();
      const response = await Promise.race([
        tool.handler(parsedArgs),
        new Promise<ToolResponse>((_, reject) => 
          setTimeout(() => reject(new Error('Tool execution timeout')), this.config.settings.toolTimeout)
        ),
      ]);
      
      // Update session history if provided
      if (sessionId) {
        const session = this.sessionManager.get(sessionId);
        if (session) {
          session.context.history.push({
            tool: toolName,
            input: parsedArgs,
            output: response,
            timestamp: new Date(),
          });
        }
      }
      
      return response;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string }> };
        return {
          content: [{ 
            type: 'error', 
            text: `Invalid arguments: ${zodError.errors.map(e => e.message).join(', ')}` 
          }],
          isError: true,
        };
      }
      
      return {
        content: [{ 
          type: 'error', 
          text: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}` 
        }],
        isError: true,
      };
    }
  }

  // Rate Limiting
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const limit = this.config.settings.rateLimit!;
    const clientData = this.rateLimiter.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      this.rateLimiter.set(clientId, { count: 1, resetTime: now + limit.windowMs });
      return true;
    }
    
    if (clientData.count >= limit.maxRequests) {
      return false;
    }
    
    clientData.count++;
      return true;
  }

  // Server Info
  getServerInfo(): MCPServerConfig['serverInfo'] {
    return this.config.serverInfo;
  }

  getCapabilities(): MCPServerConfig['capabilities'] {
    return this.config.capabilities;
  }

  // Cleanup
  cleanup(maxAgeMs: number = 3600000): number {
    return this.sessionManager.cleanupExpired(maxAgeMs);
  }

  startSessionCleanup(maxAgeMs: number = 3600000, intervalMs: number = 60000): void {
    this.sessionManager.startCleanup(maxAgeMs, intervalMs);
  }

  stopSessionCleanup(): void {
    this.sessionManager.stopCleanup();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createMCPServer(config?: Partial<MCPServerConfig>): MCPServer {
  return new MCPServer(config);
}

export function createToolRegistry(): ToolRegistryImpl {
  return new ToolRegistryImpl();
}

export function createSessionManager(): SessionManagerImpl {
  return new SessionManagerImpl();
}

// ============================================================================
// Default Server Instance
// ============================================================================

let defaultServer: MCPServer | null = null;

export function getDefaultServer(): MCPServer {
  if (!defaultServer) {
    defaultServer = createMCPServer();
  }
  return defaultServer;
}

export function resetDefaultServer(): void {
  if (defaultServer) {
    defaultServer.stopSessionCleanup();
    defaultServer = null;
  }
}

// ============================================================================
// Export Types
// ============================================================================

export type { MCPTool, ToolResponse, MCPSession, MCPSessionContext, ToolRegistry } from './types';

export default MCPServer;
