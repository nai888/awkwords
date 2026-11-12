import { computed, ref } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'awkwords-vue:theme'
const ORDER: ThemePreference[] = ['system', 'light', 'dark']
const LABELS: Record<ThemePreference, string> = { system: 'System', light: 'Light', dark: 'Dark' }

function read(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') {
      return v
    }
  } catch {
    /* ignore */
  }
  return 'system'
}

const preference = ref<ThemePreference>(read())

function apply(): void {
  const root = document.documentElement
  if (preference.value === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', preference.value)
  }
}

/** Call once before mounting so the first paint already has the right theme. */
export function initTheme(): void {
  apply()
}

export function useTheme() {
  function cycle(): void {
    preference.value = ORDER[(ORDER.indexOf(preference.value) + 1) % ORDER.length]
    try {
      localStorage.setItem(STORAGE_KEY, preference.value)
    } catch {
      /* ignore */
    }
    apply()
  }
  const label = computed(() => LABELS[preference.value])
  return { preference, label, cycle }
}
