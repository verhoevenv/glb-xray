import { useContext, useEffect, useRef, useState } from 'react'
import styles from './TreeNode.module.css'
import { getGltfEnumLabel } from '../lib/gltfEnums'
import { getRefTarget, GLTF_ARRAY_INDEX_FIELDS, GLTF_OBJECT_VALUE_FIELDS } from '../lib/gltfRefs'
import { NavigationContext } from './NavigationContext'

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
  path?: string
  valueRefTarget?: string
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

function shortenPath(path: string): string {
  const parts = path.split('.')
  return parts.slice(-2).join('.')
}

export function TreeNode({
  label,
  value,
  depth,
  defaultExpanded = depth < 2,
  highlighted = false,
  fieldName,
  forceExpanded,
  path = '',
  valueRefTarget,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(
    forceExpanded !== undefined ? forceExpanded : defaultExpanded
  )

  const { navigatePath, navigateTo, getBackRefs, rootKeys } = useContext(NavigationContext)
  const rowRef = useRef<HTMLDivElement>(null)

  const isLeaf = isPrimitive(value)
  const indent = depth * 16

  // Auto-expand when navigatePath targets this node or a descendant
  useEffect(() => {
    if (!isLeaf && navigatePath && path &&
        (navigatePath === path ||
         navigatePath.startsWith(path + '[') ||
         navigatePath.startsWith(path + '.'))) {
      setExpanded(true)
    }
  }, [navigatePath, path, isLeaf])

  // Scroll and flash when this node is the navigation target
  useEffect(() => {
    if (navigatePath === path && path && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      rowRef.current.classList.remove(styles.navTarget)
      requestAnimationFrame(() => {
        rowRef.current?.classList.add(styles.navTarget)
      })
    }
  }, [navigatePath, path])

  if (isLeaf) {
    const enumLabel =
      fieldName !== undefined && typeof value === 'number'
        ? getGltfEnumLabel(fieldName, value)
        : undefined

    // Determine if this leaf is a navigable reference
    const directRef =
      fieldName !== undefined && typeof value === 'number'
        ? getRefTarget(fieldName, value)
        : undefined
    const arrayRef =
      valueRefTarget !== undefined && typeof value === 'number'
        ? `${valueRefTarget}[${value}]`
        : undefined
    const refTarget = directRef ?? arrayRef

    // Only show ref link if the target array exists in the root JSON
    const refTargetArray = refTarget?.match(/^([^[]+)/)?.[1]
    const showRefLink = refTarget !== undefined && refTargetArray !== undefined && rootKeys.has(refTargetArray)

    return (
      <div
        ref={rowRef}
        className={`${styles.row} ${highlighted ? styles.highlighted : ''}`}
        style={{ paddingLeft: indent }}
        data-testid="tree-leaf"
      >
        <span className={styles.key}>{label}</span>
        <span className={styles.colon}>: </span>
        {showRefLink ? (
          <button
            className={`${styles.number} ${styles.refLink}`}
            onClick={() => navigateTo(refTarget!)}
            title={`Navigate to ${refTarget}`}
          >
            {String(value)}
          </button>
        ) : (
          <span className={typeClass(value)}>{primitiveLabel(value)}</span>
        )}
        {enumLabel !== undefined && (
          <span className={styles.enumLabel}>{enumLabel}</span>
        )}
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const children = isArray
    ? value.map((v, i) => ({ key: String(i), value: v as JsonValue }))
    : Object.entries(value as Record<string, JsonValue>).map(([k, v]) => ({
        key: k,
        value: v,
      }))

  // For array children: if this field is in GLTF_ARRAY_INDEX_FIELDS, pass valueRefTarget
  const childValueRefTarget = fieldName
    ? (isArray ? GLTF_ARRAY_INDEX_FIELDS[fieldName] : GLTF_OBJECT_VALUE_FIELDS[fieldName])
    : undefined

  const backRefs = path ? getBackRefs(path) : []

  return (
    <div data-testid="tree-node">
      <div
        ref={rowRef}
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
        {backRefs.length > 0 && (
          <span className={styles.backRefs} onClick={e => e.stopPropagation()}>
            {'← '}
            {backRefs.slice(0, 3).map(src => (
              <button
                key={src}
                className={styles.backRefLink}
                onClick={e => { e.stopPropagation(); navigateTo(src) }}
                title={src}
              >
                {shortenPath(src)}
              </button>
            ))}
            {backRefs.length > 3 && (
              <span className={styles.backRefOverflow}>+{backRefs.length - 3}</span>
            )}
          </span>
        )}
      </div>
      {expanded && (
        <div data-testid="tree-children">
          {children.map(({ key, value: childValue }) => {
            const childPath = path
              ? (isArray ? `${path}[${key}]` : `${path}.${key}`)
              : (isArray ? `[${key}]` : key)
            return (
              <TreeNode
                key={key}
                label={isArray ? `[${key}]` : key}
                value={childValue}
                depth={depth + 1}
                fieldName={isArray ? undefined : key}
                forceExpanded={forceExpanded}
                path={childPath}
                valueRefTarget={childValueRefTarget}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
