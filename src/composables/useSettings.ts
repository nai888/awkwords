import { computed, reactive, watch } from 'vue'
import { MAX_SUBPATTERNS, defaultConfig, validate } from '../engine'
import type { GeneratorConfig } from '../engine'
import { configFromHash } from '../io/share'

const STORAGE_KEY = 'awkwords-vue:settings:v1'

export interface Row {
  /** Stable key for v-for; not part of the saved settings. */
  id: number
  name: string
  content: string
}

interface State {
  pattern: string
  rows: Row[]
  count: number
  newLineEach: boolean
  filterDuplicates: boolean
}

let nextId = 1
const toRows = (config: GeneratorConfig): Row[] => {
  return config.subpatterns.map((sp) => ({ id: nextId++, name: sp.name, content: sp.content }))
}

function readStored(): GeneratorConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const data = JSON.parse(raw) as GeneratorConfig
    if (typeof data.pattern !== 'string' || !Array.isArray(data.subpatterns)) {
      return null
    }
    return data
  } catch {
    return null
  }
}

function initialConfig(): GeneratorConfig {
  // A shared link wins over saved settings; consume it so a reload doesn't re-apply it.
  const shared = configFromHash(location.hash)
  if (shared) {
    history.replaceState(null, '', location.pathname + location.search)
    return shared
  }
  return readStored() ?? defaultConfig()
}

const initial = initialConfig()

const state = reactive<State>({
  pattern: initial.pattern,
  rows: toRows(initial),
  count: initial.count,
  newLineEach: initial.newLineEach,
  filterDuplicates: initial.filterDuplicates,
})

function toConfig(): GeneratorConfig {
  return {
    pattern: state.pattern,
    subpatterns: state.rows.map((r) => ({ name: r.name, content: r.content })),
    count: state.count,
    newLineEach: state.newLineEach,
    filterDuplicates: state.filterDuplicates,
  }
}

function applyConfig(config: GeneratorConfig): void {
  state.pattern = config.pattern
  state.rows = toRows(config)
  state.count = config.count
  state.newLineEach = config.newLineEach
  state.filterDuplicates = config.filterDuplicates
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
watch(
  state,
  () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toConfig()))
      } catch {
        /* storage unavailable or full: settings simply won't persist */
      }
    }, 300)
  },
  { deep: true },
)

const validation = computed(() => validate(toConfig()))

const canAddRow = computed(() => state.rows.length < MAX_SUBPATTERNS)

function addRow(): void {
  if (!canAddRow.value) {
    return
  }
  state.rows.push({ id: nextId++, name: '', content: '' })
}

function removeRow(id: number): void {
  state.rows = state.rows.filter((r) => r.id !== id)
}

/** Keeps a subpattern name to a single capital letter. */
function normalizeName(value: string): string {
  return value.toUpperCase().match(/[A-Z]/)?.[0] ?? ''
}

export function useSettings() {
  return { state, validation, canAddRow, toConfig, applyConfig, addRow, removeRow, normalizeName }
}
