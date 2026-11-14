import { isUpper, parsePattern } from './parser'
import type { GeneratorConfig, Issue, ValidationResult } from './types'

/* 1.2 capped at 9999; 1.3.0 capped at 1M */
export const MAX_WORDS = 1000000
export const MAX_SUBPATTERNS = 26

export const isSubpatternName = (name: string): boolean => {
  return /^[A-Z]$/.test(name)
}

/* Capital letters outside double quotes, in order of appearance. */
export function lettersOutsideQuotes(text: string): string[] {
  const out: string[] = []
  let esc = false
  for (const ch of text) {
    if (ch === '"') {
      esc = !esc
    } else if (!esc && isUpper(ch)) {
      out.push(ch)
    }
  }
  return out
}

/* Brackets left unmatched in 'text' (quoted text ignored), with 0-based positions. */
export function unmatchedBrackets(text: string): { ch: string; pos: number }[] {
  const stack: { ch: string; pos: number }[] = []
  let esc = false
  for (let p = 0; p < text.length; p++) {
    const ch = text[p]
    if (ch === '"') {
      esc = !esc
    } else if (!esc && '[]()'.includes(ch)) {
      stack.push({ ch, pos: p })
      const n = stack.length
      if (n >= 2) {
        const a = stack[n - 2].ch
        if ((a === '(' && ch === ')') || (a === '[' && ch === ']')) {
          stack.length -= 2
        }
      }
    }
  }
  return stack
}

const unique = <T>(items: T[]): T[] => {
  return [...new Set(items)]
}

const list = (letters: string[]): string => {
  return letters.join(', ')
}

const plural = (word: string, n: number): string => {
  return n === 1 ? word : `${word}s`
}

/* Letters that directly or indirectly require themselves. */
function selfDependent(config: GeneratorConfig, defined: Set<string>): string[] {
  const deps = new Map<string, Set<string>>()
  for (const sp of config.subpatterns) {
    if (!isSubpatternName(sp.name)) {
      continue
    }
    const set = deps.get(sp.name) ?? new Set<string>()
    for (const l of lettersOutsideQuotes(sp.content)) {
      if (defined.has(l)) {
        set.add(l)
      }
    }
    deps.set(sp.name, set)
  }

  const cyclic: string[] = []
  for (const start of [...deps.keys()].sort()) {
    const seen = new Set<string>()
    const stack = [...(deps.get(start) ?? [])]
    let found = false
    while (stack.length > 0 && !found) {
      const cur = stack.pop() as string
      if (cur === start) {
        found = true
        break
      }
      if (seen.has(cur)) {
        continue
      }
      seen.add(cur)
      for (const next of deps.get(cur) ?? []) {
        stack.push(next)
      }
    }
    if (found) {
      cyclic.push(start)
    }
  }
  return cyclic
}

/**
 * Rules:
 * - errors (block generation): circular subpattern references and an invalid word count
 * - warnings (generation still runs): a letter defined more than once (the last
 *   definition is used), capital letters without a subpattern, unmatched brackets,
 *   and weights above the maximum.
 */
export function validate(config: GeneratorConfig): ValidationResult {
  const errors: Issue[] = []
  const warnings: string[] = []

  if (!Number.isInteger(config.count) || config.count < 1) {
    errors.push({
      kind: 'range',
      message: 'The number of words must be a whole number of at least 1.',
    })
  }

  const defined = new Set<string>()
  const duplicated: string[] = []
  for (const sp of config.subpatterns) {
    if (!isSubpatternName(sp.name)) {
      continue
    }
    if (defined.has(sp.name)) {
      duplicated.push(sp.name)
    }
    defined.add(sp.name)
  }

  const sources: { label: string; text: string }[] = config.subpatterns
    .filter((sp) => isSubpatternName(sp.name))
    .map((sp) => ({ label: `subpattern ${sp.name}`, text: sp.content }))
  sources.push({ label: 'the pattern', text: config.pattern })

  // Circular references (structural error)
  const cyclic = selfDependent(config, defined)
  if (cyclic.length > 0) {
    errors.push({
      kind: 'cycle',
      message: `${plural('subpattern', cyclic.length)} ${list(cyclic)} ${
        cyclic.length === 1 ? 'is' : 'are'
      } in a cyclical dependency.`,
    })
  }

  const dups = unique(duplicated)
  if (dups.length > 0) {
    warnings.push(
      `${plural('Letter', dups.length)} ${list(dups)} ${dups.length === 1 ? 'has' : 'have'} multiple subpatterns assigned; the last one is automatically used.`,
    )
  }

  const undefinedLetters: string[] = []
  for (const src of sources) {
    for (const l of lettersOutsideQuotes(src.text)) {
      if (!defined.has(l)) {
        undefinedLetters.push(l)
      }
    }
  }
  const undef = unique(undefinedLetters)
  if (undef.length > 0) {
    warnings.push(
      `${plural('Letter', undef.length)} ${list(undef)} ${undef.length === 1 ? 'has' : 'have'} no ${plural(
        'subpattern',
        undef.length,
      )} assigned. To generate a capital letter, enclose it in double quotes, like this: "${undef[0]}"`,
    )
  }

  for (const src of sources) {
    const bad = unmatchedBrackets(src.text)
    if (bad.length > 0) {
      const where = bad.map((b) => `"${b.ch}" at position ${b.pos + 1}`).join(', ')
      warnings.push(
        `${bad.length === 1 ? 'This bracket was' : 'These brackets were'} found without ${
          bad.length === 1 ? 'its' : 'their'
        } matching ${plural('counterpart', bad.length)} in ${src.label}: ${where}.`,
      )
    }
  }

  for (const src of sources) {
    for (const w of parsePattern(src.text).warnings) {
      const msg = `In ${src.label}: ${w}`
      if (!warnings.includes(msg)) warnings.push(msg)
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
