/**
 * Routing Strategies
 * 
 * Implements different routing strategies for model selection:
 * - Cost optimized
 * - Latency optimized
 * - Quality optimized
 * - Balanced
 * - Capability-first
 */

import type {
  TaskAnalysis,
  ProviderMatch,
  RouterProviderHealth,
  RoutingWeights,
  TaskCapabilities
} from './types';
import type { ModelRegistryEntry } from '../index';
import { DEFAULT_ROUTING_WEIGHTS } from './types';

/**
 * Base routing strategy interface
 */
export interface RoutingStrategy {
  /**
   * Rank providers based on the strategy
   */
  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[];
  
  /**
   * Get the strategy name
   */
  getName(): string;
}

/**
 * Cost-optimized routing strategy
 * Prioritizes cheaper models while maintaining quality requirements
 */
export class CostOptimizedStrategy implements RoutingStrategy {
  getName(): string {
    return 'cost_optimized';
  }

  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[] {
    // Filter out providers that don't meet capability requirements
    const qualified = providers.filter(p => p.capabilityMatch >= 70);
    
    // Apply cost-focused weighting
    const weighted = qualified.map(p => ({
      ...p,
      overallScore: this.calculateScore(p, task)
    }));
    
    // Sort by overall score descending
    return weighted.sort((a, b) => b.overallScore - a.overallScore);
  }

  private calculateScore(provider: ProviderMatch, task: TaskAnalysis): number {
    const weights = DEFAULT_ROUTING_WEIGHTS.costFocused!;
    
    // Adjust for task complexity - complex tasks need better models
    const complexityMultiplier = 1 + (task.complexityScore / 100) * 0.5;
    
    return (
      provider.capabilityMatch * weights.capabilityMatch +
      provider.healthScore * weights.healthScore +
      provider.costScore * weights.costScore * complexityMultiplier +
      provider.latencyScore * weights.latencyScore +
      provider.qualityScore * weights.qualityScore
    ) / 100;
  }
}

/**
 * Latency-optimized routing strategy
 * Prioritizes faster models, ideal for real-time applications
 */
export class LatencyOptimizedStrategy implements RoutingStrategy {
  getName(): string {
    return 'latency_optimized';
  }

  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[] {
    // Filter out unhealthy providers
    const healthy = providers.filter(p => p.healthScore >= 50);
    
    // Apply latency-focused weighting
    const weighted = healthy.map(p => ({
      ...p,
      overallScore: this.calculateScore(p, task)
    }));
    
    return weighted.sort((a, b) => b.overallScore - a.overallScore);
  }

  private calculateScore(provider: ProviderMatch, task: TaskAnalysis): number {
    const weights = DEFAULT_ROUTING_WEIGHTS.latencyFocused!;
    
    // Boost score for fast response tasks
    const fastResponseBonus = task.requiredCapabilities.fastResponse ? 20 : 0;
    
    return Math.min(100, (
      provider.capabilityMatch * weights.capabilityMatch +
      provider.healthScore * weights.healthScore +
      provider.costScore * weights.costScore +
      provider.latencyScore * weights.latencyScore +
      provider.qualityScore * weights.qualityScore +
      fastResponseBonus
    ) / 100);
  }
}

/**
 * Quality-optimized routing strategy
 * Prioritizes model quality and capabilities over cost/latency
 */
export class QualityOptimizedStrategy implements RoutingStrategy {
  getName(): string {
    return 'quality_optimized';
  }

  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[] {
    // Quality strategy prioritizes capability match and quality score
    const qualified = providers.filter(p => p.capabilityMatch >= 60);
    
    const weighted = qualified.map(p => ({
      ...p,
      overallScore: this.calculateScore(p, task)
    }));
    
    return weighted.sort((a, b) => b.overallScore - a.overallScore);
  }

  private calculateScore(provider: ProviderMatch, task: TaskAnalysis): number {
    const weights = DEFAULT_ROUTING_WEIGHTS.qualityFocused!;
    
    // Boost for complex tasks
    const complexityBonus = task.complexityScore * 0.3;
    
    return Math.min(100, (
      provider.capabilityMatch * weights.capabilityMatch +
      provider.healthScore * weights.healthScore +
      provider.costScore * weights.costScore +
      provider.latencyScore * weights.latencyScore +
      provider.qualityScore * weights.qualityScore +
      complexityBonus
    ) / 100);
  }
}

/**
 * Balanced routing strategy
 * Balances cost, latency, and quality
 */
export class BalancedStrategy implements RoutingStrategy {
  getName(): string {
    return 'balanced';
  }

  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[] {
    const weighted = providers.map(p => ({
      ...p,
      overallScore: this.calculateScore(p, task)
    }));
    
    return weighted.sort((a, b) => b.overallScore - a.overallScore);
  }

