import type { GeneratorConfig, Subpattern } from './types'
import { MAX_WORDS } from './validate'

/**
 * Settings files use the Awkwords 1.2 text format (extension `.awkw`):
 *
 *   #awkwords version 1.3.0
 *   V:a/i/u    <- subpattern: one capital letter, a colon, its pattern
 *   r:CV(N)    <- main pattern
 *   n:30       <- number of words
 *   nle        <- "new line each" (present = on)
 *   filterdup  <- "filter duplicates" (present = on)
 *
 * Lines starting with `#` are comments.
 */

export const FILE_EXTENSION = '.awkw'

const oneLine = (s: string): string => s.replace(/[\r\n]+/g, ' ')

/** Default download name */
export const DEFAULT_FILENAME = 'awkwords-settings.awkw'

/** Line order: version, subpatterns, pattern, count, then flags. */
export function serializeSettings(config: GeneratorConfig): string {
  const lines = ['#awkwords version 1.3.0']
  for (const sp of config.subpatterns) {
    // save every row that has anything filled in
    if (sp.name !== '' || sp.content !== '') {
      lines.push(`${sp.name}:${oneLine(sp.content)}`)
    }
  }
  lines.push(`r:${oneLine(config.pattern)}`)
  lines.push(`n:${config.count}`)
  if (config.newLineEach) {
    lines.push('nle')
  }
  if (config.filterDuplicates) {
    lines.push('filterdup')
  }
  return lines.join('\n') + '\n'
}

export function parseSettings(text: string): GeneratorConfig {
  let pattern: string | undefined
  let count: number | undefined
  let newLineEach = false
  let filterDuplicates = false
  const subpatterns: Subpattern[] = []

  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (line === '' || line.startsWith('#')) {
      continue
    }
    if (line.startsWith('nle')) {
      newLineEach = true
    }
    if (line.startsWith('filterdup')) {
      filterDuplicates = true
    }
    if (line.startsWith('n:')) {
      count = parseInt(line.slice(2), 10)
    }
    if (line.startsWith('r:')) {
      pattern = line.slice(2)
    }
    const m = /^([A-Z]?):(.*)$/.exec(line)
    if (m) {
      subpatterns.push({ name: m[1], content: m[2] })
    }
  }

  if (pattern === undefined || count === undefined || Number.isNaN(count)) {
    throw new Error('This does not look like a valid Awkwords settings file.')
  }
  return {
    pattern,
    subpatterns,
    count: Math.min(Math.max(count, 1), MAX_WORDS),
    newLineEach,
    filterDuplicates,
  }
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code =
        body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : whole
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole
  })
}

/**
 * Decodes the bytes of a settings file. Files written by Awkwords 1.2+ are
 * UTF-8 and start with an `#awkwords` header; older files are Windows-1250
 * and may contain HTML entities, so they are converted.
 */
export function decodeSettingsBytes(bytes: Uint8Array): string {
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  if (/^﻿?#awkwords\s/m.test(utf8)) {
    return utf8
  }
  return decodeEntities(new TextDecoder('windows-1250').decode(bytes))
}
