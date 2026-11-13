import { isUpper, isDigit, isSpecial, MAX_WEIGHT } from './parser'
import { unmatchedBrackets } from './validate'

export type TokenKind =
  | 'literal'
  | 'quoted'
  | 'letter'
  | 'letter-undefined'
  | 'bracket'
  | 'bracket-unmatched'
  | 'slash'
  | 'weight'
  | 'weight-high'
  | 'caret'
  | 'filter'

export interface Token {
  text: string
  kind: TokenKind
}

/** Index just after the quoted section that starts at `p` (`""` is one escaped quote). */
function quotedEnd(s: string, p: number): number {
  if (s[p + 1] === '"') {
    return p + 2
  }
  const close = s.indexOf('"', p + 1)
  return close === -1 ? s.length : close + 1
}

/**
 * Splits a pattern into classified pieces for syntax highlighting. The pieces
 * always concatenate back to 'source' exactly. 'defined' holds the letters that
 * have a subpattern, so other capital letters can be flagged.
 */
export function tokenize(source: string, defined: ReadonlySet<string>): Token[] {
  const tokens: Token[] = []
  const bad = new Set(unmatchedBrackets(source).map((b) => b.pos))

  const push = (text: string, kind: TokenKind): void => {
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind && kind === 'literal') {
      last.text += text
    } else {
      tokens.push({ text, kind })
    }
  }

  let p = 0
  while (p < source.length) {
    const c = source[p]

    if (c === '"') {
      const end = quotedEnd(source, p)
      push(source.slice(p, end), 'quoted')
      p = end
    } else if (c === '/') {
      push(c, 'slash')
      p++
    } else if (c === '*') {
      let end = p + 1
      while (end < source.length && isDigit(source[end])) {
        end++
      }
      const digits = source.slice(p + 1, end)
      push(
        source.slice(p, end),
        digits !== '' && parseInt(digits, 10) > MAX_WEIGHT ? 'weight-high' : 'weight',
      )
      p = end
    } else if (c === '[' || c === '(' || c === ']' || c === ')') {
      push(c, bad.has(p) ? 'bracket-unmatched' : 'bracket')
      p++
    } else if (c === '^') {
      push(c, 'caret')
      let end = p + 1
      while (end < source.length) {
        if (source[end] === '"') {
          end = quotedEnd(source, end)
        } else if (isSpecial(source[end])) {
          break
        } else {
          end++
        }
      }
      if (end > p + 1) {
        push(source.slice(p + 1, end), 'filter')
      }
      p = end
    } else if (isUpper(c)) {
      push(c, defined.has(c) ? 'letter' : 'letter-undefined')
      p++
    } else {
      let end = p + 1
      while (end < source.length && source[end] !== '"' && !isSpecial(source[end])) {
        end++
      }
      push(source.slice(p, end), 'literal')
      p = end
    }
  }
  return tokens
}
