/**
 * Task Analyzer
 * 
 * Analyzes incoming tasks to determine complexity, category, and required capabilities
 * for intelligent model routing.
 */

import type { 
  TaskAnalysis, 
  TaskComplexity, 
  TaskCategory,
  TaskCapabilities
} from './types';

/**
 * Configuration for task analysis
 */
export interface TaskAnalyzerConfig {
  /** Minimum tokens to consider as complex */
  complexThresholdTokens: number;
  
  /** Keywords that indicate coding tasks */
  codingKeywords: string[];
  
  /** Keywords that indicate data analysis */
  dataAnalysisKeywords: string[];
  
  /** Keywords that indicate creative writing */
  creativeWritingKeywords: string[];
  
  /** Keywords that indicate technical explanation */
  technicalKeywords: string[];
  
  /** Keywords that indicate reasoning */
  reasoningKeywords: string[];
  
  /** Multipliers for complexity scoring */
  multipliers: {
    codeBlocks: number;
    mathExpressions: number;
    tables: number;
    images: number;
    length: number;
  };
}

/**
 * Default analyzer configuration
 */
export const DEFAULT_ANALYZER_CONFIG: TaskAnalyzerConfig = {
  complexThresholdTokens: 500,
  
  codingKeywords: [
    'code', 'function', 'class', 'implement', 'debug', 'refactor',
    'algorithm', 'api', 'database', 'frontend', 'backend', 'devops',
    'typescript', 'javascript', 'python', 'rust', 'golang', 'java',
    'sql', 'graphql', 'rest', 'docker', 'kubernetes', 'testing'
  ],
  
  dataAnalysisKeywords: [
    'analyze', 'statistics', 'chart', 'graph', 'trend', 'correlation',
    'regression', 'prediction', 'machine learning', 'data', 'dataset',
    'excel', 'pivot', 'aggregation', 'visualization', 'metrics'
  ],
  
  creativeWritingKeywords: [
    'write', 'story', 'poem', 'article', 'blog', 'creative',
    'narrative', 'character', 'dialogue', 'plot', 'script', ' screenplay'
  ],
  
  technicalKeywords: [
    'explain', 'technical', 'architecture', 'system', 'design',
    'protocol', 'specification', 'documentation', 'how does', 'why is'
  ],
  
  reasoningKeywords: [
    'solve', 'reason', 'think', 'logic', 'prove', 'deduce',
    'conclusion', 'argument', 'hypothesis', 'if-then', 'because'
  ],
  
  multipliers: {
    codeBlocks: 1.5,
    mathExpressions: 1.3,
    tables: 1.2,
    images: 1.4,
    length: 1.1
  }
};

/**
 * Result of content pattern analysis
 */
interface PatternAnalysis {
  codeBlocks: number;
  mathExpressions: number;
  tables: number;
  images: number;
  questions: number;
  bulletPoints: number;
  totalLength: number;
  uniqueWords: number;
  technicalTerms: number;
  hasCodeKeywords: boolean;
  hasDataKeywords: boolean;
  hasCreativeKeywords: boolean;
  hasTechnicalKeywords: boolean;
  hasReasoningKeywords: boolean;
}

/**
 * Task Analyzer class
 */
export class TaskAnalyzer {
  private config: TaskAnalyzerConfig;
  