  private calculateScore(provider: ProviderMatch, task: TaskAnalysis): number {
    const weights = DEFAULT_ROUTING_WEIGHTS.balanced!;
    
    return (
      provider.capabilityMatch * weights.capabilityMatch +
      provider.healthScore * weights.healthScore +
      provider.costScore * weights.costScore +
      provider.latencyScore * weights.latencyScore +
      provider.qualityScore * weights.qualityScore
    ) / 100;
  }
}

/**
 * Capability-first routing strategy
 * Prioritizes models that can handle the required capabilities
 */
export class CapabilityFirstStrategy implements RoutingStrategy {
  getName(): string {
    return 'capability_first';
  }

  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[] {
    // Sort by capability match first
    const sorted = [...providers].sort((a, b) => {
      // Primary sort: capability match
      if (b.capabilityMatch !== a.capabilityMatch) {
        return b.capabilityMatch - a.capabilityMatch;
      }
      // Secondary sort: quality
      return b.qualityScore - a.qualityScore;
    });
    
    // Calculate overall score based on capability priority
    return sorted.map(p => ({
      ...p,
      overallScore: this.calculateScore(p, task)
    }));
  }

  private calculateScore(provider: ProviderMatch, task: TaskAnalysis): number {
    // High weight on capability match
    const weights: RoutingWeights = {
      capabilityMatch: 40,
      healthScore: 15,
      costScore: 15,
      latencyScore: 15,
      qualityScore: 15
    };
    
    return (
      provider.capabilityMatch * weights.capabilityMatch +
      provider.healthScore * weights.healthScore +
      provider.costScore * weights.costScore +
      provider.latencyScore * weights.latencyScore +
      provider.qualityScore * weights.qualityScore
    ) / 100;
  }
}

/**
 * Health-aware routing strategy
 * Prioritizes healthy providers with good latency
 */
export class HealthAwareStrategy implements RoutingStrategy {
  getName(): string {
    return 'health_aware';
  }

  rankProviders(
    providers: ProviderMatch[],
    task: TaskAnalysis,
    availableModels: ModelRegistryEntry[]
  ): ProviderMatch[] {
    // Filter out unhealthy providers first
    const healthy = providers.filter(p => p.healthScore >= 60);
    
    const weighted = healthy.map(p => ({
      ...p,
      overallScore: this.calculateScore(p, task)
    }));
    
    return weighted.sort((a, b) => b.overallScore - a.overallScore);
  }

  private calculateScore(provider: ProviderMatch, task: TaskAnalysis): number {
    const weights: RoutingWeights = {
      capabilityMatch: 20,
      healthScore: 30,
      costScore: 15,
      latencyScore: 25,
      qualityScore: 10
    };
    
    return (
      provider.capabilityMatch * weights.capabilityMatch +
      provider.healthScore * weights.healthScore +
      provider.costScore * weights.costScore +
      provider.latencyScore * weights.latencyScore +
      provider.qualityScore * weights.qualityScore
    ) / 100;
  }
}

/**
 * Strategy factory for creating routing strategies
 */
export class StrategyFactory {
  private static strategies: Map<string, RoutingStrategy> = new Map([
    ['cost_optimized', new CostOptimizedStrategy()],
    ['latency_optimized', new LatencyOptimizedStrategy()],
    ['quality_optimized', new QualityOptimizedStrategy()],
    ['balanced', new BalancedStrategy()],
    ['capability_first', new CapabilityFirstStrategy()],
    ['health_aware', new HealthAwareStrategy()]
  ]);

  /**
   * Get a strategy by name
   */
  static getStrategy(name: string): RoutingStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      return new BalancedStrategy(); // Default to balanced
    }
    return strategy;
  }

  /**
   * Get all available strategy names
   */
  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Register a custom strategy
   */
  static registerStrategy(name: string, strategy: RoutingStrategy): void {
    this.strategies.set(name, strategy);
  }
}

/**
 * Calculate provider match scores based on task requirements
 */
export function calculateProviderScores(
  model: ModelRegistryEntry,
  task: TaskAnalysis,
  health: RouterProviderHealth | null,
  weights: RoutingWeights = DEFAULT_ROUTING_WEIGHTS.balanced
): ProviderMatch {
  // Capability match score
  const capabilityMatch = calculateCapabilityMatch(model, task.requiredCapabilities);
  
  // Health score (0-100)
  const healthScore = health 
    ? calculateHealthScore(health)
    : 50; // Default to 50 if no health data
  
  // Cost score (0-100, higher = cheaper)
  const costScore = calculateCostScore(model, task);
  
  // Latency score (0-100, lower latency = higher score)
  const latencyScore = health?.avgResponseTime 
    ? calculateLatencyScore(health.avgResponseTime)
    : 50;
  
  // Quality score based on model capabilities
  const qualityScore = calculateQualityScore(model);
  
  // Overall score
  const overallScore = (
    capabilityMatch * weights.capabilityMatch +
    healthScore * weights.healthScore +
    costScore * weights.costScore +
    latencyScore * weights.latencyScore +
    qualityScore * weights.qualityScore
  ) / 100;

  return {
    providerId: model.providerId,
    modelId: model.id,
    modelName: model.name,
    capabilityMatch,
    healthScore,
    costScore,
    latencyScore,
    qualityScore,
    overallScore,
    reason: generateSelectionReason(model, task, overallScore)
  };
}

