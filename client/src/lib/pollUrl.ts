const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

/** Extract poll id from a pasted link or raw uuid. */
export function parsePollIdFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(UUID_RE)
  return match ? match[0] : null
}
