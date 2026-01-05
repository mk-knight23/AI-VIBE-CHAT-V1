/**
 * Web Search and Scraping Tools for MCP Server
 * CHUTES AI Chat v5 - Enterprise Edition
 */

import { z } from 'zod';
import type { MCPTool, WebSearchParams, WebScrapeParams, WebSearchResult } from '../types';

// ============================================================================
// Web Search Tool
// ============================================================================

export const webSearchTool: MCPTool = {
  name: 'web_search',
  description: 'Search the web for information. Supports multiple search engines and returns relevant results with snippets.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    engine: z.enum(['google', 'bing', 'duckduckgo']).optional().default('duckduckgo'),
    numResults: z.number().optional().default(5).describe('Number of results to return'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  tags: ['web', 'search', 'internet', 'query'],
  examples: [
    { description: 'Search for information', args: { query: 'TypeScript best practices 2024' } },
    { description: 'Search with specific engine', args: { query: 'React hooks tutorial', engine: 'google', numResults: 10 } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as WebSearchParams;
      
      // Simulated search results for demonstration
      // In production, this would integrate with actual search APIs
      const mockResults: WebSearchResult[] = [
        {
          title: `${params.query} - Official Documentation`,
          url: `https://example.com/docs/${params.query.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `Comprehensive documentation and guide for ${params.query}. Learn best practices and advanced techniques.`,
          source: params.engine,
        },
        {
          title: `Understanding ${params.query}: A Complete Guide`,
          url: `https://example.com/guide/${params.query.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `Deep dive into ${params.query} with practical examples and real-world use cases.`,
          source: params.engine,
        },
        {
          title: `${params.query} - Tutorial and Examples`,
          url: `https://example.com/tutorials/${params.query.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `Step-by-step tutorial covering all aspects of ${params.query}.`,
          source: params.engine,
        },
      ];
      
      const results = mockResults.slice(0, params.numResults);
      
      return {
        content: [{
          type: 'text',
          text: `Search Results for "${params.query}" (${params.engine}):\n\n${results.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`).join('\n\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Search error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// Web Scrape Tool
// ============================================================================

export const webScrapeTool: MCPTool = {
  name: 'web_scrape',
  description: 'Extract content from web pages. Supports CSS selectors for targeted extraction and basic text cleaning.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to scrape'),
    selector: z.string().optional().describe('CSS selector to extract specific content'),
    extractText: z.boolean().optional().default(true).describe('Extract text only (vs HTML)'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  tags: ['web', 'scrape', 'extract', 'crawl'],
  examples: [
    { description: 'Scrape article content', args: { url: 'https://example.com/article', selector: 'article' } },
    { description: 'Get page title', args: { url: 'https://example.com', selector: 'title' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as WebScrapeParams;
      
      // Simulated scraping result
      // In production, this would use a proper HTTP client and HTML parser
      const mockContent = `
        <html>
          <head><title>Example Page - ${params.url}</title></head>
          <body>
            <h1>Welcome to Example Page</h1>
            <p>This is a demonstration of web scraping capabilities.</p>
            <div class="content">
              <p>Extracted content would appear here based on the selector: ${params.selector || 'body'}</p>
            </div>
          </body>
        </html>
      `;
      
      let extracted = params.extractText 
        ? mockContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : mockContent;
      
      return {
        content: [{
          type: 'text',
          text: `URL: ${params.url}\nSelector: ${params.selector || 'none'}\n\nExtracted Content:\n${extracted.substring(0, 1000)}${extracted.length > 1000 ? '...' : ''}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Scraping error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// API Request Tool
// ============================================================================

export const apiRequestTool: MCPTool = {
  name: 'api_request',
  description: 'Make HTTP requests to APIs. Supports GET, POST, PUT, PATCH, DELETE methods with headers and body.',
  inputSchema: z.object({
    url: z.string().url().describe('The API endpoint URL'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional().default('GET'),
    headers: z.record(z.string(), z.string()).optional().describe('HTTP headers'),
    body: z.unknown().optional().describe('Request body (for POST/PUT/PATCH)'),
    timeout: z.number().optional().default(30000).describe('Timeout in milliseconds'),
  }),
  tags: ['api', 'http', 'request', 'fetch'],
  examples: [
    { description: 'GET request', args: { url: 'https://api.example.com/data', method: 'GET' } },
    { description: 'POST with JSON body', args: { url: 'https://api.example.com/users', method: 'POST', body: { name: 'John' } } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
        timeout?: number;
      };
      
      // Simulated API response
      // In production, this would make actual HTTP requests
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req-' + Math.random().toString(36).substring(7),
        },
        body: {
          success: true,
          data: {
            message: 'This is a simulated API response',
            timestamp: new Date().toISOString(),
            endpoint: params.url,
          },
        },
        responseTime: Math.floor(Math.random() * 200) + 50,
      };
      
      return {
        content: [{
          type: 'text',
          text: `API Response\n${'='.repeat(50)}\nStatus: ${mockResponse.status} ${mockResponse.statusText}\nResponse Time: ${mockResponse.responseTime}ms\n\nBody:\n${JSON.stringify(mockResponse.body, null, 2)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `API error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// Extract Links Tool
// ============================================================================

export const extractLinksTool: MCPTool = {
  name: 'extract_links',
  description: 'Extract all hyperlinks from a web page. Returns a list of URLs found on the page.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to extract links from'),
    type: z.enum(['all', 'internal', 'external']).optional().default('all').describe('Type of links to extract'),
    maxLinks: z.number().optional().default(50).describe('Maximum number of links to return'),
  }),
  tags: ['web', 'links', 'urls', 'crawl'],
  examples: [
    { description: 'Extract all links', args: { url: 'https://example.com' } },
    { description: 'Extract internal links only', args: { url: 'https://example.com', type: 'internal', maxLinks: 20 } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { url, type = 'all', maxLinks = 50 } = args as {
        url: string;
        type?: 'all' | 'internal' | 'external';
        maxLinks?: number;
      };
      
      // Simulated link extraction
      const mockLinks = [
        { url: `${url}/about`, text: 'About', isInternal: true },
        { url: `${url}/products`, text: 'Products', isInternal: true },
        { url: `${url}/services`, text: 'Services', isInternal: true },
        { url: 'https://external.com/resource', text: 'External Resource', isInternal: false },
        { url: 'https://docs.example.com', text: 'Documentation', isInternal: false },
      ];
      
      const filteredLinks = type === 'all' 
        ? mockLinks 
        : mockLinks.filter(l => (type === 'internal') === l.isInternal);
      
      return {
        content: [{
          type: 'text',
          text: `Links from ${url} (${type}):\n\n${filteredLinks.slice(0, maxLinks).map((l, i) => 
            `${i + 1}. [${l.text}](${l.url}) ${l.isInternal ? '(internal)' : '(external)'}`
          ).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Link extraction error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// Export all web tools
// ============================================================================

export const webTools = [
  webSearchTool,
  webScrapeTool,
  apiRequestTool,
  extractLinksTool,
];

export default webTools;
