/** Formats the (possibly huge) number of possible renderings for display. */
export function formatBigInt(n: bigint): string {
  const s = n.toString()
  if (s.length <= 15) {
    return Number(n).toLocaleString()
  }
  return `${s[0]}.${s.slice(1, 4)}e+${s.length - 1}`
}
