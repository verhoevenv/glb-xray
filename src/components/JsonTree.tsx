import { useMemo, useState } from 'react'
import { TreeNode, type JsonValue } from './TreeNode'
import { getMatchingPaths } from '../lib/jsonSearch'
import { buildBackRefMap } from '../lib/gltfRefs'
import { NavigationContext } from './NavigationContext'
import styles from './JsonTree.module.css'

interface JsonTreeProps {
  data: Record<string, unknown>
}

export function JsonTree({ data }: JsonTreeProps) {
  const [query, setQuery] = useState('')
  const [expandOverride, setExpandOverride] = useState<boolean | undefined>(false)
  const [expandRevision, setExpandRevision] = useState(0)
  const [navigatePath, setNavigatePath] = useState<string | undefined>()

  const matchingPaths = useMemo(
    () => getMatchingPaths(data, query),
    [data, query]
  )

  const backRefMap = useMemo(() => buildBackRefMap(data), [data])
  const rootKeys = useMemo(() => new Set(Object.keys(data)), [data])

  const hasQuery = query.trim().length > 0

  const handleCollapseAll = () => { setExpandOverride(false); setExpandRevision(r => r + 1) }
  const handleExpandAll   = () => { setExpandOverride(true);  setExpandRevision(r => r + 1) }

  return (
    <NavigationContext.Provider value={{
      navigatePath,
      navigateTo: setNavigatePath,
      getBackRefs: p => backRefMap.get(p) ?? [],
      rootKeys,
    }}>
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
          <div className={styles.expandButtons}>
            <button className={styles.expandBtn} onClick={handleCollapseAll} title="Collapse all">Collapse all</button>
            <button className={styles.expandBtn} onClick={handleExpandAll}   title="Expand all">Expand all</button>
          </div>
        </div>
        <div className={styles.tree} role="tree">
          {Object.entries(data).map(([key, value]) => (
            <TreeNode
              key={`${key}-${expandRevision}`}
              label={key}
              value={value as JsonValue}
              depth={0}
              path={key}
              defaultExpanded={hasQuery ? matchingPaths.has(key) : undefined}
              forceExpanded={hasQuery ? undefined : expandOverride}
              highlighted={hasQuery && matchingPaths.has(key)}
            />
          ))}
        </div>
      </div>
    </NavigationContext.Provider>
  )
}
