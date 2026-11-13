import { generate } from './generator'
import type { GenerateResult, GeneratorConfig } from './types'

export interface WorkerRequest {
  id: number
  config: GeneratorConfig
}

export interface WorkerResponse {
  id: number
  result: GenerateResult
}

// Minimal typing for the worker global, so no "WebWorker" lib is needed
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null
  postMessage(message: WorkerResponse): void
}

ctx.onmessage = (e) => {
  const { id, config } = e.data
  ctx.postMessage({ id, result: generate(config) })
}
