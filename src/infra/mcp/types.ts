/**
 * Model Context Protocol (MCP) Server Types
 * CHUTES AI Chat v5 - Enterprise Edition
 */

import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  handler: ToolHandler;
  tags?: string[];
  examples?: Array<{ description: string; args: Record<string, unknown> }>;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResponse>;

export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource' | 'error';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPRequest extends MCPMessage {
  method: 'tools/list' | 'tools/call' | 'resources/list' | 'resources/read' | 'prompts/list' | 'prompts/get';
}

export interface MCPResponse extends MCPMessage {
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ============================================================================
// File System Tool Types
// ============================================================================

export interface FileReadParams {
  path: string;
  encoding?: 'utf-8' | 'base64' | 'binary';
  maxSize?: number;
}

export interface FileWriteParams {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
  mode?: number;
}

export interface FileSearchParams {
  pattern: string;
  path?: string;
  recursive?: boolean;
  maxResults?: number;
  fileType?: string;
}

export interface FileListParams {
  path: string;
  recursive?: boolean;
  includeHidden?: boolean;
}

export interface FileInfo {
  path: string;
  size: number;
  isDirectory: boolean;
  permissions: string;
  createdAt: Date;
  modifiedAt: Date;
}

// ============================================================================
// Database Tool Types
// ============================================================================

export interface DatabaseQueryParams {
  connectionString: string;
  query: string;
  parameters?: unknown[];
  timeout?: number;
}

export interface DatabaseSchemaParams {
  connectionString: string;
  tableName?: string;
}

export interface DatabaseRecord {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
}

// ============================================================================
// Web Tool Types
// ============================================================================

export interface WebSearchParams {
  query: string;
  engine?: 'google' | 'bing' | 'duckduckgo';
  numResults?: number;
  timeout?: number;
}

export interface WebScrapeParams {
  url: string;
  selector?: string;
  extractText?: boolean;
  timeout?: number;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

// ============================================================================
// Calculator Tool Types
// ============================================================================

export interface CalculatorParams {
  expression: string;
  precision?: number;
}

export interface StatisticsParams {
  data: number[];
  operation: 'mean' | 'median' | 'mode' | 'stddev' | 'variance' | 'min' | 'max' | 'sum' | 'percentile';
  percentile?: number;
}

// ============================================================================
// API Tool Types
// ============================================================================

export interface APIRequestParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'apiKey';
    credentials: Record<string, string>;
  };
}

export interface APIResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  responseTime: number;
}

// ============================================================================
// Custom Tool Types
// ============================================================================

export interface CustomToolDefinition {
  name: string;
  description: string;
  schema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
      enum?: unknown[];
    }>;
    required?: string[];
  };
  code: string;
  language: 'javascript' | 'python';
  permissions?: string[];
}

export interface CustomToolExecutionContext {
  variables: Record<string, unknown>;
  secrets: Record<string, string>;
  files: Record<string, string>;
}

// ============================================================================
// Tool Registry Types
// ============================================================================

export interface ToolRegistry {
  tools: Map<string, MCPTool>;
  categories: Map<string, string[]>;
  permissions: Map<string, string[]>;
  
  register(tool: MCPTool): void;
  unregister(name: string): boolean;
  get(name: string): MCPTool | undefined;
  list(category?: string): MCPTool[];
  categoriesList(): string[];
}

// ============================================================================
// Server Configuration Types
// ============================================================================

export interface MCPServerConfig {
  name: string;
  version: string;
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  serverInfo: {
    name: string;
    version: string;
  };
  settings: {
    maxConcurrentTools?: number;
    toolTimeout?: number;
    enableRateLimiting?: boolean;
    rateLimit?: {
      windowMs: number;
      maxRequests: number;
    };
    allowedDirectories?: string[];
    blockedPatterns?: string[];
  };
}

// ============================================================================
// Session & Context Types
// ============================================================================

export interface MCPSession {
  id: string;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  context: MCPSessionContext;
}

export interface MCPSessionContext {
  variables: Map<string, unknown>;
  history: Array<{
    tool: string;
    input: Record<string, unknown>;
    output: ToolResponse;
    timestamp: Date;
  }>;
  permissions: string[];
}

export interface SessionManager {
  create(userId?: string): MCPSession;
  get(sessionId: string): MCPSession | undefined;
  update(sessionId: string, updates: Partial<MCPSession>): void;
  delete(sessionId: string): boolean;
  list(userId?: string): MCPSession[];
  cleanupExpired(maxAgeMs: number): number;
}
