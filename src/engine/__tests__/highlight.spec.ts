import { describe, expect, it } from 'vitest'
import { tokenize } from '..'

const DEFINED = new Set(['V', 'C'])
const kinds = (s: string) => tokenize(s, DEFINED).map((t) => `${t.kind}:${t.text}`)

describe('tokenize', () => {
  it('always reproduces the source exactly', () => {
    const samples = [
      'CV(CV)(N)',
      'a/b*3/c/d/kek*6',
      'heh"[mY/worD)]"',
      '[VV]t[VV]^aa^ii^uu',
      'a""b',
      '"unclosed',
      '[a(b]',
      'x ^ "q" y',
      '',
    ]
    for (const s of samples)
      expect(
        tokenize(s, DEFINED)
          .map((t) => t.text)
          .join(''),
      ).toBe(s)
  })

  it('classifies letters, brackets and slashes', () => {
    expect(kinds('CV(x)/y')).toEqual([
      'letter:C',
      'letter:V',
      'bracket:(',
      'literal:x',
      'bracket:)',
      'slash:/',
      'literal:y',
    ])
  })

  it('flags capital letters without a subpattern', () => {
    expect(kinds('VX')).toEqual(['letter:V', 'letter-undefined:X'])
  })

  it('treats quoted text as one piece, so capitals inside are not letters', () => {
    expect(kinds('a"[mY/D)]"b')).toEqual(['literal:a', 'quoted:"[mY/D)]"', 'literal:b'])
    expect(kinds('a""b')).toEqual(['literal:a', 'quoted:""', 'literal:b'])
  })

  it('marks weights, and weights above the maximum', () => {
    expect(kinds('a*3/b*500/c*')).toEqual([
      'literal:a',
      'weight:*3',
      'slash:/',
      'literal:b',
      'weight-high:*500',
      'slash:/',
      'literal:c',
      'weight:*',
    ])
  })

  it('separates a filter from its caret and ends it at syntax', () => {
    expect(kinds('V^aa^"X"/b')).toEqual([
      'letter:V',
      'caret:^',
      'filter:aa',
      'caret:^',
      'filter:"X"',
      'slash:/',
      'literal:b',
    ])
  })

  it('flags only the unmatched brackets', () => {
    expect(tokenize('(a)', DEFINED).every((x) => x.kind !== 'bracket-unmatched')).toBe(true)
    expect(tokenize('[a(b]', DEFINED).some((x) => x.kind === 'bracket-unmatched')).toBe(true)
    const t = tokenize('(a))', DEFINED).filter((x) => x.kind.startsWith('bracket'))
    expect(t.map((x) => x.kind)).toEqual(['bracket', 'bracket', 'bracket-unmatched'])
    expect(tokenize('"["', DEFINED).some((x) => x.kind.startsWith('bracket'))).toBe(false)
  })
})