/**
 * Calculate how well a model matches required capabilities
 */
function calculateCapabilityMatch(
  model: ModelRegistryEntry,
  required: TaskCapabilities
): number {
  let score = 50; // Base score
  const modelCapabilities = new Set(model.capabilities);
  
  // Check vision capability
  if (required.vision && modelCapabilities.has('vision')) score += 15;
  else if (required.vision) score -= 20;
  
  // Check coding capability
  if (required.coding && modelCapabilities.has('coding')) score += 15;
  else if (required.coding) score -= 20;
  
  // Check reasoning capability
  if (required.reasoning && modelCapabilities.has('reasoning')) score += 10;
  
  // Check analysis capability
  if (required.analysis && modelCapabilities.has('analysis')) score += 10;
  
  // Check context window requirements
  if (required.largeContext && model.contextWindow >= 100000) score += 10;
  else if (required.largeContext && model.contextWindow < 32000) score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate health score from provider health metrics
 */
function calculateHealthScore(health: RouterProviderHealth): number {
  let score = 50; // Base score
  
  switch (health.status) {
    case 'healthy':
      score += 40;
      break;
    case 'degraded':
      score += 10;
      break;
    case 'unhealthy':
      score -= 30;
      break;
    case 'unknown':
      score += 0;
      break;
  }
  
  // Factor in success rate
  if (health.successRate !== undefined) {
    score += health.successRate * 20;
  }
  
  // Factor in queue length (lower is better)
  if (health.queueLength !== undefined) {
    score -= Math.min(20, health.queueLength * 2);
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate cost score (0-100, higher = cheaper)
 */
function calculateCostScore(model: ModelRegistryEntry, task: TaskAnalysis): number {
  // Default prices if not specified
  const inputPrice = model.pricing?.input ?? 0.01;
  const outputPrice = model.pricing?.output ?? 0.03;
  
  // Estimate cost for this task
  const estimatedCost = (
    inputPrice * task.estimatedInputTokens / 1000 +
    outputPrice * task.estimatedOutputTokens / 1000
  );
  
  // Map cost to score (0-100)
  // $0.01 or less = 100, $0.10+ = 0
  const maxCost = 0.10;
  return Math.max(0, 100 - (estimatedCost / maxCost) * 100);
}

/**
 * Calculate latency score from response time (0-100)
 */
function calculateLatencyScore(avgResponseTime: number): number {
  // Map latency to score
  // <500ms = 100, >5000ms = 0
  if (avgResponseTime < 500) return 100;
  if (avgResponseTime > 5000) return 0;
  
  return 100 - ((avgResponseTime - 500) / 4500) * 100;
}

/**
 * Calculate quality score based on model properties
 */
function calculateQualityScore(model: ModelRegistryEntry): number {
  let score = 50; // Base score
  
  // Higher priority models get better scores
  score += (3 - model.priority) * 15;
  
  // Larger context windows indicate more capable models
  if (model.contextWindow >= 1000000) score += 15;
  else if (model.contextWindow >= 100000) score += 10;
  else if (model.contextWindow >= 32000) score += 5;
  
  // More capabilities = higher quality
  score += Math.min(15, model.capabilities.length * 2);
  
  return Math.min(100, score);
}

/**
 * Generate a human-readable selection reason
 */
function generateSelectionReason(
  model: ModelRegistryEntry,
  task: TaskAnalysis,
  score: number
): string {
  const reasons: string[] = [];
  
  // Capability reasons
  if (task.requiredCapabilities.coding && model.capabilities.includes('coding')) {
    reasons.push('excellent coding support');
  }
  if (task.requiredCapabilities.vision && model.capabilities.includes('vision')) {
    reasons.push('supports vision/multimodal input');
  }
  if (task.requiredCapabilities.reasoning && model.capabilities.includes('reasoning')) {
    reasons.push('strong reasoning capabilities');
  }
  
  // Performance reasons
  if (model.priority === 1) {
    reasons.push('high priority model');
  }
  if (model.contextWindow >= 100000) {
    reasons.push('large context window');
  }
  
  // Task-specific reasons
  if (task.category === 'coding' && model.tags.includes('coding')) {
    reasons.push('specialized for coding tasks');
  }
  
  if (reasons.length === 0) {
    return score > 70 ? 'Good match for this task' : 'Acceptable match';
  }
  
  return reasons.slice(0, 3).join('; ');
}
