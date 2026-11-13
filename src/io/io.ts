import { decodeSettingsBytes, parseSettings } from '../engine'
import type { GeneratorConfig } from '../engine'

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readSettingsFile(file: File): Promise<GeneratorConfig> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  return parseSettings(decodeSettingsBytes(bytes))
}

/** Copies text to the clipboard; returns false if the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
