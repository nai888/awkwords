import type { GeneratorConfig, Subpattern } from '../engine'
import { MAX_WORDS } from '../engine'

interface SharePayload {
  v: 1
  p: string
  s: [string, string][]
  n: number
  l: 0 | 1
  d: 0 | 1
}

export function encodeShare(config: GeneratorConfig): string {
  const payload: SharePayload = {
    v: 1,
    p: config.pattern,
    s: config.subpatterns.map((sp) => [sp.name, sp.content]),
    n: config.count,
    l: config.newLineEach ? 1 : 0,
    d: config.filterDuplicates ? 1 : 0,
  }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeShare(token: string): GeneratorConfig | null {
  try {
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SharePayload>

    if (data.v !== 1 || typeof data.p !== 'string' || !Array.isArray(data.s)) {
      return null
    }
    const subpatterns: Subpattern[] = []
    for (const row of data.s) {
      if (!Array.isArray(row) || typeof row[1] !== 'string') {
        return null
      }
      subpatterns.push({
        name: /^[A-Z]$/.test(String(row[0])) ? String(row[0]) : '',
        content: row[1],
      })
    }
    const count = Number(data.n)
    return {
      pattern: data.p,
      subpatterns,
      count: Number.isInteger(count) ? Math.min(Math.max(count, 1), MAX_WORDS) : 30,
      newLineEach: data.l === 1,
      filterDuplicates: data.d === 1,
    }
  } catch {
    return null
  }
}

export function buildShareUrl(config: GeneratorConfig, base: string): string {
  const url = new URL(base)
  url.hash = `s=${encodeShare(config)}`
  return url.toString()
}

/** Reads a configuration from a location hash like `#s=...`. */
export function configFromHash(hash: string): GeneratorConfig | null {
  const m = /^#s=([A-Za-z0-9_-]+)$/.exec(hash)
  return m ? decodeShare(m[1]) : null
}
