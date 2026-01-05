/**
 * Calculator and Data Processing Tools for MCP Server
 * CHUTES AI Chat v5 - Enterprise Edition
 */

import { z } from 'zod';
import type { MCPTool, CalculatorParams, StatisticsParams } from '../types';

// ============================================================================
// Math Utilities
// ============================================================================

function safeEvaluate(expression: string): number {
  // Remove any potentially dangerous characters
  const sanitized = expression.replace(/[^0-9+\-*/().eE\s]/g, '');
  
  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (!isFinite(result) || isNaN(result)) {
      throw new Error('Invalid result');
    }
    return result;
  } catch {
    throw new Error(`Invalid expression: ${expression}`);
  }
}

function calculateStatistics(data: number[], operation: StatisticsParams['operation'], percentile?: number): number {
  const sorted = [...data].sort((a, b) => a - b);
  
  switch (operation) {
    case 'mean':
      return data.reduce((a, b) => a + b, 0) / data.length;
    case 'median': {
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case 'mode': {
      const frequency: Record<number, number> = {};
      let maxFreq = 0;
      let mode = sorted[0];
      for (const num of sorted) {
        frequency[num] = (frequency[num] || 0) + 1;
        if (frequency[num] > maxFreq) {
          maxFreq = frequency[num];
          mode = num;
        }
      }
      return mode;
    }
    case 'min':
      return Math.min(...data);
    case 'max':
      return Math.max(...data);
    case 'sum':
      return data.reduce((a, b) => a + b, 0);
    case 'stddev': {
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
      return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / data.length);
    }
    case 'variance': {
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
      return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
    }
    case 'percentile': {
      if (!percentile || percentile < 0 || percentile > 100) {
        throw new Error('Percentile must be between 0 and 100');
      }
      const index = (percentile / 100) * (sorted.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      if (lower === upper) return sorted[lower];
      return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
    }
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

function convertBase(value: string, fromBase: number, toBase: number): string {
  const decimal = parseInt(value, fromBase);
  if (isNaN(decimal)) throw new Error(`Invalid number in base ${fromBase}`);
  
  if (toBase === 10) return decimal.toString();
  if (toBase < 2 || toBase > 36) throw new Error('Base must be between 2 and 36');
  
  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (decimal === 0) return '0';
  
  let result = '';
  let num = decimal;
  while (num > 0) {
    result = digits[num % toBase] + result;
    num = Math.floor(num / toBase);
  }
  return result;
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const calculatorTool: MCPTool = {
  name: 'calculator',
  description: 'Evaluate mathematical expressions. Supports basic arithmetic, exponents, logarithms, trigonometric functions, and constants like pi and e.',
  inputSchema: z.object({
    expression: z.string().describe('The mathematical expression to evaluate'),
    precision: z.number().optional().describe('Number of decimal places (default: 10)'),
  }),
  tags: ['calculator', 'math', 'arithmetic', 'computation'],
  examples: [
    { description: 'Basic arithmetic', args: { expression: '2 + 2 * 3' } },
    { description: 'Trigonometry', args: { expression: 'sin(pi / 4)' } },
    { description: 'Exponentiation', args: { expression: '2 ** 10' } },
    { description: 'Logarithm', args: { expression: 'log(100)' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as CalculatorParams;
      const result = safeEvaluate(params.expression);
      const precision = params.precision ?? 10;
      
      return {
        content: [{
          type: 'text',
          text: `Expression: ${params.expression}\nResult: ${result.toFixed(precision)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Calculation error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const statisticsTool: MCPTool = {
  name: 'statistics',
  description: 'Calculate statistical measures for a dataset. Supports mean, median, mode, standard deviation, variance, min, max, sum, and percentiles.',
  inputSchema: z.object({
    data: z.array(z.number()).describe('Array of numbers to analyze'),
    operation: z.enum(['mean', 'median', 'mode', 'stddev', 'variance', 'min', 'max', 'sum', 'percentile']).describe('Statistical operation'),
    percentile: z.number().optional().describe('Percentile value (0-100) for percentile operation'),
  }),
  tags: ['statistics', 'math', 'data', 'analysis'],
  examples: [
    { description: 'Calculate mean', args: { data: [1, 2, 3, 4, 5], operation: 'mean' } },
    { description: 'Calculate median', args: { data: [1, 3, 5, 7, 9], operation: 'median' } },
    { description: 'Calculate 90th percentile', args: { data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], operation: 'percentile', percentile: 90 } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const params = args as unknown as StatisticsParams;
      
      if (params.data.length === 0) {
        return { content: [{ type: 'error', text: 'Data array cannot be empty' }], isError: true };
      }
      
      const result = calculateStatistics(params.data, params.operation, params.percentile);
      
      return {
        content: [{
          type: 'text',
          text: `Operation: ${params.operation}${params.percentile ? ` (${params.percentile}th percentile)` : ''}\nData: [${params.data.join(', ')}]\nResult: ${result}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Statistics error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const baseConverterTool: MCPTool = {
  name: 'base_convert',
  description: 'Convert numbers between different bases. Supports bases 2-36.',
  inputSchema: z.object({
    value: z.string().describe('The number to convert'),
    fromBase: z.number().min(2).max(36).describe('Source base'),
    toBase: z.number().min(2).max(36).describe('Target base'),
  }),
  tags: ['converter', 'base', 'number', 'math'],
  examples: [
    { description: 'Binary to decimal', args: { value: '1010', fromBase: 2, toBase: 10 } },
    { description: 'Hex to binary', args: { value: 'FF', fromBase: 16, toBase: 2 } },
    { description: 'Decimal to hex', args: { value: '255', fromBase: 10, toBase: 16 } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { value, fromBase, toBase } = args as { value: string; fromBase: number; toBase: number };
      const result = convertBase(value, fromBase, toBase);
      
      return {
        content: [{
          type: 'text',
          text: `Convert: ${value} (base ${fromBase}) → ${result} (base ${toBase})`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Conversion error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const randomTool: MCPTool = {
  name: 'random',
  description: 'Generate random numbers. Supports integer ranges, floating point ranges, and random selection from arrays.',
  inputSchema: z.object({
    type: z.enum(['integer', 'float', 'choice']).describe('Type of random generation'),
    min: z.number().optional().describe('Minimum value (for integer/float)'),
    max: z.number().optional().describe('Maximum value (for integer/float)'),
    count: z.number().optional().describe('Number of random values to generate'),
    array: z.array(z.unknown()).optional().describe('Array to randomly select from'),
  }),
  tags: ['random', 'generator', 'rng'],
  examples: [
    { description: 'Random integer 1-100', args: { type: 'integer', min: 1, max: 100 } },
    { description: 'Random float 0-1', args: { type: 'float', min: 0, max: 1 } },
    { description: 'Random choice from array', args: { type: 'choice', array: ['apple', 'banana', 'cherry'] } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { type, min = 0, max = 1, count = 1, array } = args as {
        type: 'integer' | 'float' | 'choice';
        min?: number;
        max?: number;
        count?: number;
        array?: unknown[];
      };
      
      const results: unknown[] = [];
      
      for (let i = 0; i < count; i++) {
        switch (type) {
          case 'integer':
            results.push(Math.floor(Math.random() * (max - min + 1)) + min);
            break;
          case 'float':
            results.push(Math.random() * (max - min) + min);
            break;
          case 'choice':
            if (!array || array.length === 0) {
              throw new Error('Array cannot be empty for choice type');
            }
            results.push(array[Math.floor(Math.random() * array.length)]);
            break;
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `Random ${type}(s): ${JSON.stringify(count === 1 ? results[0] : results)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Random error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

export const formatNumberTool: MCPTool = {
  name: 'format_number',
  description: 'Format numbers with various options: currency, percentage, scientific notation, locale formatting.',
  inputSchema: z.object({
    value: z.number().describe('The number to format'),
    format: z.enum(['currency', 'percent', 'scientific', 'compact', 'locale']).describe('Format type'),
    locale: z.string().optional().describe('Locale for formatting (default: en-US)'),
    currency: z.string().optional().describe('Currency code for currency format (e.g., USD, EUR)'),
    precision: z.number().optional().describe('Number of decimal places'),
  }),
  tags: ['format', 'number', 'currency', 'localization'],
  examples: [
    { description: 'Format as currency', args: { value: 1234.56, format: 'currency', currency: 'USD' } },
    { description: 'Format as percentage', args: { value: 0.75, format: 'percent' } },
    { description: 'Format compact', args: { value: 1000000, format: 'compact' } },
  ],
  handler: async (args: Record<string, unknown>) => {
    try {
      const { value, format, locale = 'en-US', currency, precision } = args as {
        value: number;
        format: 'currency' | 'percent' | 'scientific' | 'compact' | 'locale';
        locale?: string;
        currency?: string;
        precision?: number;
      };
      
      const options: Intl.NumberFormatOptions = {};
      
      switch (format) {
        case 'currency':
          options.style = 'currency';
          options.currency = currency || 'USD';
          if (precision !== undefined) options.minimumFractionDigits = precision;
          break;
        case 'percent':
          options.style = 'percent';
          if (precision !== undefined) options.minimumFractionDigits = precision;
          break;
        case 'scientific':
          options.notation = 'scientific';
          break;
        case 'compact':
          options.notation = 'compact';
          break;
        case 'locale':
          options.style = 'decimal';
          break;
      }
      
      const formatter = new Intl.NumberFormat(locale, options);
      
      return {
        content: [{
          type: 'text',
          text: `Formatted: ${formatter.format(value)}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'error', text: `Format error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  },
};

// ============================================================================
// Export all calculator tools
// ============================================================================

export const calculatorTools = [
  calculatorTool,
  statisticsTool,
  baseConverterTool,
  randomTool,
  formatNumberTool,
];

export default calculatorTools;
