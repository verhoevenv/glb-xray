import { useState } from 'react'
import styles from './TreeNode.module.css'
import { getGltfEnumLabel } from '../lib/gltfEnums'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

interface TreeNodeProps {
  label: string
  value: JsonValue
  depth: number
  defaultExpanded?: boolean
  highlighted?: boolean
  fieldName?: string
  forceExpanded?: boolean
}

function isPrimitive(v: JsonValue): v is string | number | boolean | null {
  return v === null || typeof v !== 'object'
}

function typeClass(v: JsonValue): string {
  if (v === null) return styles.null
  if (typeof v === 'boolean') return styles.boolean
  if (typeof v === 'number') return styles.number
  if (typeof v === 'string') return styles.string
  return ''
}

function primitiveLabel(v: JsonValue): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v}"`
  return String(v)
}

function collectionSummary(v: JsonValue): string {
  if (Array.isArray(v)) return `[${v.length}]`
  if (typeof v === 'object' && v !== null) {
    const count = Object.keys(v).length
    return `{${count}}`
  }
  return ''
}

export function TreeNode({
  label,
  value,
  depth,
  defaultExpanded = depth < 2,
  highlighted = false,
  fieldName,
  forceExpanded,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(
    forceExpanded !== undefined ? forceExpanded : defaultExpanded
  )

  const isLeaf = isPrimitive(value)
  const indent = depth * 16

  if (isLeaf) {
    const enumLabel =
      fieldName !== undefined && typeof value === 'number'
        ? getGltfEnumLabel(fieldName, value)
        : undefined
    return (
      <div
        className={`${styles.row} ${highlighted ? styles.highlighted : ''}`}
        style={{ paddingLeft: indent }}
        data-testid="tree-leaf"
      >
        <span className={styles.key}>{label}</span>
        <span className={styles.colon}>: </span>
        <span className={typeClass(value)}>{primitiveLabel(value)}</span>
        {enumLabel !== undefined && (
          <span className={styles.enumLabel}>{enumLabel}</span>
        )}
      </div>
    )
  }

  const children = Array.isArray(value)
    ? value.map((v, i) => ({ key: String(i), value: v as JsonValue }))
    : Object.entries(value as Record<string, JsonValue>).map(([k, v]) => ({
        key: k,
        value: v,
      }))

  return (
    <div data-testid="tree-node">
      <div
        className={`${styles.row} ${styles.expandable} ${highlighted ? styles.highlighted : ''}`}
        style={{ paddingLeft: indent }}
        onClick={() => setExpanded(e => !e)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(x => !x)
        }}
      >
        <span className={styles.toggle}>{expanded ? '▾' : '▸'}</span>
        <span className={styles.key}>{label}</span>
        {!expanded && (
          <span className={styles.summary}> {collectionSummary(value)}</span>
        )}
      </div>
      {expanded && (
        <div data-testid="tree-children">
          {children.map(({ key, value: childValue }) => (
            <TreeNode
              key={key}
              label={Array.isArray(value) ? `[${key}]` : key}
              value={childValue}
              depth={depth + 1}
              fieldName={key}
              forceExpanded={forceExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
