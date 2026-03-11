import { describe, it, expect } from 'vitest'
import { valueMatchesSearch, getMatchingPaths } from './jsonSearch'

describe('valueMatchesSearch', () => {
  it('returns true for empty query', () => {
    expect(valueMatchesSearch({ a: 1 }, '')).toBe(true)
  })

  it('matches a top-level string value', () => {
    expect(valueMatchesSearch({ name: 'Cube' }, 'cube')).toBe(true)
  })

  it('does not match object keys (only values)', () => {
    expect(valueMatchesSearch({ meshes: [] }, 'mesh')).toBe(false)
  })

  it('matches a nested string value', () => {
    expect(valueMatchesSearch({ asset: { generator: 'Blender' } }, 'blend')).toBe(true)
  })

  it('matches a number value', () => {
    expect(valueMatchesSearch({ count: 42 }, '42')).toBe(true)
  })

  it('matches null', () => {
    expect(valueMatchesSearch(null, 'null')).toBe(true)
  })

  it('matches boolean', () => {
    expect(valueMatchesSearch(true, 'true')).toBe(true)
    expect(valueMatchesSearch(false, 'false')).toBe(true)
  })

  it('matches inside arrays', () => {
    expect(valueMatchesSearch([{ name: 'Sphere' }, { name: 'Cube' }], 'sphere')).toBe(true)
  })

  it('returns false when no match', () => {
    expect(valueMatchesSearch({ name: 'Cube' }, 'xyzzy')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(valueMatchesSearch({ name: 'CuBe' }, 'CUBE')).toBe(true)
  })
})

describe('getMatchingPaths', () => {
  it('returns empty set for empty query', () => {
    const paths = getMatchingPaths({ a: 1 }, '')
    expect(paths.size).toBe(0)
  })

  it('returns the matching leaf path', () => {
    const paths = getMatchingPaths({ name: 'Cube' }, 'cube')
    expect(paths.has('name')).toBe(true)
  })

  it('includes ancestor paths up to root', () => {
    const paths = getMatchingPaths({ asset: { generator: 'Blender' } }, 'blender')
    expect(paths.has('asset.generator')).toBe(true)
    expect(paths.has('asset')).toBe(true)
    expect(paths.has('')).toBe(true)
  })

  it('matches key names', () => {
    const paths = getMatchingPaths({ meshes: [{ name: 'X' }] }, 'mesh')
    expect(paths.has('meshes')).toBe(true)
  })

  it('matches array element paths', () => {
    const paths = getMatchingPaths({ items: ['alpha', 'beta'] }, 'alpha')
    expect(paths.has('items[0]')).toBe(true)
    expect(paths.has('items')).toBe(true)
  })

  it('does not include non-matching sibling paths', () => {
    const paths = getMatchingPaths({ a: 'match', b: 'other' }, 'match')
    expect(paths.has('a')).toBe(true)
    expect(paths.has('b')).toBe(false)
  })
})
