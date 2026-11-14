import { describe, expect, it } from 'vitest'
import {
  canEditWeights,
  joinOptions,
  parsePattern,
  setAllWeights,
  setOptionWeight,
  splitOptions,
} from '..'

const brief = (s: string) => splitOptions(s).map((o) => ({ text: o.text, weight: o.weight }))

describe('splitOptions', () => {
  it('splits at top-level slashes and reads weights', () => {
    expect(brief('a/b*3/c/d/kek*6')).toEqual([
      { text: 'a', weight: 1 },
      { text: 'b', weight: 3 },
      { text: 'c', weight: 1 },
      { text: 'd', weight: 1 },
      { text: 'kek', weight: 6 },
    ])
  })

  it('leaves slashes and weights inside groups and quotes alone', () => {
    expect(brief('s[a/b*4]/"x/y*2"*5')).toEqual([
      { text: 's[a/b*4]', weight: 1 },
      { text: '"x/y*2"', weight: 5 },
    ])
  })

  it('keeps a trailing empty option', () => {
    expect(brief('a/')).toEqual([
      { text: 'a', weight: 1 },
      { text: '', weight: 1 },
    ])
  })

  it('keeps a starting empty option', () => {
    expect(brief('/a')).toEqual([
      { text: '', weight: 1 },
      { text: 'a', weight: 1 },
    ])
  })

  it('lets the last weight win, clamps, and treats a bare * as 1', () => {
    expect(splitOptions('a*2*7')[0].weight).toBe(7)
    expect(splitOptions('a*500')[0].weight).toBe(128)
    expect(splitOptions('a*0')[0].weight).toBe(1)
    expect(splitOptions('a*')[0].weight).toBe(1)
  })

  it('finds a weight written mid-option', () => {
    expect(brief('a*3b')).toEqual([{ text: 'ab', weight: 3 }])
  })

  it('reassembles to the exact original text', () => {
    for (const s of ['a / b*3 / c', 's[a/b*4]/"x/y*2"*5', 'a/', '/a', 'a*3b/c']) {
      expect(joinOptions(splitOptions(s))).toBe(s)
    }
  })
})

describe('setOptionWeight / setAllWeights', () => {
  it('changes only the chosen option and leaves the rest byte-for-byte', () => {
    expect(setOptionWeight('a/b/c', 1, 4)).toBe('a/b*4/c')
    expect(setOptionWeight('a / b*3 / c', 0, 2)).toBe('a*2 / b*3 / c')
    expect(setOptionWeight('a/b/c', 9, 4)).toBe('a/b/c')
  })

  it('removes a trailing marker for weight 1', () => {
    expect(setOptionWeight('a/b*3', 1, 1)).toBe('a/b')
  })

  it('edits a mid-option marker in place instead of moving it', () => {
    expect(setOptionWeight('a*3b', 0, 5)).toBe('a*5b')
    expect(setOptionWeight('a*3b', 0, 1)).toBe('a*1b')
  })

  it('sets every weight at once', () => {
    expect(setAllWeights('a*3/b/c*9', 1)).toBe('a/b/c')
    expect(setAllWeights('a/b', 2)).toBe('a*2/b*2')
  })

  it('keeps a filter exactly as long as it was', () => {
    // moving the marker after `^x` would turn the filter into "xb"
    const out = setOptionWeight('a^x*3b', 0, 4)
    expect(out).toBe('a^x*4b')
    const filters = parsePattern(out).choice.options[0].fragments.map((f) => f.filters)
    expect(filters).toEqual([['x'], []])
  })

  it('only changes the weights the parser sees', () => {
    const samples = [
      'a/b*3/c/d/kek*6',
      's[a/b*4]/"x/y*2"*5',
      'a/',
      'CV(CV)(N)^aa/b*2',
      'a*3b/c',
      '/a',
      'a^x*3b/c',
    ]
    for (const s of samples) {
      const before = parsePattern(s).choice.options
      for (const w of [1, 2, 9, 128]) {
        for (let i = 0; i < before.length; i++) {
          const after = parsePattern(setOptionWeight(s, i, w)).choice.options
          expect(after.length).toBe(before.length)
          for (let j = 0; j < before.length; j++) {
            expect(after[j].weight).toBe(j === i ? w : before[j].weight)
            expect(JSON.stringify(after[j].fragments)).toBe(JSON.stringify(before[j].fragments))
          }
        }
      }
    }
  })
})

describe('canEditWeights', () => {
  it('refuses patterns with unmatched brackets or quotes', () => {
    expect(canEditWeights('a/[b')).toBe(false)
    expect(canEditWeights('a/"b')).toBe(false)
    expect(canEditWeights('a/[b]')).toBe(true)
  })
})
