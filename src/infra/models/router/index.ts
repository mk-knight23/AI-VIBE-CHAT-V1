/**
 * Model Router
 * 
 * Intelligent model selection based on task complexity, cost optimization,
 * latency requirements, and user preferences.
 */

import type {
  RouterConfig,
  RoutingRequest,
  RoutingResult,
  TaskAnalysis,
  ProviderMatch,
  RouterProviderHealth,
  RouterStats,
  UserPreferences,
  RoutingStrategyType
} from './types';
import type { ModelRegistryEntry } from '../index';
import { MODEL_REGISTRY, providerHealthMonitor } from '../modelRegistry';
import { TaskAnalyzer } from './taskAnalyzer';
import { calculateProviderScores, StrategyFactory } from './strategies';
import { DEFAULT_ROUTING_WEIGHTS } from './types';

/**
 * Default router configuration
 */
export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  defaultModel: 'openai/gpt-4o-mini',
  autoSelectEnabled: true,
  costOptimizationEnabled: true,
  healthBasedRouting: true,
  fallbackEnabled: true,
  maxFallbackAttempts: 3,
  weights: DEFAULT_ROUTING_WEIGHTS.balanced!,
  analysisCacheTTL: 60000, // 1 minute
  realTimeHealthUpdates: false
};

/**
 * Main Model Router class
 */
export class ModelRouter {
  private config: RouterConfig;
  private taskAnalyzer: TaskAnalyzer;
  private healthCache: Map<string, RouterProviderHealth>;
  private healthCacheExpiry: Map<string, number>;
  private stats: RouterStats;
  private analysisCache: Map<string, { analysis: TaskAnalysis; expiry: number }>;
  
  constructor(config: Partial<RouterConfig> = {}) {
    this.config = { ...DEFAULT_ROUTER_CONFIG, ...config };
    this.taskAnalyzer = new TaskAnalyzer();
    this.healthCache = new Map();
    this.healthCacheExpiry = new Map();
    this.analysisCache = new Map();
    this.stats = this.initStats();
  }
  
  /**
   * Route a request to the optimal model
   */
  async route(request: RoutingRequest): Promise<RoutingResult> {
    const startTime = performance.now();
    this.stats.totalRequests++;
    
    try {
      // If user explicitly requested a model, use it directly
      if (request.requestedModel) {
        return this.handleExplicitModel(request.requestedModel, request);
      }
      
      // Analyze the task
      const analysis = await this.analyzeTask(request);
      
      // Get available models and provider health
      const [availableModels, providerHealths] = await Promise.all([
        this.getAvailableModels(),
        this.getProviderHealths()
      ]);
      
      // Calculate provider match scores
      const providerMatches = this.calculateAllProviderScores(
        analysis,
        availableModels,
        providerHealths
      );
      
      // Select the best strategy based on user preferences
      const strategyName = this.selectStrategy(request.userPreferences);
      
      // Get the strategy and rank providers
      const strategy = StrategyFactory.getStrategy(strategyName);
      const rankedProviders = strategy.rankProviders(providerMatches, analysis, availableModels);
      
      // Get the best provider
      const bestProvider = rankedProviders[0];
      
      if (!bestProvider) {
        // Fallback to default model if no providers available
        return this.createFallbackResult(analysis, startTime);
      }
      
      // Build fallback chain
      const fallbackChain = rankedProviders
        .slice(1, this.config.maxFallbackAttempts + 1)
        .map(p => p.modelId);
      
      // Estimate cost and latency
      const estimatedCost = this.estimateCost(bestProvider, analysis);
      const estimatedLatency = this.estimateLatency(bestProvider, providerHealths);
      
      // Create result
      const result: RoutingResult = {
        selectedModelId: bestProvider.modelId,
        selectedProviderId: bestProvider.providerId,
        rankedProviders,
        fallbackChain,
        taskAnalysis: analysis,
        confidence: this.calculateConfidence(bestProvider, rankedProviders),
        reason: bestProvider.reason,
        strategy: strategyName,
        estimatedCost,
        estimatedLatency,
        routedAt: new Date()
      };
      
      // Update stats
      this.stats.successfulRoutings++;
      this.updateStats(result);
      
      return result;
    } catch (error) {
      this.stats.failedRoutings++;
      throw error;
    }
  }
  
