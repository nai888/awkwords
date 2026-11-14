import { version as VERSION } from '../../../package.json'
import { describe, expect, it } from 'vitest'
import { MAX_WORDS, defaultConfig, generate, serializeSettings, validate } from '..'
import type { GeneratorConfig } from '..'

const VOWELS = { name: 'V', content: 'a/i/u' }

function config(pattern: string, extra: Partial<GeneratorConfig> = {}): GeneratorConfig {
  return {
    pattern,
    subpatterns: [],
    count: 100,
    newLineEach: false,
    filterDuplicates: false,
    ...extra,
  }
}

describe('validation (matches the original: only cycles block generation)', () => {
  it('accepts a sound configuration without messages', () => {
    const v = validate(config('VV', { subpatterns: [VOWELS] }))
    expect(v.ok).toBe(true)
    expect(v.warnings).toEqual([])
  })

  it('treats a circular reference as an error and generates nothing', () => {
    const cfg = config('A', {
      subpatterns: [
        { name: 'A', content: 'xB' },
        { name: 'B', content: 'yA' },
      ],
    })
    expect(validate(cfg).errors.map((e) => e.kind)).toEqual(['cycle'])
    expect(generate(cfg).printed).toBe(0)
  })

  it('warns, but still generates, for undefined letters (quoted capitals are fine)', () => {
    expect(validate(config('aX')).ok).toBe(true)
    expect(validate(config('aX')).warnings.length).toBe(1)
    expect(generate(config('aX')).printed).toBe(100)
    expect(validate(config('a"X"')).warnings).toEqual([])
  })

  it('warns when a letter has several subpatterns, and the last one wins', () => {
    const cfg = config('V', { subpatterns: [VOWELS, { name: 'V', content: 'e' }] })
    expect(validate(cfg).warnings.length).toBe(1)
    expect(new Set(generate(cfg).words)).toEqual(new Set(['e']))
  })

  it('warns about unmatched brackets, ignoring quoted ones', () => {
    expect(validate(config('[a(b]')).warnings.length).toBe(1)
    expect(validate(config('a)')).warnings.length).toBe(1)
    expect(validate(config('"["')).warnings).toEqual([])
    expect(generate(config('[a(b]')).printed).toBe(100)
  })

  it('rejects an invalid word count', () => {
    expect(validate(config('a', { count: 0 })).errors.map((e) => e.kind)).toEqual(['range'])
    expect(validate(config('a', { count: 1.5 })).errors.map((e) => e.kind)).toEqual(['range'])
  })

  it('silently caps the word count at MAX_WORDS', () => {
    expect(generate(config('a', { count: MAX_WORDS + 5 })).printed).toBe(MAX_WORDS)
  })
})

describe('statistics', () => {
  it('reports pattern-filtered words and duplicates separately', () => {
    const r = generate(config('a^a/b', { count: 200, filterDuplicates: true }))
    expect(r.printed).toBe(1)
    expect(r.filtered + r.duplicates + r.printed).toBe(200)
    expect(r.dropped).toBe(r.filtered + r.duplicates)
    expect(r.filtered).toBeGreaterThan(0)
    expect(r.duplicates).toBeGreaterThan(0)
  })
})

describe('original defaults and save format', () => {
  it('starts with the original values', () => {
    const d = defaultConfig()
    expect(d.pattern).toBe('CV(CV)(N)')
    expect(d.count).toBe(100)
    expect(d.newLineEach).toBe(false)
    expect(d.subpatterns.map((s) => `${s.name}:${s.content}`)).toEqual([
      'V:a/i/u',
      'C:p/t/k/s/m/n',
      'N:m/n',
    ])
  })

  it('writes lines in the original order, skips empty rows, and includes version number', () => {
    const text = serializeSettings({
      ...defaultConfig(),
      subpatterns: [...defaultConfig().subpatterns, { name: '', content: '' }],
      newLineEach: true,
    })
    expect(text).toBe(
      `#awkwords version ${VERSION}\nV:a/i/u\nC:p/t/k/s/m/n\nN:m/n\nr:CV(CV)(N)\nn:100\nnle\n`,
    )
  })
})
