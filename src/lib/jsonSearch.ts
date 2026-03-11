/**
 * Returns true when the given JSON value (or any of its descendants) contains
 * a string representation that includes `query` (case-insensitive).
 */
export function valueMatchesSearch(value: unknown, query: string): boolean {
  if (query === '') return true
  const q = query.toLowerCase()
  return searchValue(value, q)
}

function searchValue(value: unknown, q: string): boolean {
  if (value === null) return 'null'.includes(q)
  if (typeof value === 'boolean') return String(value).includes(q)
  if (typeof value === 'number') return String(value).includes(q)
  if (typeof value === 'string') return value.toLowerCase().includes(q)
  if (Array.isArray(value)) return value.some(v => searchValue(v, q))
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(v => searchValue(v, q))
  }
  return false
}

/**
 * Returns the set of key-paths (dot-separated) whose subtrees match the query.
 * Paths for array indices use bracket notation, e.g. "meshes[0].name".
 */
export function getMatchingPaths(
  obj: Record<string, unknown>,
  query: string
): Set<string> {
  const paths = new Set<string>()
  if (query === '') return paths
  const q = query.toLowerCase()
  collectPaths(obj, q, '', paths)
  return paths
}

function collectPaths(
  value: unknown,
  q: string,
  path: string,
  out: Set<string>
): boolean {
  let matched = false

  if (value === null || typeof value !== 'object') {
    if (String(value).toLowerCase().includes(q)) {
      out.add(path)
      return true
    }
    return false
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const childPath = path ? `${path}[${i}]` : `[${i}]`
      if (collectPaths(value[i], q, childPath, out)) {
        out.add(path)
        matched = true
      }
    }
  } else {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${k}` : k
      const keyMatches = k.toLowerCase().includes(q)
      const childMatched = collectPaths(v, q, childPath, out)
      if (keyMatches) {
        out.add(childPath)
        out.add(path)
        matched = true
      } else if (childMatched) {
        out.add(path)
        matched = true
      }
    }
  }

  return matched
}
