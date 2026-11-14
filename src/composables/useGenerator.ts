import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { generate } from '../engine'
import type { GenerateResult, GeneratorConfig } from '../engine'
import type { WorkerRequest, WorkerResponse } from '../engine/generator.worker'

/** Up to this many words, generating inline is faster than a worker round trip. */
const WORKER_THRESHOLD = 2000

export function useGenerator() {
  const result = shallowRef<GenerateResult | null>(null)
  const busy = ref(false)

  let worker: Worker | null = null
  let currentId = 0

  function stopWorker(): void {
    worker?.terminate()
    worker = null
  }

  function runInline(config: GeneratorConfig): void {
    stopWorker()
    busy.value = false
    result.value = generate(config)
  }

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(new URL('../engine/generator.worker.ts', import.meta.url), {
        type: 'module',
      })
    }
    return worker
  }

  function run(config: GeneratorConfig): void {
    const id = ++currentId
    if (typeof Worker === 'undefined' || config.count <= WORKER_THRESHOLD) {
      runInline(config)
      return
    }

    busy.value = true
    const w = getWorker()
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.id !== id) {
        return // a newer run superseded this one
      }
      result.value = e.data.result
      busy.value = false
    }
    w.onerror = () => {
      // The worker failed to start (e.g. blocked by the host): fall back to the main thread.
      stopWorker()
      if (id === currentId) {
        runInline(config)
      }
    }
    const request: WorkerRequest = { id, config }
    w.postMessage(request)
  }

  /** Abandons a running generation; the worker is restarted on the next run. */
  function cancel(): void {
    currentId++
    stopWorker()
    busy.value = false
  }

  onBeforeUnmount(stopWorker)

  return { result, busy, run, cancel }
}
