/**
 * Model Router Types
 * 
 * Defines all types for the intelligent model routing system including:
 * - Task analysis and complexity scoring
 * - Routing strategies and preferences
 * - Provider health and cost metrics
 */

import type { ModelRegistryEntry, ProviderHealth } from '../index';

// ============================================================================
// Task Analysis Types
// ============================================================================

/**
 * Represents the complexity level of a task
 */
export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'highly_complex';

/**
 * Task category for routing decisions
 */
export type TaskCategory = 
  | 'general_conversation'
  | 'coding'
  | 'data_analysis'
  | 'creative_writing'
  | 'technical_explanation'
  | 'reasoning'
  | 'vision'
  | 'multimodal'
  | 'long_context';

/**
 * Required capabilities for a task
 */
export interface TaskCapabilities {
  vision?: boolean;
  coding?: boolean;
  reasoning?: boolean;
  analysis?: boolean;
  creativity?: boolean;
  fastResponse?: boolean;
  largeContext?: boolean;
  functionCalling?: boolean;
  multilingual?: boolean;
}

/**
 * Detailed task analysis for routing decisions
 */
export interface TaskAnalysis {
  /** Unique identifier for this analysis */
  id: string;
  
  /** Estimated complexity level */
  complexity: TaskComplexity;
  
  /** Numerical complexity score (0-100) */
  complexityScore: number;
  
  /** Detected or specified task category */
  category: TaskCategory;
  
  /** Estimated token count for input */
  estimatedInputTokens: number;
  
  /** Estimated token count for output */
  estimatedOutputTokens: number;
  
  /** Required capabilities */
  requiredCapabilities: TaskCapabilities;
  
  /** Detected language (for multilingual tasks) */
  detectedLanguage?: string;
  
  /** Whether this is a follow-up conversation */
  isFollowUp: boolean;
  
  /** Conversation history length for context awareness */
  conversationHistoryLength: number;
  
  /** User-specified preferences */
  userPreferences?: UserPreferences;
  
  /** Timestamp of analysis */
  analyzedAt: Date;
}

// ============================================================================
// User Preferences Types
// ============================================================================

/**
 * User preferences for model routing
 */
export interface UserPreferences {
  /** Preferred provider (if any) */
  preferredProvider?: string;
  
  /** Preferred model (if any) */
  preferredModel?: string;
  
  /** Cost optimization level */
  costOptimization: 'low' | 'medium' | 'high';
  
  /** Latency priority */
  latencyPriority: 'low' | 'medium' | 'high';
  
  /** Quality vs speed trade-off */
  qualitySpeedTradeoff: 'quality' | 'balanced' | 'speed';
  
  /** Favorite models */
  favoriteModels: string[];
  
  /** Excluded models */
  excludedModels: string[];
  
  /** Maximum cost per request (in USD) */
  maxCostPerRequest?: number;
  
  /** Preferred capabilities */
  preferredCapabilities: string[];
}

// ============================================================================
// Provider Metrics Types
// ============================================================================

/**
 * Extended provider health with routing-specific metrics
 */
export interface RouterProviderHealth extends ProviderHealth {
  /** Provider ID */
  providerId: string;
  
  /** Current request queue length */
  queueLength: number;
  
  /** Average response time (ms) */
  avgResponseTime: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Price per 1K input tokens */
  priceInput: number;
  
  /** Price per 1K output tokens */
  priceOutput: number;
  
  /** Estimated cost for typical request */
  estimatedCost: number;
  
  /** Whether provider is currently overloaded */
  isOverloaded: boolean;
}

/**
 * Provider capability match score
 */
export interface ProviderMatch {
  providerId: string;
  modelId: string;
  modelName: string;
  
  /** How well the provider meets capability requirements */
  capabilityMatch: number; // 0-100
  
  /** Health score (0-100) */
  healthScore: number;
  
  /** Cost score (0-100, higher = cheaper) */
  costScore: number;
  
  /** Latency score (0-100, lower latency = higher score) */
  latencyScore: number;
  
  /** Quality score based on model capabilities */
  qualityScore: number;
  
  /** Overall match score (weighted average) */
  overallScore: number;
  
  /** Reason for selection */
  reason: string;
}

// ============================================================================
// Routing Configuration Types
// ============================================================================

/**
 * Configuration for the model router
 */
export interface RouterConfig {
  /** Default model to use when no routing needed */
  defaultModel: string;
  
  /** Enable automatic model selection */
  autoSelectEnabled: boolean;
  
  /** Enable cost optimization */
  costOptimizationEnabled: boolean;
  
  /** Enable health-based routing */
  healthBasedRouting: boolean;
  
  /** Enable fallback chains */
  fallbackEnabled: boolean;
  
  /** Maximum fallback attempts */
  maxFallbackAttempts: number;
  
  /** Weights for scoring */
  weights: RoutingWeights;
  
  /** Cache TTL for analysis results (ms) */
  analysisCacheTTL: number;
  
