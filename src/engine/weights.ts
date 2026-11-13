import { isDigit, MAX_WEIGHT } from './parser'
import { unmatchedBrackets } from './validate'

export interface WeightedOption {
  /* The option exactly as written in the source, weight marker included. */
  raw: string
  /* For display: `raw` without weight markers, trimmed. */
  text: string
  weight: number
  /* Where the last `*N` marker sits inside `raw`, or null if there is none. */
  marker: { start: number; end: number } | null
}

export const clampWeight = (n: number): number => {
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(Math.floor(n), MAX_WEIGHT)
}

/** Whether the top-level options can be edited safely (no stray brackets, balanced quotes). */
export function canEditWeights(source: string): boolean {
  const quotes = source.split('"').length - 1
  return quotes % 2 === 0 && unmatchedBrackets(source).length === 0
}

/**
 * Splits a pattern at its top-level `/` into options and reads each option's
 * `*N` weight. Slashes and weights inside brackets or quotes belong to nested
 * groups and are left alone. As in the parser, the last weight marker in an
 * option wins and a missing number means 1.
 */
export function splitOptions(source: string): WeightedOption[] {
  const options: WeightedOption[] = []
  let raw = ''
  let weight = 1
  let markers: { start: number; end: number }[] = []
  let depth = 0
  let quoted = false

  const finish = (): void => {
    let text = ''
    let from = 0
    for (const m of markers) {
      text += raw.slice(from, m.start)
      from = m.end
    }
    text += raw.slice(from)
    options.push({ raw, text: text.trim(), weight, marker: markers[markers.length - 1] ?? null })
    raw = ''
    weight = 1
    markers = []
  }

  for (let p = 0; p < source.length; p++) {
    const c = source[p]
    if (c === '"') {
      quoted = !quoted
      raw += c
    } else if (quoted) {
      raw += c
    } else if (c === '[' || c === '(') {
      depth++
      raw += c
    } else if (c === ']' || c === ')') {
      depth = Math.max(0, depth - 1)
      raw += c
    } else if (depth === 0 && c === '/') {
      finish()
    } else if (depth === 0 && c === '*') {
      const start = raw.length
      let digits = ''
      while (p + 1 < source.length && isDigit(source[p + 1])) {
        digits += source[++p]
      }
      raw += '*' + digits
      markers.push({ start, end: raw.length })
      weight = digits === '' ? 1 : clampWeight(parseInt(digits, 10))
    } else {
      raw += c
    }
  }
  finish() // a trailing empty option is meaningful: `a/` is "a" or nothing
  return options
}

/** Puts the options back together exactly as they were written. */
export function joinOptions(options: WeightedOption[]): string {
  return options.map((o) => o.raw).join('/')
}

/**
 * Rewrites one option so it has `weight`, touching as little as possible: the
 * last marker is changed in place (moving it could change how far a `^filter`
 * extends), and a missing marker is appended at the end.
 */
function rewrite(option: WeightedOption, weight: number): string {
  const w = clampWeight(weight)
  const { raw, marker } = option
  if (!marker) {
    if (w <= 1) {
      return raw
    }
    const body = raw.trimEnd() // quotes are balanced (see canEditWeights), so trailing spaces are outside them
    return `${body}*${w}${raw.slice(body.length)}`
  }
  const before = raw.slice(0, marker.start)
  const after = raw.slice(marker.end)
  if (w > 1) {
    return `${before}*${w}${after}`
  }
  // Weight 1: drop a trailing marker; otherwise keep an explicit *1 so nothing around it merges.
  return after.trim() === '' ? before + after : `${before}*1${after}`
}

/** Returns `source` with the weight of option `index` replaced. */
export function setOptionWeight(source: string, index: number, weight: number): string {
  const options = splitOptions(source)
  if (index < 0 || index >= options.length) {
    return source
  }
  return options.map((o, i) => (i === index ? rewrite(o, weight) : o.raw)).join('/')
}

/** Returns `source` with every option's weight set to `weight`. */
export function setAllWeights(source: string, weight: number): string {
  return splitOptions(source)
    .map((o) => rewrite(o, weight))
    .join('/')
}
