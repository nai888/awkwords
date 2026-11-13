import type { GeneratorConfig } from './types'

/* Default starting values */
export function defaultConfig(): GeneratorConfig {
  return {
    pattern: 'CV(CV)(N)',
    subpatterns: [
      { name: 'V', content: 'a/i/u' },
      { name: 'C', content: 'p/t/k/s/m/n' },
      { name: 'N', content: 'm/n' },
    ],
    count: 100,
    newLineEach: false,
    filterDuplicates: false,
  }
}
