export interface GeneratorConfig {
  /* The main pattern */
  pattern: string
  subpatterns: Subpattern[]
  /* Number of words to attempt to generate */
  count: number
  /* Space vs newline separator */
  newLineEach: boolean
  /* Unique results */
  filterDuplicates: boolean
}

export interface Subpattern {
  name: string
  content: string
}

/* Parsed patterns */

export interface LiteralFragment {
  kind: 'literal'
  text: string
  filters: string[]
}

export interface GroupFragment {
  kind: 'group'
  /* () vs [] */
  optional: boolean
  body: Choice
  filters: string[]
}

export interface RefFragment {
  kind: 'ref'
  letter: string
  filters: string[]
}

export type Fragment = LiteralFragment | GroupFragment | RefFragment

export interface Option {
  fragments: Fragment[]
  weight: number
}

export interface Choice {
  options: Option[]
}

/* Results */

export interface Issue {
  kind: 'range' | 'cycle'
  message: string
}

export interface ValidationResult {
  ok: boolean
  errors: Issue[]
  warnings: string[]
}

export interface GenerateResult {
  words: string[]
  /* Number of output words */
  printed: number
  /* Total number of dropped words (filtered + duplicates) */
  dropped: number
  /* Number of words rejected by filters */
  filtered: number
  /* Number of duplicate words dropped */
  duplicates: number
  /* Generation time in ms */
  ms: number
  /* Number of ways the pattern can render (not the number of distinct words) */
  possibilities: bigint
  errors: Issue[]
  warnings: string[]
}
