import { parsePattern } from './parser'
import type { Choice, GenerateResult, GeneratorConfig } from './types'
import { MAX_WORDS, isSubpatternName, validate } from './validate'

interface CNode {
  /** Literal text, or null when `body` is used. */
  literal: string | null
  body: CChoice | null
  optional: boolean
  filters: string[]
}

interface COption {
  nodes: CNode[]
}

interface CChoice {
  options: COption[]
  cumulative: number[]
  total: number
}

const EMPTY: CChoice = { options: [{ nodes: [] }], cumulative: [1], total: 1 }

export interface CompiledPattern {
  /** Renders one word, or returns null when a pattern filter rejected it. */
  renderWord(): string | null
  /** Number of ways the pattern can render. */
  countPossibilities(): bigint
  warnings: string[]
}

export function compile(config: GeneratorConfig): CompiledPattern {
  const definitions = new Map<string, string>()
  for (const sp of config.subpatterns) {
    // the last definition of a letter wins
    if (isSubpatternName(sp.name)) {
      definitions.set(sp.name, sp.content)
    }
  }

  const warnings: string[] = []
  const memo = new Map<string, CChoice>()
  const building = new Set<string>()

  const build = (choice: Choice): CChoice => {
    let total = 0
    const cumulative: number[] = []
    const options: COption[] = choice.options.map((opt) => {
      total += opt.weight
      cumulative.push(total)
      return {
        nodes: opt.fragments.map((f): CNode => {
          if (f.kind === 'literal') {
            return { literal: f.text, body: null, optional: false, filters: f.filters }
          }
          if (f.kind === 'group') {
            return { literal: null, body: build(f.body), optional: f.optional, filters: f.filters }
          }
          return { literal: null, body: subpattern(f.letter), optional: false, filters: f.filters }
        }),
      }
    })
    return { options, cumulative, total }
  }

  const subpattern = (letter: string): CChoice => {
    const cached = memo.get(letter)
    if (cached) {
      return cached
    }
    const source = definitions.get(letter)
    if (source === undefined) {
      return EMPTY
    }
    if (building.has(letter)) {
      throw new Error(`Subpattern ${letter} requires itself.`)
    }
    building.add(letter)
    const parsed = parsePattern(source)
    for (const w of parsed.warnings) {
      warnings.push(`In subpattern ${letter}: ${w}`)
    }
    const compiled = build(parsed.choice)
    building.delete(letter)
    memo.set(letter, compiled)
    return compiled
  }

  const mainParsed = parsePattern(config.pattern)
  for (const w of mainParsed.warnings) {
    warnings.push(`In the main pattern: ${w}`)
  }
  const root = build(mainParsed.choice)

  const pick = (choice: CChoice): COption => {
    const opts = choice.options
    if (opts.length === 1) {
      return opts[0]
    }
    const r = Math.random() * choice.total
    for (let i = 0; i < opts.length; i++) {
      if (r < choice.cumulative[i]) {
        return opts[i]
      }
    }
    return opts[opts.length - 1]
  }

  const render = (choice: CChoice): string | null => {
    const nodes = pick(choice).nodes
    let out = ''
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      let s = ''
      if (node.literal !== null) {
        s = node.literal
      } else if (!node.optional || Math.random() < 0.5) {
        const r = render(node.body as CChoice)
        if (r === null) {
          return null
        }
        s = r
      }
      for (let f = 0; f < node.filters.length; f++) {
        if (s === node.filters[f]) {
          return null
        }
      }
      out += s
    }
    return out
  }

  const count = (choice: CChoice, cache: Map<CChoice, bigint>): bigint => {
    const cached = cache.get(choice)
    if (cached !== undefined) {
      return cached
    }
    let sum = 0n
    for (const opt of choice.options) {
      let product = 1n
      for (const node of opt.nodes) {
        if (node.literal !== null) {
          continue
        }
        const c = count(node.body as CChoice, cache)
        product *= node.optional ? 1n + c : c
      }
      sum += product
    }
    cache.set(choice, sum)
    return sum
  }

  return {
    renderWord: () => render(root),
    countPossibilities: () => count(root, new Map()),
    warnings,
  }
}

export function formatOutput(words: string[], newLineEach: boolean): string {
  return words.join(newLineEach ? '\n' : ' ')
}

export function generate(config: GeneratorConfig): GenerateResult {
  const validation = validate(config)
  if (!validation.ok) {
    return {
      words: [],
      printed: 0,
      dropped: 0,
      filtered: 0,
      duplicates: 0,
      ms: 0,
      possibilities: 0n,
      errors: validation.errors,
      warnings: validation.warnings,
    }
  }

  const compiled = compile(config)
  const seen = config.filterDuplicates ? new Set<string>() : null
  const words: string[] = []
  let filtered = 0
  let duplicates = 0
  const attempts = Math.min(config.count, MAX_WORDS)

  const start = performance.now()
  for (let i = 0; i < attempts; i++) {
    const word = compiled.renderWord()
    if (word === null) {
      filtered++
      continue
    }
    if (seen) {
      if (seen.has(word)) {
        duplicates++
        continue
      }
      seen.add(word)
    }
    words.push(word)
  }
  const ms = performance.now() - start

  return {
    words,
    printed: words.length,
    dropped: filtered + duplicates,
    filtered,
    duplicates,
    ms,
    possibilities: compiled.countPossibilities(),
    errors: [],
    warnings: validation.warnings,
  }
}
