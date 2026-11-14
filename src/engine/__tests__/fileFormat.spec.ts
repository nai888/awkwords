import { version as VERSION } from '../../../package.json'
import { describe, expect, it } from 'vitest'
import { decodeSettingsBytes, parseSettings, serializeSettings } from '..'
import type { GeneratorConfig } from '..'

const sample: GeneratorConfig = {
  pattern: 'CV(N)^n',
  subpatterns: [
    { name: 'V', content: 'a/i/u' },
    { name: 'C', content: 'k/t*3' },
    { name: '', content: 'unnamed' },
  ],
  count: 25,
  newLineEach: true,
  filterDuplicates: true,
}

describe('settings files', () => {
  it('round-trips a configuration', () => {
    expect(parseSettings(serializeSettings(sample))).toEqual(sample)
  })

  it('writes the original header and flags', () => {
    const text = serializeSettings({ ...sample, newLineEach: false, filterDuplicates: false })
    expect(text.startsWith(`#awkwords version ${VERSION}\n`)).toBe(true)
    expect(text).not.toContain('\nnle')
    expect(text).not.toContain('filterdup')
  })

  it('rejects files without a pattern or word count', () => {
    expect(() => parseSettings('hello')).toThrow()
    expect(() => parseSettings('n:5')).toThrow()
  })

  it('reads files with Windows line endings', () => {
    const cfg = parseSettings(`#awkwords version ${VERSION}\r\nn:3\r\nr:aV\r\nV:x/y\r\n`)
    expect(cfg.pattern).toBe('aV')
    expect(cfg.subpatterns).toEqual([{ name: 'V', content: 'x/y' }])
  })

  it('decodes UTF-8 files that carry the header', () => {
    const text = `#awkwords version ${VERSION}\nn:1\nr:čšž\n`
    expect(parseSettings(decodeSettingsBytes(new TextEncoder().encode(text))).pattern).toBe('čšž')
  })

  it('converts old Windows-1250 files and HTML entities', () => {
    // "n:1\nr:" + 0xE8 (č in cp1250) + "&#945;" (an entity for α)
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('n:1\nr:'),
      0xe8,
      ...new TextEncoder().encode('&#945;\n'),
    ])
    expect(parseSettings(decodeSettingsBytes(bytes)).pattern).toBe('čα')
  })
})