  constructor(config: Partial<TaskAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_ANALYZER_CONFIG, ...config };
  }
  
  /**
   * Analyze a task and return detailed analysis
   */
  analyze(
    messages: Array<{ role: string; content: string }>,
    options: {
      isFollowUp?: boolean;
      conversationHistoryLength?: number;
      userPreferences?: { preferredCapabilities?: string[] };
    } = {}
  ): TaskAnalysis {
    const content = messages.map(m => m.content).join(' ');
    const patterns = this.analyzePatterns(content);
    const complexity = this.calculateComplexity(patterns, messages);
    const category = this.categorizeTask(patterns, content);
    const capabilities = this.detectCapabilities(patterns, content, category);
    const estimatedTokens = this.estimateTokens(content);
    
    return {
      id: this.generateAnalysisId(),
      complexity,
      complexityScore: this.calculateComplexityScore(complexity),
      category,
      estimatedInputTokens: estimatedTokens,
      estimatedOutputTokens: this.estimateOutputTokens(category, complexity),
      requiredCapabilities: capabilities,
      detectedLanguage: this.detectLanguage(content),
      isFollowUp: options.isFollowUp ?? false,
      conversationHistoryLength: options.conversationHistoryLength ?? 0,
      userPreferences: options.userPreferences ? {
        costOptimization: 'medium',
        latencyPriority: 'medium',
        qualitySpeedTradeoff: 'balanced',
        favoriteModels: [],
        excludedModels: [],
        preferredCapabilities: options.userPreferences.preferredCapabilities ?? [],
      } : undefined,
      analyzedAt: new Date()
    };
  }
  
  /**
   * Analyze content patterns
   */
  private analyzePatterns(content: string): PatternAnalysis {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const mathRegex = /\$[\s\S]*?\$|\\[\s\S]*?\\|\\begin\{[\s\S]*?\\end\{/g;
    const tableRegex = /\|.*\|.*(\n\|.*\|.*)*/g;
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const questionRegex = /\?/g;
    const bulletRegex = /^\s*[-*•]\s/gm;
    
    const codeBlocks = (content.match(codeBlockRegex) || []).length;
    const mathExpressions = (content.match(mathRegex) || []).length;
    const tables = (content.match(tableRegex) || []).length;
    const images = (content.match(imageRegex) || []).length;
    const questions = (content.match(questionRegex) || []).length;
    const bulletPoints = (content.match(bulletRegex) || []).length;
    
    const words = content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words).size;
    
    const technicalTerms = words.filter(word => 
      this.config.technicalKeywords.some(kw => word.includes(kw))
    ).length;
    
    return {
      codeBlocks,
      mathExpressions,
      tables,
      images,
      questions,
      bulletPoints,
      totalLength: content.length,
      uniqueWords,
      technicalTerms,
      hasCodeKeywords: this.config.codingKeywords.some(kw => 
        content.toLowerCase().includes(kw)
      ),
      hasDataKeywords: this.config.dataAnalysisKeywords.some(kw => 
        content.toLowerCase().includes(kw)
      ),
      hasCreativeKeywords: this.config.creativeWritingKeywords.some(kw => 
        content.toLowerCase().includes(kw)
      ),
      hasTechnicalKeywords: this.config.technicalKeywords.some(kw => 
        content.toLowerCase().includes(kw)
      ),
      hasReasoningKeywords: this.config.reasoningKeywords.some(kw => 
        content.toLowerCase().includes(kw)
      )
    };
  }
  
  /**
   * Calculate task complexity
   */
  private calculateComplexity(
    patterns: PatternAnalysis,
    messages: Array<{ role: string; content: string }>
  ): TaskComplexity {
    let complexityScore = 0;
    
    // Base score from content length
    const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    if (avgMessageLength > 2000) complexityScore += 25;
    else if (avgMessageLength > 1000) complexityScore += 15;
    else if (avgMessageLength > 500) complexityScore += 5;
    
    // Add points for patterns
    complexityScore += patterns.codeBlocks * 15 * this.config.multipliers.codeBlocks;
    complexityScore += patterns.mathExpressions * 10 * this.config.multipliers.mathExpressions;
    complexityScore += patterns.tables * 8 * this.config.multipliers.tables;
    complexityScore += patterns.images * 12 * this.config.multipliers.images;
    complexityScore += patterns.questions * 5;
    
    // Add points for technical depth
    complexityScore += Math.min(patterns.technicalTerms * 2, 20);
    
    // Add points for keywords
    if (patterns.hasCodeKeywords) complexityScore += 15;
    if (patterns.hasDataKeywords) complexityScore += 10;
    if (patterns.hasReasoningKeywords) complexityScore += 12;
    
    // Normalize to 0-100
    const normalizedScore = Math.min(100, complexityScore);
    
    if (normalizedScore >= 75) return 'highly_complex';
    if (normalizedScore >= 50) return 'complex';
    if (normalizedScore >= 25) return 'moderate';
    return 'simple';
  }
  
  /**
   * Calculate numerical complexity score (0-100)
   */
  private calculateComplexityScore(complexity: TaskComplexity): number {
    switch (complexity) {
      case 'simple': return 25;
      case 'moderate': return 50;
      case 'complex': return 75;
      case 'highly_complex': return 100;
    }
  }
  
  /**
   * Categorize the task
   */
  private categorizeTask(patterns: PatternAnalysis, content: string): TaskCategory {
    const lowerContent = content.toLowerCase();
    
    // Check for coding task
    if (patterns.codeBlocks > 0 && patterns.hasCodeKeywords) {
      return 'coding';
    }
    
    // Check for data analysis
    if (patterns.hasDataKeywords && (patterns.tables > 0 || patterns.bulletPoints > 3)) {
      return 'data_analysis';
    }
    
    // Check for creative writing
    if (patterns.hasCreativeKeywords && !patterns.hasTechnicalKeywords) {
      return 'creative_writing';
    }
    
    // Check for technical explanation
    if (patterns.hasTechnicalKeywords && patterns.hasReasoningKeywords) {
      return 'technical_explanation';
    }
    
    // Check for reasoning
    if (patterns.hasReasoningKeywords || patterns.questions > 3) {
      return 'reasoning';
    }
    
    // Check for vision/multimodal
    if (patterns.images > 0) {
      return 'vision';
    }
    
    // Check for long context
    if (patterns.totalLength > 10000) {
      return 'long_context';
    }
    
    return 'general_conversation';
  }
  
  /**
   * Detect required capabilities
   */
  private detectCapabilities(
    patterns: PatternAnalysis,
    content: string,
    category: TaskCategory
  ): TaskCapabilities {
    const capabilities: TaskCapabilities = {};
    
    // Vision capability
    capabilities.vision = patterns.images > 0 || 
      content.includes('image') || 
      content.includes('picture') ||
      content.includes('photo');
    
    // Coding capability
    capabilities.coding = patterns.codeBlocks > 0 || 
      category === 'coding' ||
      this.config.codingKeywords.some(kw => content.toLowerCase().includes(kw));
    
    // Reasoning capability
    capabilities.reasoning = category === 'reasoning' ||
      category === 'technical_explanation' ||
      patterns.hasReasoningKeywords ||
      patterns.questions > 2;
    
    // Analysis capability
    capabilities.analysis = category === 'data_analysis' ||
      patterns.hasDataKeywords ||
      patterns.tables > 0;
    
    // Creativity
    capabilities.creativity = category === 'creative_writing';
    
    // Fast response (simple tasks)
    capabilities.fastResponse = category === 'general_conversation' && 
      patterns.totalLength < 1000;
    
    // Large context
    capabilities.largeContext = patterns.totalLength > 5000 || 
      category === 'long_context';
    
    // Multilingual detection
    const nonEnglishChars = content.match(/[^\x00-\x7F]/g);
    capabilities.multilingual = nonEnglishChars 
      ? nonEnglishChars.length / content.length > 0.05 
      : false;
    
    return capabilities;
  }
  
  /**
   * Estimate token count for content
   */
  private estimateTokens(content: string): number {
    // Rough estimate: ~4 characters per token on average
    return Math.ceil(content.length / 4);
  }
  
  /**
   * Estimate output tokens based on task
   */
  private estimateOutputTokens(category: TaskCategory, complexity: TaskComplexity): number {
    const baseTokens: Record<TaskCategory, number> = {
      general_conversation: 500,
      coding: 800,
      data_analysis: 600,
      creative_writing: 1000,
      technical_explanation: 500,
      reasoning: 400,
      vision: 400,
      multimodal: 400,
      long_context: 300
    };
    
    const complexityMultipliers: Record<TaskComplexity, number> = {
      simple: 0.5,
      moderate: 1,
      complex: 1.5,
      highly_complex: 2
    };
    
    return Math.ceil(baseTokens[category] * complexityMultipliers[complexity]);
  }
  
  /**
   * Detect primary language
   */
  private detectLanguage(content: string): string | undefined {
    // Simple language detection based on character sets
    const nonEnglishChars = content.match(/[^\x00-\x7F]/g);
    
    if (!nonEnglishChars) return 'en';
    
    const charSet = new Set(nonEnglishChars.join(''));
    
    // Check for common scripts
    if (/[\u4e00-\u9fff]/.test(content)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(content)) return 'ja';
    if (/[\uac00-\ud7af]/.test(content)) return 'ko';
    if (/[\u0600-\u06ff]/.test(content)) return 'ar';
    if (/[\u0400-\u04ff]/.test(content)) return 'ru';
    
    return 'en'; // Default to English
  }
  
  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Export singleton instance
export const taskAnalyzer = new TaskAnalyzer();

/**
 * Utility function for quick task analysis
 */
export function analyzeTask(
  messages: Array<{ role: string; content: string }>,
  options?: Parameters<TaskAnalyzer['analyze']>[1]
): TaskAnalysis {
  return taskAnalyzer.analyze(messages, options);
}
