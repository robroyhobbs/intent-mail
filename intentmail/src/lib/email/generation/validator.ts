// =============================================================================
// EMAIL VALIDATOR - Ported from email-system
// =============================================================================

import type {
  GeneratedEmail,
  IntentConfig,
  BrandConfig,
  ValidationResult,
  ValidationIssue,
} from '../types'

// =============================================================================
// VALIDATION RULES
// =============================================================================

const CORPORATE_SPEAK = [
  'synergy',
  'leverage',
  'paradigm',
  'ecosystem',
  'scalable',
  'holistic',
  'seamlessly',
  'revolutionary',
  'game-changing',
  'disrupt',
  'innovative solution',
  'cutting-edge',
  'best-in-class',
  'world-class',
  'next-generation',
]

const VAGUE_LANGUAGE = [
  'many',
  'some',
  'various',
  'several',
  'numerous',
  'a lot of',
  'a number of',
  'quite a few',
]

const PASSIVE_INDICATORS = [
  'was made',
  'is being',
  'has been',
  'will be done',
  'were created',
  'can be seen',
  'should be noted',
]

// =============================================================================
// VALIDATION CHECKS
// =============================================================================

function checkSubjectLength(
  subject: string,
  maxLength: number = 50
): ValidationIssue | null {
  if (subject.length > maxLength) {
    return {
      severity: 'blocking',
      message: `Subject line is ${subject.length} characters, exceeds maximum of ${maxLength}`,
      field: 'subject',
      suggestion: 'Shorten the subject line to improve deliverability and mobile display',
    }
  }
  return null
}

function checkBannedPhrases(
  text: string,
  bannedPhrases: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lowerText = text.toLowerCase()

  for (const phrase of bannedPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      issues.push({
        severity: 'blocking',
        message: `Contains banned phrase: "${phrase}"`,
        field: 'content',
        suggestion: 'Remove or rephrase to match brand voice',
      })
    }
  }

  return issues
}

function checkCorporateSpeak(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lowerText = text.toLowerCase()

  for (const phrase of CORPORATE_SPEAK) {
    if (lowerText.includes(phrase)) {
      issues.push({
        severity: 'blocking',
        message: `Contains corporate jargon: "${phrase}"`,
        field: 'content',
        suggestion: 'Use simpler, more direct language',
      })
    }
  }

  return issues
}

function checkMultipleCTAs(html: string): ValidationIssue | null {
  // Count buttons/CTAs in the email
  const buttonMatches = html.match(/<a[^>]*style="[^"]*display:\s*inline-block[^"]*"[^>]*>/gi)
  if (buttonMatches && buttonMatches.length > 1) {
    return {
      severity: 'blocking',
      message: `Email contains ${buttonMatches.length} CTAs, should have only one primary CTA`,
      field: 'content',
      suggestion: 'Keep only the primary call-to-action button',
    }
  }
  return null
}

function checkForbiddenContent(
  text: string,
  mustNotInclude: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lowerText = text.toLowerCase()

  for (const forbidden of mustNotInclude) {
    if (lowerText.includes(forbidden.toLowerCase())) {
      issues.push({
        severity: 'blocking',
        message: `Contains forbidden content: "${forbidden}"`,
        field: 'content',
        suggestion: `Remove content related to "${forbidden}"`,
      })
    }
  }

  return issues
}

function checkParagraphLength(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const paragraphs = text.split(/\n\n+/)

  for (let i = 0; i < paragraphs.length; i++) {
    const sentences = paragraphs[i].split(/[.!?]+/).filter((s) => s.trim())
    if (sentences.length > 4) {
      issues.push({
        severity: 'warning',
        message: `Paragraph ${i + 1} has ${sentences.length} sentences (max recommended: 4)`,
        field: 'content',
        suggestion: 'Break into smaller paragraphs for better readability',
      })
    }
  }

  return issues
}

function checkPassiveVoice(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lowerText = text.toLowerCase()

  for (const indicator of PASSIVE_INDICATORS) {
    if (lowerText.includes(indicator)) {
      issues.push({
        severity: 'warning',
        message: `Contains passive voice: "${indicator}"`,
        field: 'content',
        suggestion: 'Use active voice for more engaging copy',
      })
      break // Only report once
    }
  }

  return issues
}

