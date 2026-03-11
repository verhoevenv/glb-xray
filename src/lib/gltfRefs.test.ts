import { describe, it, expect } from 'vitest'
import { getRefTarget, getArrayRefTarget, buildBackRefMap } from './gltfRefs'

describe('getRefTarget', () => {
  it('returns target path for known direct-ref field', () => {
    expect(getRefTarget('bufferView', 0)).toBe('bufferViews[0]')
    expect(getRefTarget('bufferView', 3)).toBe('bufferViews[3]')
  })

  it('returns target path for material field', () => {
    expect(getRefTarget('material', 2)).toBe('materials[2]')
  })

  it('returns target path for index field (textureInfo)', () => {
    expect(getRefTarget('index', 0)).toBe('textures[0]')
  })

  it('returns target path for source field (texture.source → images)', () => {
    expect(getRefTarget('source', 1)).toBe('images[1]')
  })

  it('returns undefined for unknown field', () => {
    expect(getRefTarget('name', 0)).toBeUndefined()
    expect(getRefTarget('count', 5)).toBeUndefined()
  })
})

describe('getArrayRefTarget', () => {
  it('returns target array for children field', () => {
    expect(getArrayRefTarget('children')).toBe('nodes')
  })

  it('returns target array for joints field', () => {
    expect(getArrayRefTarget('joints')).toBe('nodes')
  })

  it('returns undefined for unknown field', () => {
    expect(getArrayRefTarget('name')).toBeUndefined()
    expect(getArrayRefTarget('extras')).toBeUndefined()
  })
})

describe('buildBackRefMap', () => {
  it('builds back-refs for direct index fields', () => {
    const json = {
      accessors: [{ bufferView: 0, byteOffset: 0 }],
      bufferViews: [{ buffer: 0, byteLength: 100 }],
      buffers: [{ byteLength: 100 }],
    }
    const map = buildBackRefMap(json)
    expect(map.get('bufferViews[0]')).toContain('accessors[0].bufferView')
    expect(map.get('buffers[0]')).toContain('bufferViews[0].buffer')
  })

  it('builds back-refs for multiple accessors referencing same bufferView', () => {
    const json = {
      accessors: [
        { bufferView: 0 },
        { bufferView: 0 },
        { bufferView: 1 },
      ],
      bufferViews: [{}, {}],
    }
    const map = buildBackRefMap(json)
    const refs = map.get('bufferViews[0]') ?? []
    expect(refs).toContain('accessors[0].bufferView')
    expect(refs).toContain('accessors[1].bufferView')
    expect(refs).toHaveLength(2)
    expect(map.get('bufferViews[1]')).toContain('accessors[2].bufferView')
  })

  it('builds back-refs for array-of-indices fields (children)', () => {
    const json = {
      nodes: [
        { name: 'root', children: [1, 2] },
        { name: 'child1' },
        { name: 'child2' },
      ],
    }
    const map = buildBackRefMap(json)
    expect(map.get('nodes[1]')).toContain('nodes[0].children[0]')
    expect(map.get('nodes[2]')).toContain('nodes[0].children[1]')
  })

  it('builds back-refs for scene.nodes array', () => {
    const json = {
      scenes: [{ nodes: [0, 3] }],
      nodes: [{}, {}, {}, {}],
    }
    const map = buildBackRefMap(json)
    expect(map.get('nodes[0]')).toContain('scenes[0].nodes[0]')
    expect(map.get('nodes[3]')).toContain('scenes[0].nodes[1]')
  })

  it('builds back-refs for texture references', () => {
    const json = {
      materials: [
        {
          pbrMetallicRoughness: {
            baseColorTexture: { index: 0 },
          },
        },
      ],
      textures: [{}],
    }
    const map = buildBackRefMap(json)
    const refs = map.get('textures[0]') ?? []
    expect(refs).toContain('materials[0].pbrMetallicRoughness.baseColorTexture.index')
  })

  it('builds back-refs for mesh reference on nodes', () => {
    const json = {
      nodes: [{ mesh: 0 }],
      meshes: [{ name: 'Cube' }],
    }
    const map = buildBackRefMap(json)
    expect(map.get('meshes[0]')).toContain('nodes[0].mesh')
  })

  it('returns empty map for JSON with no references', () => {
    const json = {
      asset: { version: '2.0', generator: 'test' },
    }
    const map = buildBackRefMap(json)
    expect(map.size).toBe(0)
  })

  it('does not add back-ref for string or boolean values in ref fields', () => {
    const json = {
      // bufferView would normally be a number index, but here it's a string (invalid glTF, edge case)
      accessors: [{ bufferView: 'bad' as unknown as number }],
    }
    const map = buildBackRefMap(json)
    expect(map.size).toBe(0)
  })

  it('builds back-refs for primitive attributes (POSITION, NORMAL, etc.)', () => {
    const json = {
      meshes: [
        {
          primitives: [
            { attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 } },
          ],
        },
      ],
      accessors: [{}, {}, {}],
    }
    const map = buildBackRefMap(json)
    expect(map.get('accessors[0]')).toContain('meshes[0].primitives[0].attributes.POSITION')
    expect(map.get('accessors[1]')).toContain('meshes[0].primitives[0].attributes.NORMAL')
    expect(map.get('accessors[2]')).toContain('meshes[0].primitives[0].attributes.TEXCOORD_0')
  })

  it('back-refs from attributes coexist with other accessor back-refs', () => {
    const json = {
      meshes: [
        { primitives: [{ attributes: { POSITION: 0 }, indices: 0 }] },
      ],
      accessors: [{}],
    }
    const map = buildBackRefMap(json)
    const refs = map.get('accessors[0]') ?? []
    expect(refs).toContain('meshes[0].primitives[0].attributes.POSITION')
    expect(refs).toContain('meshes[0].primitives[0].indices')
  })
})
