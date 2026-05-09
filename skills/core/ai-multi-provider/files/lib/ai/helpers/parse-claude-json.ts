/**
 * Parse JSON from Claude API responses
 *
 * Claude API sometimes:
 * 1. Wraps JSON in markdown code fences: ```json\n{...}\n```
 * 2. Adds text after the JSON: {...} \n\nThis is a valid response...
 *
 * This helper:
 * - Strips markdown fences
 * - Extracts first complete JSON object/array
 * - Ignores trailing text
 */

export function parseClaudeJSON<T = unknown>(text: string): T {
  let cleaned = text.trim()

  // Remove markdown code fences if present
  if (cleaned.startsWith('```')) {
    // Remove opening ```json or ```
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '')
    // Remove closing ```
    cleaned = cleaned.replace(/\n?```$/, '')
    cleaned = cleaned.trim()
  }

  // Find the first JSON object or array
  const firstChar = cleaned[0]
  if (firstChar !== '{' && firstChar !== '[') {
    throw new Error(`Expected JSON to start with { or [, got: ${cleaned.substring(0, 50)}`)
  }

  // Extract complete JSON by counting braces/brackets
  let depth = 0
  let inString = false
  let escapeNext = false
  const openChar = firstChar
  const closeChar = openChar === '{' ? '}' : ']'

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"' && !inString) {
      inString = true
      continue
    }

    if (char === '"' && inString) {
      inString = false
      continue
    }

    if (inString) {
      continue
    }

    if (char === openChar) {
      depth++
    } else if (char === closeChar) {
      depth--
      if (depth === 0) {
        // Found complete JSON - extract and parse
        const jsonText = cleaned.substring(0, i + 1)
        try {
          return JSON.parse(jsonText) as T
        } catch (error) {
          throw new Error(
            `Failed to parse extracted JSON. ${error instanceof Error ? error.message : 'Unknown error'}. Raw (first 200 chars): ${jsonText.substring(0, 200)}`
          )
        }
      }
    }
  }

  // If we reach here, JSON was incomplete
  throw new Error(
    `Incomplete JSON - could not find matching ${closeChar}. Raw (first 200 chars): ${cleaned.substring(0, 200)}`
  )
}
