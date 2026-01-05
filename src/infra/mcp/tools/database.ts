/**
 * Database Tools for MCP Server
 * CHUTES AI Chat v5 - Enterprise Edition
 */

import { z } from 'zod';
import type { MCPTool, DatabaseQueryParams, DatabaseSchemaParams, DatabaseRecord } from '../types';

// ============================================================================
// Database Connection Helpers (Mock implementations)
// ============================================================================

interface DatabaseConnection {
  query: (sql: string) => Promise<DatabaseRecord>;
  close: () => Promise<void>;
}

// Simple connection pool mock
const connectionPool: Map<string, DatabaseConnection> = new Map();

async function createPostgresConnection(connectionString: string): Promise<DatabaseConnection> {
  // In production, this would use pg library
  return {
    query: async (sql: string): Promise<DatabaseRecord> => {
      // Mock response
      const columns = ['id', 'name', 'created_at'];
      const rows = [
        [1, 'Sample Record', new Date().toISOString()],
        [2, 'Another Record', new Date().toISOString()],
      ];
      return { columns, rows, rowCount: rows.length };
    },
    close: async () => {},
  };
}

async function createMongodbConnection(connectionString: string): Promise<DatabaseConnection> {
  // In production, this would use mongodb library
  return {
    query: async (sql: string): Promise<DatabaseRecord> => {
      const columns = ['_id', 'name', 'data'];
      const rows = [
        ['obj1', 'Document 1', JSON.stringify({ key: 'value' })],
        ['obj2', 'Document 2', JSON.stringify({ key: 'value2' })],
      ];
      return { columns, rows, rowCount: rows.length };
    },
    close: async () => {},
  };
}

