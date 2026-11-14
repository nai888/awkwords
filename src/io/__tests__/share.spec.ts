import { describe, expect, it } from 'vitest'
import type { GeneratorConfig } from '../../engine'
import { buildShareUrl, configFromHash, decodeShare, encodeShare } from '../share'

const sample: GeneratorConfig = {
  pattern: 'CV(N)^"/"',
  subpatterns: [
    { name: 'V', content: 'a/á/ü' },
    { name: 'C', content: 'k/t*3/日本' },
  ],
  count: 12,
  newLineEach: false,
  filterDuplicates: true,
}

describe('share links', () => {
  it('round-trips a configuration, including non-ASCII text', () => {
    expect(decodeShare(encodeShare(sample))).toEqual(sample)
  })

  it('produces URL-safe tokens', () => {
    expect(encodeShare(sample)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('reads a configuration back out of a built URL', () => {
    const url = new URL(buildShareUrl(sample, 'https://example.com/awkwords/'))
    expect(configFromHash(url.hash)).toEqual(sample)
  })

  it('returns null for garbage', () => {
    expect(decodeShare('not-a-valid-token!!')).toBeNull()
    expect(configFromHash('#something-else')).toBeNull()
  })
})
