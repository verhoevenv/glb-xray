// Direct field → array: field name maps to which top-level array it indexes
export const GLTF_INDEX_FIELDS: Record<string, string> = {
  bufferView: 'bufferViews',
  buffer: 'buffers',
  mesh: 'meshes',
  skin: 'skins',
  camera: 'cameras',
  material: 'materials',
  sampler: 'samplers',           // texture.sampler → samplers
  source: 'images',              // texture.source → images
  skeleton: 'nodes',             // skin.skeleton
  inverseBindMatrices: 'accessors',
  input: 'accessors',            // animation sampler
  output: 'accessors',           // animation sampler
  indices: 'accessors',          // mesh primitive
  index: 'textures',             // textureInfo.index
  node: 'nodes',                 // animation channel target
  scene: 'scenes',
}

// Array fields where every numeric element is an index into the target array
export const GLTF_ARRAY_INDEX_FIELDS: Record<string, string> = {
  children: 'nodes',   // node.children
  nodes: 'nodes',      // scene.nodes
  joints: 'nodes',     // skin.joints
}

/** Returns the target path for a forward reference, e.g. "bufferViews[1]" */
export function getRefTarget(fieldName: string, value: number): string | undefined {
  const arr = GLTF_INDEX_FIELDS[fieldName]
  if (arr === undefined) return undefined
  return `${arr}[${value}]`
}

/** Returns the target array name for an array-of-indices field */
export function getArrayRefTarget(fieldName: string): string | undefined {
  return GLTF_ARRAY_INDEX_FIELDS[fieldName]
}

/** Map from target path to list of source paths that reference it */
export type BackRefMap = Map<string, string[]>

function addBackRef(out: BackRefMap, targetPath: string, sourcePath: string) {
  const arr = out.get(targetPath)
  if (arr) {
    arr.push(sourcePath)
  } else {
    out.set(targetPath, [sourcePath])
  }
}

function walkNode(
  value: unknown,
  path: string,
  fieldName: string | undefined,
  parentIsArrayIndexField: string | undefined,
  out: BackRefMap,
) {
  if (typeof value === 'number') {
    if (fieldName !== undefined && GLTF_INDEX_FIELDS[fieldName] !== undefined) {
      addBackRef(out, `${GLTF_INDEX_FIELDS[fieldName]}[${value}]`, path)
    }
    if (parentIsArrayIndexField !== undefined) {
      addBackRef(out, `${parentIsArrayIndexField}[${value}]`, path)
    }
    return
  }

  if (Array.isArray(value)) {
    const arrayRefTarget = fieldName !== undefined ? GLTF_ARRAY_INDEX_FIELDS[fieldName] : undefined
    for (let i = 0; i < value.length; i++) {
      walkNode(value[i], `${path}[${i}]`, undefined, arrayRefTarget, out)
    }
    return
  }

  if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const childPath = path ? `${path}.${k}` : k
      walkNode(v, childPath, k, undefined, out)
    }
  }
}

/**
 * Traverses the glTF JSON and returns a map from each referenced element path
 * to the list of paths that reference it.
 */
export function buildBackRefMap(json: Record<string, unknown>): BackRefMap {
  const out: BackRefMap = new Map()
  for (const [k, v] of Object.entries(json)) {
    walkNode(v, k, k, undefined, out)
  }
  return out
}