  /**
   * Analyze a task
   */
  private async analyzeTask(request: RoutingRequest): Promise<TaskAnalysis> {
    const cacheKey = this.getAnalysisCacheKey(request.messages);
    
    // Check cache
    const cached = this.analysisCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.analysis;
    }
    
    // Analyze the task
    const analysis = this.taskAnalyzer.analyze(request.messages, {
      isFollowUp: request.messages.length > 1,
      conversationHistoryLength: request.messages.length - 1,
      userPreferences: request.userPreferences
    });
    
    // Cache the analysis
    this.analysisCache.set(cacheKey, {
      analysis,
      expiry: Date.now() + this.config.analysisCacheTTL
    });
    
    return analysis;
  }
  
  /**
   * Get available models with their current status
   */
  private async getAvailableModels(): Promise<ModelRegistryEntry[]> {
    return MODEL_REGISTRY.filter(model => 
      model.status === 'available' && 
      this.config.autoSelectEnabled
    );
  }
  
  /**
   * Get provider health information
   */
  private async getProviderHealths(): Promise<Map<string, RouterProviderHealth>> {
    const healths = new Map<string, RouterProviderHealth>();
    
    // Get base health from the health monitor
    const baseHealths = await providerHealthMonitor.getAllProviderHealth();
    
    // Enhance with routing-specific metrics
    for (const [providerId, health] of Object.entries(baseHealths)) {
      const enhanced: RouterProviderHealth = {
        ...health,
        providerId,
        queueLength: Math.floor(Math.random() * 10), // Simulated for demo
        avgResponseTime: health.latency ?? 1000,
        successRate: health.status === 'healthy' ? 0.98 : 0.8,
        priceInput: this.getProviderPrice(providerId, 'input'),
        priceOutput: this.getProviderPrice(providerId, 'output'),
        estimatedCost: 0.01,
        isOverloaded: health.status === 'degraded'
      };
      
      healths.set(providerId, enhanced);
    }
    
    return healths;
  }
  
  /**
   * Get provider price (simplified - in production this would come from actual pricing)
   */
  private getProviderPrice(providerId: string, type: 'input' | 'output'): number {
    const prices: Record<string, { input: number; output: number }> = {
      openrouter: { input: 0.005, output: 0.015 },
      anthropic: { input: 0.003, output: 0.015 },
      openai: { input: 0.01, output: 0.03 },
      groq: { input: 0.001, output: 0.003 },
      gemini: { input: 0.0005, output: 0.0015 },
      ollama: { input: 0, output: 0 } // Local, free
    };
    
    return prices[providerId]?.[type] ?? 0.01;
  }
  
  /**
   * Calculate scores for all providers
   */
  private calculateAllProviderScores(
    analysis: TaskAnalysis,
    availableModels: ModelRegistryEntry[],
    providerHealths: Map<string, RouterProviderHealth>
  ): ProviderMatch[] {
    return availableModels.map(model => {
      const health = providerHealths.get(model.providerId) ?? null;
      return calculateProviderScores(model, analysis, health, this.config.weights);
    });
  }
  
  /**
   * Select the appropriate strategy based on user preferences
   */
  private selectStrategy(userPreferences?: Partial<UserPreferences>): RoutingStrategyType {
    if (!userPreferences) {
      return 'balanced';
    }
    
    // Use quality/speed tradeoff to determine strategy
    switch (userPreferences.qualitySpeedTradeoff) {
      case 'speed':
        return 'latency_optimized';
      case 'quality':
        return 'quality_optimized';
      default:
        // Check for cost optimization
        if (userPreferences.costOptimization === 'high') {
          return 'cost_optimized';
        }
        return 'balanced';
    }
  }
  
  /**
   * Handle explicit model selection by user
   */
  private handleExplicitModel(modelId: string, request: RoutingRequest): RoutingResult {
    const model = MODEL_REGISTRY.find(m => m.id === modelId);
    const analysis = this.taskAnalyzer.analyze(request.messages);
    
    if (!model) {
      return this.createFallbackResult(analysis, performance.now());
    }
    
    return {
      selectedModelId: modelId,
      selectedProviderId: model.providerId,
      rankedProviders: [{
        providerId: model.providerId,
        modelId: model.id,
        modelName: model.name,
        capabilityMatch: 100,
        healthScore: 50,
        costScore: 50,
        latencyScore: 50,
        qualityScore: 50,
        overallScore: 75,
        reason: 'User-selected model'
      }],
      fallbackChain: [],
      taskAnalysis: analysis,
      confidence: 100,
      reason: 'Explicit user selection',
      strategy: 'user_preference',
      estimatedCost: 0.01,
      estimatedLatency: 1000,
      routedAt: new Date()
    };
  }
  
  /**
   * Create a fallback result when no providers are available
   */
  private createFallbackResult(analysis: TaskAnalysis, startTime: number): RoutingResult {
    const fallbackModel = this.config.defaultModel;
    const model = MODEL_REGISTRY.find(m => m.id === fallbackModel) || MODEL_REGISTRY[0];
    
    return {
      selectedModelId: model?.id ?? 'unknown',
      selectedProviderId: model?.providerId ?? 'unknown',
      rankedProviders: [],
      fallbackChain: [],
      taskAnalysis: analysis,
      confidence: 0,
      reason: 'No suitable providers found, using fallback',
      strategy: 'default',
      estimatedCost: 0.01,
      estimatedLatency: 5000,
      routedAt: new Date()
    };
  }
  
  /**
   * Estimate cost for a provider
   */
  private estimateCost(provider: ProviderMatch, analysis: TaskAnalysis): number {
    const inputPrice = 0.01; // Simplified - would use actual pricing
    const outputPrice = 0.03;
    
    return (
      inputPrice * analysis.estimatedInputTokens / 1000 +
      outputPrice * analysis.estimatedOutputTokens / 1000
    );
  }
  
  /**
   * Estimate latency for a provider
   */
  private estimateLatency(
    provider: ProviderMatch,
    healths: Map<string, RouterProviderHealth>
  ): number {
    const health = healths.get(provider.providerId);
    return health?.avgResponseTime ?? 1000;
  }
  
  /**
   * Calculate confidence in the selection
   */
  private calculateConfidence(best: ProviderMatch, all: ProviderMatch[]): number {
    if (all.length === 1) return 80;
    
    // Check how much better the best is compared to second place
    const secondBest = all[1];
    if (!secondBest) return best.overallScore;
    
    const scoreDiff = best.overallScore - secondBest.overallScore;
    return Math.min(100, 70 + scoreDiff * 2);
  }
  
  /**
   * Get analysis cache key
   */
  private getAnalysisCacheKey(messages: Array<{ role: string; content: string }>): string {
    const content = messages.map(m => m.content).join('|');
    return `analysis_${content.substring(0, 100)}_${content.length}`;
  }
  
  /**
   * Initialize stats
   */
  private initStats(): RouterStats {
    return {
      totalRequests: 0,
      successfulRoutings: 0,
      failedRoutings: 0,
      avgRoutingTime: 0,
      modelDistribution: {},
      strategyDistribution: {},
      fallbackCount: 0,
      cacheHitRate: 0
    };
  }
  
  /**
   * Update statistics
   */
  private updateStats(result: RoutingResult): void {
    // Update model distribution
    const modelId = result.selectedModelId;
    this.stats.modelDistribution[modelId] = (this.stats.modelDistribution[modelId] || 0) + 1;
    
    // Update strategy distribution
    const {strategy} = result;
    this.stats.strategyDistribution[strategy] = (this.stats.strategyDistribution[strategy] || 0) + 1;
    
    // Update fallback count
    if (result.fallbackChain.length > 0) {
      this.stats.fallbackCount++;
    }
  }
  
  /**
   * Get current statistics
   */
  getStats(): RouterStats {
    return { ...this.stats };
  }
  
  /**
   * Clear caches
   */
  clearCaches(): void {
    this.healthCache.clear();
    this.healthCacheExpiry.clear();
    this.analysisCache.clear();
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const modelRouter = new ModelRouter();

/**
 * Convenience function for routing a request
 */
export async function routeRequest(request: RoutingRequest): Promise<RoutingResult> {
  return modelRouter.route(request);
}

/**
 * Get available strategies
 */
export function getAvailableStrategies(): string[] {
  return StrategyFactory.getAvailableStrategies();
}
