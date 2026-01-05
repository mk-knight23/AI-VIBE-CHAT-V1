/**
 * File System Tools for MCP Server
 * CHUTES AI Chat v5 - Enterprise Edition
 */

import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import type { MCPTool, FileReadParams, FileWriteParams, FileSearchParams, FileListParams, FileInfo } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

async function safeReadFile(filePath: string, encoding: string = 'utf-8'): Promise<{ content: string; size: number }> {
  const absolutePath = path.resolve(filePath);
  const stat = await fs.stat(absolutePath);
  
  if (stat.isDirectory()) {
    throw new Error(`Path is a directory, not a file: ${filePath}`);
  }
  
  if (stat.size > 10 * 1024 * 1024) {
    throw new Error(`File too large: ${stat.size} bytes. Maximum size is 10MB.`);
  }
  
  const content = encoding === 'base64' 
    ? (await fs.readFile(absolutePath)).toString('base64')
    : encoding === 'binary'
    ? (await fs.readFile(absolutePath)).toString('binary')
    : await fs.readFile(absolutePath, { encoding: 'utf-8' });
  
  return { content, size: stat.size };
}

async function safeWriteFile(filePath: string, content: string, encoding: string = 'utf-8'): Promise<{ path: string; size: number }> {
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);
  
  await fs.mkdir(dir, { recursive: true });
  
  const buffer = encoding === 'base64' 
    ? Buffer.from(content, 'base64')
    : Buffer.from(content);
  
  await fs.writeFile(absolutePath, buffer, { mode: 0o644 });
  
  return { path: absolutePath, size: buffer.length };
}

async function getFileInfo(filePath: string): Promise<FileInfo> {
  const absolutePath = path.resolve(filePath);
  const stat = await fs.stat(absolutePath);
  
  return {
    path: absolutePath,
    size: stat.size,
    isDirectory: stat.isDirectory(),
    permissions: stat.mode.toString(8),
    createdAt: stat.birthtime,
    modifiedAt: stat.mtime,
  };
}

