import { describe, it, expect } from 'vitest'
import { getGltfEnumLabel } from './gltfEnums'

describe('getGltfEnumLabel', () => {
  it('returns label for known componentType value', () => {
    expect(getGltfEnumLabel('componentType', 5126)).toBe('FLOAT')
    expect(getGltfEnumLabel('componentType', 5120)).toBe('BYTE')
    expect(getGltfEnumLabel('componentType', 5125)).toBe('UNSIGNED_INT')
  })

  it('returns label for known mode value', () => {
    expect(getGltfEnumLabel('mode', 4)).toBe('TRIANGLES')
    expect(getGltfEnumLabel('mode', 0)).toBe('POINTS')
    expect(getGltfEnumLabel('mode', 6)).toBe('TRIANGLE_FAN')
  })

  it('returns label for known target value', () => {
    expect(getGltfEnumLabel('target', 34962)).toBe('ARRAY_BUFFER')
    expect(getGltfEnumLabel('target', 34963)).toBe('ELEMENT_ARRAY_BUFFER')
  })

  it('returns label for magFilter', () => {
    expect(getGltfEnumLabel('magFilter', 9728)).toBe('NEAREST')
    expect(getGltfEnumLabel('magFilter', 9729)).toBe('LINEAR')
  })

  it('returns label for minFilter', () => {
    expect(getGltfEnumLabel('minFilter', 9984)).toBe('NEAREST_MIPMAP_NEAREST')
    expect(getGltfEnumLabel('minFilter', 9987)).toBe('LINEAR_MIPMAP_LINEAR')
  })

  it('returns label for wrapS and wrapT', () => {
    expect(getGltfEnumLabel('wrapS', 33071)).toBe('CLAMP_TO_EDGE')
    expect(getGltfEnumLabel('wrapT', 10497)).toBe('REPEAT')
    expect(getGltfEnumLabel('wrapS', 33648)).toBe('MIRRORED_REPEAT')
  })

  it('returns undefined for unknown key', () => {
    expect(getGltfEnumLabel('someRandomKey', 5126)).toBeUndefined()
  })

  it('returns undefined for known key with unrecognized value', () => {
    expect(getGltfEnumLabel('componentType', 9999)).toBeUndefined()
    expect(getGltfEnumLabel('mode', 99)).toBeUndefined()
  })
})
