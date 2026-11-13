import type { Choice, Fragment, Option } from './types'

export const MAX_WEIGHT = 128

export interface ParseResult {
  choice: Choice
  warnings: string[]
}

export const isUpper = (c: string): boolean => {
  return c >= 'A' && c <= 'Z'
}

export const isDigit = (c: string): boolean => {
  return c >= '0' && c <= '9'
}

/* Characters that end a run of literal text. Quoted text is skipped separately. */
export const isSpecial = (c: string): boolean => {
  return '/*[()]^'.includes(c) || isUpper(c)
}

/* Index just after the closing quote of the quoted section */
function skipQuoted(s: string, p: number): number {
  const close = s.indexOf('"', p + 1)
  return close === -1 ? s.length : close + 1
}

/**
 * Resolves quoting inside a raw run of text:
 * - spaces outside quotes are dropped
 * - `"text"` is copied verbatim (specials lose their meaning)
 * - `""` yields a single `"`
 */
export function unquote(raw: string): string {
  let out = ''
  for (let p = 0; p < raw.length; p++) {
    const c = raw[p]
    if (c === '"') {
      p++
      if (raw[p] === '"') {
        // literal "" becomes just "
        out += '"'
        continue
      }
      for (; p < raw.length && raw[p] !== '"'; p++) {
        out += raw[p] // copy the string exactly, ignoring specials
      }
    } else if (c !== ' ') {
      // drop spaces outside of quotes
      out += c
    }
  }
  return out
}

class Parser {
  pos = 0
  readonly warnings: string[] = []

  constructor(private readonly s: string) {}

  private clampWeight(digits: string): number {
    if (digits === '') return 1
    const n = parseInt(digits, 10)
    if (n < 1) {
      return 1
    }
    if (n > MAX_WEIGHT) {
      const msg = `Weight ${n} is too high and was reduced to ${MAX_WEIGHT}.`
      if (!this.warnings.includes(msg)) {
        this.warnings.push(msg)
      }
      return MAX_WEIGHT
    }
    return n
  }

  private readFilter(): string {
    const s = this.s
    const start = this.pos
    while (this.pos < s.length) {
      const c = s[this.pos]
      if (c === '"') {
        this.pos = skipQuoted(s, this.pos)
        continue
      }
      if (isSpecial(c)) {
        break
      }
      this.pos++
    }
    return unquote(s.slice(start, this.pos))
  }

  /**
   * Parses options until the end of input, or (when `nested`) until the
   * closing bracket of the enclosing group, which is left unconsumed.
   * Never throws: structurally invalid input is reported by `validate()`.
   */
  parseChoice(nested: boolean): Choice {
    const s = this.s
    const options: Option[] = []
    let fragments: Fragment[] = []
    let weight = 1

    const finishOption = () => {
      options.push({ fragments, weight })
      fragments = []
      weight = 1
    }

    while (this.pos < s.length) {
      const ch = s[this.pos]

      if (ch === '/') {
        finishOption()
        this.pos++
      } else if (ch === '*') {
        this.pos++
        let digits = ''
        while (this.pos < s.length && isDigit(s[this.pos])) {
          digits += s[this.pos++]
        }
        weight = this.clampWeight(digits)
      } else if (ch === ']' || ch === ')') {
        if (nested) {
          break
        }
        this.pos++ // stray closer at top level; reported by validate()
      } else if (ch === '[' || ch === '(') {
        this.pos++
        const body = this.parseChoice(true)
        if (this.pos < s.length) {
          this.pos++ // consume the closer
        }
        fragments.push({ kind: 'group', optional: ch === '(', body, filters: [] })
      } else if (isUpper(ch)) {
        fragments.push({ kind: 'ref', letter: ch, filters: [] })
        this.pos++
      } else if (ch === '^') {
        this.pos++
        const filter = this.readFilter()
        const last = fragments[fragments.length - 1]
        if (last && filter.length > 0) {
          last.filters.push(filter)
        }
      } else {
        const start = this.pos
        while (this.pos < s.length) {
          const c = s[this.pos]
          if (c === '"') this.pos = skipQuoted(s, this.pos)
          else if (isSpecial(c)) break
          else this.pos++
        }
        const text = unquote(s.slice(start, this.pos))
        if (text.length > 0) {
          fragments.push({ kind: 'literal', text, filters: [] })
        }
      }
    }

    finishOption() // also yields a trailing empty option: `[a/]` is "a" or nothing
    return { options }
  }
}

export function parsePattern(source: string): ParseResult {
  const parser = new Parser(source)
  const choice = parser.parseChoice(false)
  return { choice, warnings: parser.warnings }
}