async function getConnection(connectionString: string, type: 'postgres' | 'mongodb'): Promise<DatabaseConnection> {
  const key = `${type}:${connectionString}`;
  
  if (connectionPool.has(key)) {
    return connectionPool.get(key)!;
  }
  
  const connection = type === 'postgres' 
    ? await createPostgresConnection(connectionString)
    : await createMongodbConnection(connectionString);
  
  connectionPool.set(key, connection);
  return connection;
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const postgresQueryTool: MCPTool = {
  name: 'postgres_query',
  description: 'Execute SQL queries on PostgreSQL databases. Supports SELECT, INSERT, UPDATE, DELETE operations.',
  inputSchema: z.object({
    connectionString: z.string().describe('PostgreSQL connection string (e.g., postgresql://user:pass@host:5432/db)'),
    query: z.string().describe('SQL query to execute'),
    parameters: z.array(z.unknown()).optional().describe('Query parameters'),
    timeout: z.number().optional().default(30000).describe('Query timeout in milliseconds'),
  }),
  tags: ['database', 'postgres', 'sql', 'postgresql'],
  examples: [
    { description: 'Select records', args: { connectionString: 'postgresql://localhost/mydb', query: 'SELECT * FROM users LIMIT 10' } },
    { description: 'Insert with parameters', args: { connectionString: 'postgresql://localhost/mydb', query: 'INSERT INTO users (name, email) VALUES ($1, $2)', parameters: ['John', 'john@example.com'] } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as DatabaseQueryParams;
      const connection = await getConnection(params.connectionString, 'postgres');
      
      const startTime = Date.now();
      const result = await connection.query(params.query);
      const duration = Date.now() - startTime;
      
      return {
        content: [{
          type: 'text',
          text: `Query executed in ${duration}ms\nRow Count: ${result.rowCount}\n\nColumns: [${result.columns.join(', ')}]\n\n${result.rows.slice(0, 20).map(row => row.join(' | ')).join('\n')}${result.rows.length > 20 ? '\n... (truncated)' : ''}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Database error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const postgresSchemaTool: MCPTool = {
  name: 'postgres_schema',
  description: 'Get schema information from PostgreSQL databases. Lists tables, columns, and their types.',
  inputSchema: z.object({
    connectionString: z.string().describe('PostgreSQL connection string'),
    tableName: z.string().optional().describe('Specific table to describe (optional)'),
  }),
  tags: ['database', 'postgres', 'schema', 'metadata'],
  examples: [
    { description: 'List all tables', args: { connectionString: 'postgresql://localhost/mydb' } },
    { description: 'Describe specific table', args: { connectionString: 'postgresql://localhost/mydb', tableName: 'users' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { connectionString, tableName } = args as unknown as DatabaseSchemaParams;
      
      // Mock schema response
      const mockTables = tableName 
        ? [{ name: tableName, columns: [
            { name: 'id', type: 'SERIAL', nullable: false },
            { name: 'name', type: 'VARCHAR(255)', nullable: false },
            { name: 'email', type: 'VARCHAR(255)', nullable: true },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false },
          ]}]
        : [
            { name: 'users', columns: [
              { name: 'id', type: 'SERIAL', nullable: false },
              { name: 'name', type: 'VARCHAR(255)', nullable: false },
              { name: 'email', type: 'VARCHAR(255)', nullable: true },
            ]},
            { name: 'products', columns: [
              { name: 'id', type: 'SERIAL', nullable: false },
              { name: 'title', type: 'VARCHAR(255)', nullable: false },
              { name: 'price', type: 'DECIMAL(10,2)', nullable: true },
            ]},
          ];
      
      const output = mockTables.map(table => 
        `Table: ${table.name}\n${table.columns.map(c => `  ${c.name} (${c.type})${c.nullable ? '' : ' NOT NULL'}`).join('\n')}`
      ).join('\n\n');
      
      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Schema error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const mongodbQueryTool: MCPTool = {
  name: 'mongodb_query',
  description: 'Execute queries on MongoDB databases. Supports find, insert, update, delete operations.',
  inputSchema: z.object({
    connectionString: z.string().describe('MongoDB connection string (e.g., mongodb://user:pass@host:27017/db)'),
    collection: z.string().describe('Collection name'),
    filter: z.record(z.string(), z.unknown()).optional().describe('Query filter'),
    projection: z.record(z.string(), z.unknown()).optional().describe('Fields to return'),
    limit: z.number().optional().default(20).describe('Maximum documents to return'),
    sort: z.record(z.string(), z.number()).optional().describe('Sort fields (1 asc, -1 desc)'),
  }),
  tags: ['database', 'mongodb', 'nosql', 'mongo'],
  examples: [
    { description: 'Find documents', args: { connectionString: 'mongodb://localhost/mydb', collection: 'users', filter: { status: 'active' } } },
    { description: 'Find with projection', args: { connectionString: 'mongodb://localhost/mydb', collection: 'products', filter: {}, projection: { name: 1, price: 1 }, limit: 10 } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as {
        connectionString: string;
        collection: string;
        filter?: Record<string, unknown>;
        projection?: Record<string, unknown>;
        limit?: number;
        sort?: Record<string, number>;
      };
      
      const connection = await getConnection(params.connectionString, 'mongodb');
      
      // Mock response
      const mockDocs = [
        { _id: 'obj1', name: 'Document 1', status: 'active', data: { key: 'value' } },
        { _id: 'obj2', name: 'Document 2', status: 'inactive', data: { key: 'value2' } },
      ];
      
      return {
        content: [{
          type: 'text',
          text: `Collection: ${params.collection}\nFilter: ${JSON.stringify(params.filter || {}, null, 2)}\n\nResults:\n${mockDocs.slice(0, params.limit || 20).map(d => JSON.stringify(d, null, 2)).join('\n---\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `MongoDB error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const mongodbSchemaTool: MCPTool = {
  name: 'mongodb_schema',
  description: 'Get collection statistics and schema information from MongoDB databases.',
  inputSchema: z.object({
    connectionString: z.string().describe('MongoDB connection string'),
    collection: z.string().optional().describe('Specific collection (optional)'),
  }),
  tags: ['database', 'mongodb', 'schema', 'statistics'],
  examples: [
    { description: 'List collections', args: { connectionString: 'mongodb://localhost/mydb' } },
    { description: 'Get collection stats', args: { connectionString: 'mongodb://localhost/mydb', collection: 'users' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { connectionString, collection } = args as { connectionString: string; collection?: string };
      
      const mockCollections = [
        { name: 'users', count: 1500, size: '2.5MB', indexes: 3 },
        { name: 'products', count: 500, size: '1.2MB', indexes: 2 },
        { name: 'orders', count: 2500, size: '5.1MB', indexes: 4 },
      ];
      
      const output = collection 
        ? `Collection: ${collection}\n${mockCollections.find(c => c.name === collection) 
          ? `Documents: ${mockCollections.find(c => c.name === collection)!.count}\nSize: ${mockCollections.find(c => c.name === collection)!.size}\nIndexes: ${mockCollections.find(c => c.name === collection)!.indexes}`
          : 'Collection not found'}`
        : `Database Collections:\n${mockCollections.map(c => `  - ${c.name} (${c.count} docs, ${c.size}, ${c.indexes} indexes)`).join('\n')}`;
      
      return {
        content: [{ type: 'text', text: output }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `MongoDB schema error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const sqliteQueryTool: MCPTool = {
  name: 'sqlite_query',
  description: 'Execute SQL queries on SQLite databases. Lightweight file-based database.',
  inputSchema: z.object({
    databasePath: z.string().describe('Path to SQLite database file'),
    query: z.string().describe('SQL query to execute'),
    parameters: z.array(z.unknown()).optional().describe('Query parameters'),
  }),
  tags: ['database', 'sqlite', 'sql', 'file-based'],
  examples: [
    { description: 'Query SQLite database', args: { databasePath: './data.db', query: 'SELECT * FROM users LIMIT 10' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { databasePath, query } = args as { databasePath: string; query: string; parameters?: unknown[] };
      
      // Mock response
      const columns = ['id', 'name', 'value'];
      const rows = [[1, 'Row 1', 'data1'], [2, 'Row 2', 'data2']];
      
      return {
        content: [{
          type: 'text',
          text: `Database: ${databasePath}\nQuery: ${query}\n\nResults:\n${columns.join(' | ')}\n${'-'.repeat(columns.join(' | ').length)}\n${rows.map(r => r.join(' | ')).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `SQLite error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// Export all database tools
// ============================================================================

export const databaseTools = [
  postgresQueryTool,
  postgresSchemaTool,
  mongodbQueryTool,
  mongodbSchemaTool,
  sqliteQueryTool,
];

export default databaseTools;