  /** Enable real-time health updates */
  realTimeHealthUpdates: boolean;
}

/**
 * Weights for calculating overall provider match score
 */
export interface RoutingWeights {
  capabilityMatch: number;  // How well provider meets requirements
  healthScore: number;      // Provider health
  costScore: number;        // Cost efficiency
  latencyScore: number;     // Response speed
  qualityScore: number;     // Model quality
  
  // Convenience weights for common scenarios
  costFocused?: RoutingWeights;
  latencyFocused?: RoutingWeights;
  qualityFocused?: RoutingWeights;
  balanced?: RoutingWeights;
}

/**
 * Routing strategy used for selection
 */
export type RoutingStrategyType = 
  | 'capability_first'
  | 'cost_optimized'
  | 'latency_optimized'
  | 'quality_optimized'
  | 'balanced'
  | 'health_aware'
  | 'user_preference'
  | 'fallback_chain'
  | 'default';

/**
 * Default routing weights
 */
export const DEFAULT_ROUTING_WEIGHTS: RoutingWeights = {
  capabilityMatch: 25,
  healthScore: 20,
  costScore: 20,
  latencyScore: 15,
  qualityScore: 20,
  
  costFocused: {
    capabilityMatch: 20,
    healthScore: 15,
    costScore: 40,
    latencyScore: 10,
    qualityScore: 15,
  },
  
  latencyFocused: {
    capabilityMatch: 20,
    healthScore: 15,
    costScore: 10,
    latencyScore: 45,
    qualityScore: 10,
  },
  
  qualityFocused: {
    capabilityMatch: 25,
    healthScore: 15,
    costScore: 10,
    latencyScore: 10,
    qualityScore: 40,
  },
  
  balanced: {
    capabilityMatch: 25,
    healthScore: 20,
    costScore: 20,
    latencyScore: 15,
    qualityScore: 20,
  },
};

// ============================================================================
// Routing Result Types
// ============================================================================

/**
 * Result of model selection
 */
export interface RoutingResult {
  /** Selected model ID */
  selectedModelId: string;
  
  /** Selected provider ID */
  selectedProviderId: string;
  
  /** All considered providers ranked */
  rankedProviders: ProviderMatch[];
  
  /** Fallback chain (if enabled) */
  fallbackChain: string[];
  
  /** Analysis used for routing */
  taskAnalysis: TaskAnalysis;
  
  /** Confidence in the selection (0-100) */
  confidence: number;
  
  /** Reason for the selection */
  reason: string;
  
  /** Routing strategy used */
  strategy: RoutingStrategyType;
  
  /** Estimated cost for this request */
  estimatedCost: number;
  
  /** Estimated latency for this request */
  estimatedLatency: number;
  
  /** Timestamp */
  routedAt: Date;
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Input for routing request
 */
export interface RoutingRequest {
  /** User messages */
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  
  /** Optional explicit model preference */
  requestedModel?: string;
  
  /** Optional user preferences */
  userPreferences?: Partial<UserPreferences>;
  
  /** Whether this is a streaming request */
  isStreaming?: boolean;
  
  /** Required capabilities */
  requiredCapabilities?: Partial<TaskCapabilities>;
  
  /** Preferred max tokens */
  preferredMaxTokens?: number;
}

/**
 * Router statistics for monitoring
 */
export interface RouterStats {
  /** Total requests routed */
  totalRequests: number;
  
  /** Successful routings */
  successfulRoutings: number;
  
  /** Failed routings */
  failedRoutings: number;
  
  /** Average routing time (ms) */
  avgRoutingTime: number;
  
  /** Model selection distribution */
  modelDistribution: Record<string, number>;
  
  /** Strategy usage distribution */
  strategyDistribution: Record<string, number>;
  
  /** Fallback usage count */
  fallbackCount: number;
  
  /** Cache hit rate */
  cacheHitRate: number;
}

// ============================================================================
// Context Window Management Types
// ============================================================================

/**
 * Context window usage analysis
 */
export interface ContextWindowAnalysis {
  /** Total available context window */
  availableContext: number;
  
  /** Estimated tokens for current request */
  estimatedTokens: number;
  
  /** Percentage of context that would be used */
  usagePercentage: number;
  
  /** Whether summarization is needed */
  needsSummarization: boolean;
  
  /** Recommended action */
  recommendation: 'use_model' | 'summarize' | 'reduce_context' | 'upgrade_model';
  
  /** Suggested models with larger context */
  suggestedModels: Array<{
    modelId: string;
    contextWindow: number;
    costIncrease: number;
  }>;
}

/**
 * Summarization strategy
 */
export interface SummarizationStrategy {
  /** Whether to summarize */
  enabled: boolean;
  
  /** Preserve recent messages count */
  preserveRecentMessages: number;
  
  /** Summary depth */
  summaryDepth: 'brief' | 'moderate' | 'detailed';
  
  /** System prompt for summarization */
  systemPrompt?: string;
}