function globSync(pattern: string, options: { cwd: string; maxMatches?: number }): string[] {
  const { cwd, maxMatches = 100 } = options;
  
  const results: string[] = [];
  
  const search = (dir: string, depth: number) => {
    if (results.length >= maxMatches) return;
    if (depth > 10) return;
    
    try {
      const entries = fsSync.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(cwd, fullPath);
        
        const regexPattern = pattern
          .replace(/\*\*/g, 'DIR_STAR')
          .replace(/\*/g, '[^/]*')
          .replace(/DIR_STAR/g, '.*')
          .replace(/\?/g, '.');
        const regex = new RegExp(`^${regexPattern}$`);
        
        if (regex.test(relativePath) || regex.test(entry.name)) {
          results.push(relativePath);
        }
        
        if (entry.isDirectory() && pattern.includes('**')) {
          search(fullPath, depth + 1);
        }
      }
    } catch {
      // Ignore permission errors
    }
  };
  
  search(cwd, 0);
  return results.slice(0, maxMatches);
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const fileReadTool: MCPTool = {
  name: 'file_read',
  description: 'Read the contents of a file from the file system. Supports UTF-8 text, base64 encoding for binary files. Maximum file size is 10MB.',
  inputSchema: z.object({
    path: z.string().describe('The path to the file to read'),
    encoding: z.enum(['utf-8', 'base64', 'binary']).optional().default('utf-8'),
    maxSize: z.number().optional().describe('Maximum file size in bytes'),
  }),
  tags: ['filesystem', 'read', 'file'],
  examples: [
    { description: 'Read a text file', args: { path: '/etc/config.json' } },
    { description: 'Read an image as base64', args: { path: '/tmp/image.png', encoding: 'base64' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as FileReadParams;
      const { content, size } = await safeReadFile(params.path, params.encoding);
      
      return {
        content: [{ type: 'text', text: `File: ${params.path}\nSize: ${size} bytes\n\n${content}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileWriteTool: MCPTool = {
  name: 'file_write',
  description: 'Write content to a file. Creates the file if it does not exist, overwrites if it does.',
  inputSchema: z.object({
    path: z.string().describe('The path where the file should be written'),
    content: z.string().describe('The content to write to the file'),
    encoding: z.enum(['utf-8', 'base64']).optional().default('utf-8'),
    mode: z.number().optional().describe('File permission mode in octal'),
  }),
  tags: ['filesystem', 'write', 'file'],
  examples: [
    { description: 'Write a text file', args: { path: '/tmp/output.txt', content: 'Hello, World!' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as FileWriteParams;
      const { path: writtenPath, size } = await safeWriteFile(params.path, params.content, params.encoding);
      
      return {
        content: [{ type: 'text', text: `Successfully wrote ${size} bytes to ${writtenPath}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error writing file: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileSearchTool: MCPTool = {
  name: 'file_search',
  description: 'Search for files matching a glob pattern. Supports wildcards (*, **).',
  inputSchema: z.object({
    pattern: z.string().describe('Glob pattern to match files'),
    path: z.string().optional().describe('Base directory to search from'),
    recursive: z.boolean().optional().default(true),
    maxResults: z.number().optional().default(100),
    fileType: z.string().optional().describe('Filter by file type'),
  }),
  tags: ['filesystem', 'search', 'glob', 'find'],
  examples: [
    { description: 'Find all TypeScript files', args: { pattern: '**/*.ts' } },
    { description: 'Find JSON files in src directory', args: { pattern: '**/*.json', path: 'src' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as FileSearchParams;
      const searchPath = params.path || process.cwd();
      const pattern = params.recursive !== false ? params.pattern : params.pattern.replace('**/', '');
      
      const files = globSync(pattern, { cwd: searchPath, maxMatches: params.maxResults || 100 });
      
      return {
        content: [{
          type: 'text',
          text: `Found ${files.length} file(s) matching "${pattern}" in ${searchPath}:\n\n${files.map(f => `  - ${f}`).join('\n')}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error searching files: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileListTool: MCPTool = {
  name: 'file_list',
  description: 'List files and directories in a given path.',
  inputSchema: z.object({
    path: z.string().describe('The directory path to list'),
    recursive: z.boolean().optional().default(false),
    includeHidden: z.boolean().optional().default(false),
  }),
  tags: ['filesystem', 'list', 'directory', 'ls'],
  examples: [
    { description: 'List files in current directory', args: { path: '.' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as FileListParams;
      const absolutePath = path.resolve(params.path);
      
      if (!(await fs.stat(absolutePath)).isDirectory()) {
        return { content: [{ type: 'error', text: `Path is not a directory: ${params.path}` }], isError: true };
      }
      
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      let filteredEntries = params.includeHidden ? entries : entries.filter(e => !e.name.startsWith('.'));
      
      if (!params.recursive) {
        filteredEntries = filteredEntries.filter(e => e.isDirectory());
      }
      
      const fileList = await Promise.all(
        filteredEntries.map(async (entry) => {
          const info = await getFileInfo(path.join(absolutePath, entry.name));
          const type = entry.isDirectory() ? '[DIR]' : '[FILE]';
          return `${type.padEnd(7)} ${info.size.toString().padStart(10)} ${entry.name}`;
        })
      );
      
      return {
        content: [{ type: 'text', text: `Directory: ${absolutePath}\n\n${fileList.join('\n')}` }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error listing directory: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileInfoTool: MCPTool = {
  name: 'file_info',
  description: 'Get detailed information about a file or directory.',
  inputSchema: z.object({ path: z.string().describe('The path to get information about') }),
  tags: ['filesystem', 'info', 'stat'],
  examples: [{ description: 'Get file information', args: { path: '/path/to/file.txt' } }],
  handler: async (args: Record<string, unknown>) => {
    try {
      const info = await getFileInfo(args.path as string);
      
      return {
        content: [{
          type: 'text',
          text: `File Information: ${info.path}\nType: ${info.isDirectory ? 'Directory' : 'File'}\nSize: ${info.size} bytes\nPermissions: ${info.permissions}\nCreated: ${info.createdAt.toISOString()}\nModified: ${info.modifiedAt.toISOString()}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error getting file info: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileDeleteTool: MCPTool = {
  name: 'file_delete',
  description: 'Delete a file or empty directory.',
  inputSchema: z.object({
    path: z.string().describe('The path to delete'),
    recursive: z.boolean().optional().default(false),
  }),
  tags: ['filesystem', 'delete', 'remove', 'rm'],
  examples: [{ description: 'Delete a file', args: { path: '/tmp/old.txt' } }],
  handler: async (args: Record<string, unknown>) => {
    try {
      const absolutePath = path.resolve(args.path as string);
      const stat = await fs.stat(absolutePath);
      
      if (stat.isDirectory()) {
        const files = await fs.readdir(absolutePath);
        if (files.length > 0 && !args.recursive) {
          return { content: [{ type: 'error', text: 'Directory is not empty. Use recursive: true to delete.' }], isError: true };
        }
        await fs.rm(absolutePath, { recursive: args.recursive as boolean });
      } else {
        await fs.unlink(absolutePath);
      }
      
      return { content: [{ type: 'text', text: `Successfully deleted: ${absolutePath}` }] };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error deleting: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileCopyTool: MCPTool = {
  name: 'file_copy',
  description: 'Copy a file to a new location.',
  inputSchema: z.object({
    source: z.string().describe('The source path to copy from'),
    destination: z.string().describe('The destination path to copy to'),
  }),
  tags: ['filesystem', 'copy', 'cp'],
  examples: [{ description: 'Copy a file', args: { source: '/tmp/source.txt', destination: '/tmp/dest.txt' } }],
  handler: async (args: Record<string, unknown>) => {
    try {
      const sourcePath = path.resolve(args.source as string);
      const destPath = path.resolve(args.destination as string);
      await fs.copyFile(sourcePath, destPath);
      
      return { content: [{ type: 'text', text: `Successfully copied ${sourcePath} to ${destPath}` }] };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error copying: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileMoveTool: MCPTool = {
  name: 'file_move',
  description: 'Move or rename a file or directory.',
  inputSchema: z.object({
    source: z.string().describe('The source path to move from'),
    destination: z.string().describe('The destination path to move to'),
  }),
  tags: ['filesystem', 'move', 'mv', 'rename'],
  examples: [{ description: 'Move a file', args: { source: '/tmp/old.txt', destination: '/tmp/new.txt' } }],
  handler: async (args: Record<string, unknown>) => {
    try {
      const sourcePath = path.resolve(args.source as string);
      const destPath = path.resolve(args.destination as string);
      await fs.rename(sourcePath, destPath);
      
      return { content: [{ type: 'text', text: `Successfully moved ${sourcePath} to ${destPath}` }] };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error moving: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const fileMakeDirTool: MCPTool = {
  name: 'file_mkdir',
  description: 'Create a new directory. Parent directories are created automatically.',
  inputSchema: z.object({
    path: z.string().describe('The directory path to create'),
    mode: z.number().optional().describe('Directory permission mode in octal'),
  }),
  tags: ['filesystem', 'mkdir', 'directory', 'create'],
  examples: [{ description: 'Create a directory', args: { path: '/tmp/new_dir' } }],
  handler: async (args: Record<string, unknown>) => {
    try {
      const absolutePath = path.resolve(args.path as string);
      await fs.mkdir(absolutePath, { recursive: true, mode: (args.mode as number) || 0o755 });
      
      return { content: [{ type: 'text', text: `Successfully created directory: ${absolutePath}` }] };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Error creating directory: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// Export all file system tools
// ============================================================================

export const fileSystemTools = [
  fileReadTool,
  fileWriteTool,
  fileSearchTool,
  fileListTool,
  fileInfoTool,
  fileDeleteTool,
  fileCopyTool,
  fileMoveTool,
  fileMakeDirTool,
];

export default fileSystemTools;
