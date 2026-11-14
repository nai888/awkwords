import { afterEach, describe, expect, it, vi } from 'vitest'
import { generate } from '../index'
import type { GeneratorConfig } from '../index'

/*
 * The engine draws from Math.random(), so the tests here come in two kinds:
 *
 * - Exact tests replace Math.random with fixed values (see `random()`), which makes the result
 *   fully predictable. These check precise behavior: where option boundaries fall, when optional
 *   groups appear, how filtered words and duplicates are counted.
 * - Statistical tests use the real Math.random() with enough draws that a correct engine would
 *   fail them by bad luck with a probability below 1 in 10^16. Each notes its margin.
 */

const VOWELS = { name: 'V', content: 'a/i/u' }

function config(pattern: string, extra: Partial<GeneratorConfig> = {}): GeneratorConfig {
  return {
    pattern,
    subpatterns: [],
    count: 1000,
    newLineEach: true,
    filterDuplicates: false,
    ...extra,
  }
}

/** The distinct words produced by one run. */
function distinct(cfg: GeneratorConfig): Set<string> {
  return new Set(generate(cfg).words)
}

/** The share of words equal to `word` in one run. */
function share(cfg: GeneratorConfig, word: string): number {
  const { words } = generate(cfg)
  return words.filter((w) => w === word).length / words.length
}

/** Makes Math.random() return the given values in turn; the last value then repeats. */
function random(first: number, ...rest: number[]): void {
  const values = [first, ...rest]
  let next = 0
  vi.spyOn(Math, 'random').mockImplementation(() => values[Math.min(next++, values.length - 1)])
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('basic syntax', () => {
  // With 1000 draws, the chance of never seeing one of the expected words is below 1e-50 in
  // every test in this block, so each asserts the full set of possible words.

  it('chooses between slash-separated options', () => {
    expect(distinct(config('tu/top/kan'))).toEqual(new Set(['tu', 'top', 'kan']))
  })

  it('treats square brackets as a single unit', () => {
    expect(distinct(config('s[tu/top/kan]'))).toEqual(new Set(['stu', 'stop', 'skan']))
  })

  it('makes round-bracket content optional', () => {
    expect(distinct(config('s(tu/top/kan)'))).toEqual(new Set(['s', 'stu', 'stop', 'skan']))
  })

  it('supports unlimited nesting', () => {
    expect(distinct(config('at(a(z))'))).toEqual(new Set(['at', 'ata', 'ataz']))
  })

  it('supports empty options, including a trailing one', () => {
    expect(distinct(config('[a/]'))).toEqual(new Set(['a', '']))
    expect(distinct(config('[/a]'))).toEqual(new Set(['a', '']))
  })

  it('ignores spaces outside quotes', () => {
    expect(generate(config('t u', { count: 1 })).words).toEqual(['tu'])
    expect(generate(config('"t u"', { count: 1 })).words).toEqual(['t u'])
  })
})

describe('subpatterns', () => {
  it('inserts the subpattern wherever its letter is used', () => {
    expect(distinct(config('VV', { subpatterns: [VOWELS] })).size).toBe(9)
  })

  it('lets subpatterns use other subpatterns', () => {
    const cfg = config('S', {
      subpatterns: [{ name: 'S', content: 'CV' }, { name: 'C', content: 't/k' }, VOWELS],
    })
    expect(distinct(cfg).size).toBe(6)
  })
})

describe('escaping', () => {
  it('copies quoted special characters literally', () => {
    expect(generate(config('heh"[mY/worD)]"', { count: 1 })).words).toEqual(['heh[mY/worD)]'])
  })

  it('turns a doubled quote into a single quote character', () => {
    expect(generate(config('a""b', { count: 1 })).words).toEqual(['a"b'])
  })
})

describe('choosing options', () => {
  it('maps random values onto options in proportion to their weights', () => {
    // a/b*3 has a total weight of 4, so `a` owns [0, 0.25) and `b` owns [0.25, 1)
    const cfg = config('a/b*3', { count: 1 })
    const wordFor = (value: number): string | undefined => {
      random(value)
      return generate(cfg).words[0]
    }
    expect(wordFor(0)).toBe('a')
    expect(wordFor(0.24)).toBe('a')
    expect(wordFor(0.25)).toBe('b')
    expect(wordFor(0.999)).toBe('b')
  })

  it('draws a fresh random number for every word', () => {
    random(0.1, 0.9, 0.4)
    expect(generate(config('a/b', { count: 3 })).words).toEqual(['a', 'b', 'a'])
  })

  it('gives unweighted options equal chances', () => {
    // 30000 draws: each share is 1/3 with sigma 0.0027, so [0.30, 0.37] is 12+ sigma wide (~1e-33)
    const cfg = config('a/b/c', { count: 30000 })
    for (const word of ['a', 'b', 'c']) {
      const s = share(cfg, word)
      expect(s).toBeGreaterThan(0.3)
      expect(s).toBeLessThan(0.37)
    }
  })
})

describe('weights', () => {
  it('makes heavier options proportionally more likely', () => {
    // 20000 draws: share of `b` is 0.75 with sigma 0.003, so [0.72, 0.78] is 9.8 sigma (~1e-22)
    const s = share(config('a/b*3', { count: 20000 }), 'b')
    expect(s).toBeGreaterThan(0.72)
    expect(s).toBeLessThan(0.78)
  })

  it('clamps weights above 128 to 128 and warns about it', () => {
    const result = generate(config('a/b*500', { count: 10 }))
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.printed).toBe(10)

    // a*500/b: clamped (128 vs 1) the boundary sits at 128/129 = 0.99225, so 0.9925 picks `b`;
    // an unclamped weight (500 vs 1) would put the boundary at 0.998 and pick `a`.
    random(0.9925)
    expect(generate(config('a*500/b', { count: 1 })).words).toEqual(['b'])
  })
})

