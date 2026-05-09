/**
 * Keyword-Based Fallback Classification
 *
 * Safety net for when all LLM providers fail.
 * Uses simple keyword matching to provide a basic classification.
 * Always returns low confidence (<50%) to indicate degraded quality.
 *
 * This is intentionally simple and rule-based - NOT using any LLM.
 */

import type { GenerateResult } from './providers/base'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'fallback' })

/**
 * Keyword patterns for classification
 */
const BUYER_KEYWORDS = [
  'visite',
  'visiter',
  'voir',
  'achat',
  'acheter',
  'acquérir',
  'cherche',
  'recherche',
  'intéressé',
  'intéresse',
  'disponible',
  'disponibilité',
]

const SELLER_KEYWORDS = [
  'vendre',
  'vente',
  'vendeur',
  'estimation',
  'estimer',
  'évaluation',
  'évaluer',
  'mandat',
  'prix de vente',
  'mettre en vente',
]

/**
 * Keyword-based email classification
 *
 * Used as last resort when all LLM providers fail.
 * Returns minimal classification with low confidence.
 *
 * Rules:
 * - Check for seller keywords first (more specific)
 * - Then check for buyer keywords
 * - Default to "autre" if no keywords found
 * - Always return confidence < 50%
 * - Always return intent_type: null
 * - Always return urgency_level: 'normale'
 *
 * @param prompt - The user prompt (contains email content)
 * @returns GenerateResult with JSON classification
 */
export function keywordBasedClassification(prompt: string): GenerateResult {
  const startTime = Date.now()
  const lowerPrompt = prompt.toLowerCase()

  logger.warn('Using keyword-based fallback classification', {
    promptLength: prompt.length,
  })

  // Count keyword matches
  let classificationType: 'acheteur' | 'vendeur' | 'autre' = 'autre'
  const sellerMatches = SELLER_KEYWORDS.filter(keyword => lowerPrompt.includes(keyword)).length
  const buyerMatches = BUYER_KEYWORDS.filter(keyword => lowerPrompt.includes(keyword)).length

  // Seller keywords are more specific, check them first
  if (sellerMatches > 0) {
    classificationType = 'vendeur'
  } else if (buyerMatches > 0) {
    classificationType = 'acheteur'
  }

  // Build minimal classification response
  const classification = {
    classification_type: classificationType,
    confidence_score: 40, // Always low confidence to indicate fallback
    intent_type: null, // Cannot determine intent without LLM
    urgency_level: 'normale', // Safe default
    keywords_detected: [], // Don't expose our simple keywords
    reasoning: 'Classification basée sur des mots-clés (mode dégradé)',
  }

  const latencyMs = Date.now() - startTime

  logger.info('Keyword-based classification completed', {
    classification_type: classificationType,
    confidence_score: 40,
    latencyMs,
    sellerMatches,
    buyerMatches,
  })

  return {
    content: JSON.stringify(classification),
    tokensInput: 0, // No LLM used
    tokensOutput: 0, // No LLM used
    latencyMs,
    model: 'keyword-fallback',
    cost: 0, // Free
  }
}

/**
 * Check if a classification result is from keyword fallback
 *
 * @param result - GenerateResult to check
 * @returns true if result is from keyword fallback
 */
export function isKeywordFallback(result: GenerateResult): boolean {
  return result.model === 'keyword-fallback'
}