function checkVagueLanguage(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lowerText = text.toLowerCase()

  for (const vague of VAGUE_LANGUAGE) {
    const regex = new RegExp(`\\b${vague}\\b`, 'i')
    if (regex.test(lowerText)) {
      issues.push({
        severity: 'warning',
        message: `Contains vague language: "${vague}"`,
        field: 'content',
        suggestion: 'Replace with specific numbers or quantities',
      })
    }
  }

  return issues
}

function checkEmailLength(text: string): ValidationIssue | null {
  const wordCount = text.split(/\s+/).length
  if (wordCount > 400) {
    return {
      severity: 'warning',
      message: `Email is ${wordCount} words (recommended max: 400)`,
      field: 'content',
      suggestion: 'Shorten the email for better engagement',
    }
  }
  return null
}

function checkPersonalization(text: string): ValidationIssue | null {
  const hasPersonalization =
    text.includes('{{') || text.includes('Hey ') || text.includes('Hi ')

  if (!hasPersonalization) {
    return {
      severity: 'suggestion',
      message: 'No personalization detected',
      field: 'content',
      suggestion: 'Consider adding personalization (name, company) for better engagement',
    }
  }
  return null
}

function checkSpecificity(text: string): ValidationIssue | null {
  const hasNumbers = /\d+/.test(text)
  const hasSpecifics =
    hasNumbers ||
    text.includes('%') ||
    text.includes('$') ||
    text.includes('minutes') ||
    text.includes('seconds')

  if (!hasSpecifics) {
    return {
      severity: 'suggestion',
      message: 'No specific numbers or metrics found',
      field: 'content',
      suggestion: 'Add specific numbers (e.g., "in 60 seconds", "50% faster") for credibility',
    }
  }
  return null
}

// =============================================================================
// MAIN VALIDATOR
// =============================================================================

export function validateEmail(
  email: GeneratedEmail,
  intent: IntentConfig,
  brand: BrandConfig
): ValidationResult {
  const blocking: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const suggestions: ValidationIssue[] = []

  // Blocking checks
  const subjectIssue = checkSubjectLength(
    email.subject,
    intent.subject.maxLength
  )
  if (subjectIssue) blocking.push(subjectIssue)

  blocking.push(...checkBannedPhrases(email.text, brand.voice.dontSay))
  blocking.push(...checkCorporateSpeak(email.text))

  const ctaIssue = checkMultipleCTAs(email.html)
  if (ctaIssue) blocking.push(ctaIssue)

  blocking.push(
    ...checkForbiddenContent(email.text, intent.content.mustNotInclude)
  )

  // Warning checks
  warnings.push(...checkParagraphLength(email.text))
  warnings.push(...checkPassiveVoice(email.text))
  warnings.push(...checkVagueLanguage(email.text))

  const lengthIssue = checkEmailLength(email.text)
  if (lengthIssue) warnings.push(lengthIssue)

  // Suggestion checks
  const personalizationIssue = checkPersonalization(email.text)
  if (personalizationIssue) suggestions.push(personalizationIssue)

  const specificityIssue = checkSpecificity(email.text)
  if (specificityIssue) suggestions.push(specificityIssue)

  // Calculate score
  const score = Math.max(
    0,
    100 - blocking.length * 25 - warnings.length * 10 - suggestions.length * 2
  )

  return {
    passed: blocking.length === 0,
    blocking,
    warnings,
    suggestions,
    score,
  }
}

// =============================================================================
// SUBJECT LINE VALIDATOR
// =============================================================================

export function validateSubject(
  subject: string,
  maxLength: number = 50
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Length check
  if (subject.length > maxLength) {
    issues.push({
      severity: 'blocking',
      message: `Subject is ${subject.length} chars, max is ${maxLength}`,
      field: 'subject',
    })
  }

  // All caps check
  if (subject === subject.toUpperCase() && subject.length > 3) {
    issues.push({
      severity: 'warning',
      message: 'Subject is all caps (may trigger spam filters)',
      field: 'subject',
    })
  }

  // Excessive punctuation
  const exclamationCount = (subject.match(/!/g) || []).length
  if (exclamationCount > 1) {
    issues.push({
      severity: 'warning',
      message: 'Multiple exclamation marks (may appear spammy)',
      field: 'subject',
    })
  }

  return issues
}