describe('optional groups', () => {
  it('includes the content when the random value is below 0.5', () => {
    random(0.49)
    expect(generate(config('s(x)', { count: 1 })).words).toEqual(['sx'])
  })

  it('skips the content when the random value is 0.5 or above', () => {
    random(0.5)
    expect(generate(config('s(x)', { count: 1 })).words).toEqual(['s'])
  })

  it('does not make square-bracket groups optional', () => {
    random(0.99)
    expect(generate(config('s[x]', { count: 1 })).words).toEqual(['sx'])
  })

  it('includes the content about half of the time', () => {
    // 20000 draws: share is 0.5 with sigma 0.0035, so [0.47, 0.53] is 8.5 sigma (~2e-17)
    const s = share(config('s(x)', { count: 20000 }), 'sx')
    expect(s).toBeGreaterThan(0.47)
    expect(s).toBeLessThan(0.53)
  })
})

describe('filters', () => {
  it('rejects a word when the filtered fragment renders the forbidden string', () => {
    // V^a over a/i/u: a value of 0.1 picks `a` (rejected), 0.5 picks `i` (kept)
    const cfg = config('V^a', { subpatterns: [VOWELS], count: 1 })

    random(0.1)
    const rejected = generate(cfg)
    expect(rejected.words).toEqual([])
    expect(rejected.printed).toBe(0)
    expect(rejected.filtered).toBe(1)
    expect(rejected.dropped).toBe(1)

    random(0.5)
    const kept = generate(cfg)
    expect(kept.words).toEqual(['i'])
    expect(kept.filtered).toBe(0)
    expect(kept.dropped).toBe(0)
  })

  it('only ever outputs words the filters allow', () => {
    // 10000 draws: 54 allowed words, each missed with probability (80/81)^10000 (~1e-54 overall).
    // A third of all draws are rejected (sigma 47), so [0.28, 0.39] of 10000 is 11+ sigma wide.
    const cfg = config('[VV]t[VV]^aa^ii^uu', { subpatterns: [VOWELS], count: 10000 })
    const result = generate(cfg)

    for (const word of result.words) {
      expect(word).not.toMatch(/t(aa|ii|uu)$/)
    }
    // first pair unrestricted (9) x second pair restricted (6)
    expect(new Set(result.words).size).toBe(54)

    expect(result.printed + result.dropped).toBe(10000)
    expect(result.duplicates).toBe(0)
    expect(result.filtered).toBe(result.dropped)
    expect(result.filtered).toBeGreaterThan(2800)
    expect(result.filtered).toBeLessThan(3900)
  })
})

describe('duplicates', () => {
  it('prints each word at most once when filtering duplicates', () => {
    // a, a (dup), b, a (dup)
    random(0.1, 0.1, 0.9, 0.1)
    const result = generate(config('a/b', { count: 4, filterDuplicates: true }))
    expect(result.words).toEqual(['a', 'b'])
    expect(result.printed).toBe(2)
    expect(result.duplicates).toBe(2)
    expect(result.dropped).toBe(2)
    expect(result.filtered).toBe(0)
  })

  it('keeps repeated words when not filtering duplicates', () => {
    random(0.1, 0.1, 0.9, 0.1)
    const result = generate(config('a/b', { count: 4 }))
    expect(result.words).toEqual(['a', 'a', 'b', 'a'])
    expect(result.duplicates).toBe(0)
    expect(result.dropped).toBe(0)
  })

  it('counts filtered words and duplicates separately', () => {
    // a (filtered), i, i (dup), a (filtered)
    random(0.1, 0.5, 0.5, 0.1)
    const cfg = config('V^a', { subpatterns: [VOWELS], count: 4, filterDuplicates: true })
    const result = generate(cfg)
    expect(result.words).toEqual(['i'])
    expect(result.printed).toBe(1)
    expect(result.filtered).toBe(2)
    expect(result.duplicates).toBe(1)
    expect(result.dropped).toBe(3)
  })
})

describe('possibilities', () => {
  // These counts are exact and do not depend on random numbers.
  const count = (pattern: string) =>
    generate(config(pattern, { subpatterns: [VOWELS], count: 1 })).possibilities

  it('counts the ways a pattern can render', () => {
    expect(count('s(tu/top/kan)')).toBe(4n)
    expect(count('at(a(z))')).toBe(3n)
    expect(count('[a/]')).toBe(2n)
    expect(count('VV')).toBe(9n)
  })

  it('stays exact for huge counts', () => {
    expect(count('V'.repeat(40))).toBe(3n ** 40n)
  })
})
