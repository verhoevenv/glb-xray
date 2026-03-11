import { useMemo, useState } from 'react'
import { TreeNode, type JsonValue } from './TreeNode'
import { getMatchingPaths } from '../lib/jsonSearch'
import styles from './JsonTree.module.css'

interface JsonTreeProps {
  data: Record<string, unknown>
}

export function JsonTree({ data }: JsonTreeProps) {
  const [query, setQuery] = useState('')

  const matchingPaths = useMemo(
    () => getMatchingPaths(data, query),
    [data, query]
  )

  const hasQuery = query.trim().length > 0

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search keys and values…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search JSON"
          spellCheck={false}
        />
        {hasQuery && (
          <span className={styles.resultCount}>
            {matchingPaths.size === 0 ? 'No matches' : `${matchingPaths.size} path${matchingPaths.size !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>
      <div className={styles.tree} role="tree">
        {Object.entries(data).map(([key, value]) => (
          <TreeNode
            key={key}
            label={key}
            value={value as JsonValue}
            depth={0}
            defaultExpanded={hasQuery ? matchingPaths.has(key) : undefined}
            highlighted={hasQuery && matchingPaths.has(key)}
          />
        ))}
      </div>
    </div>
  )
}
