import { describe, it, expect } from 'vitest'
import { isDataUri, mimeFromDataUri, decodeDataUri } from './dataUri'

describe('isDataUri', () => {
  it('returns true for data: URIs', () => {
    expect(isDataUri('data:image/png;base64,abc')).toBe(true)
    expect(isDataUri('data:application/octet-stream;base64,xyz')).toBe(true)
  })

  it('returns false for https URLs', () => {
    expect(isDataUri('https://example.com/image.png')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isDataUri('')).toBe(false)
  })
})

describe('mimeFromDataUri', () => {
  it('extracts image/png', () => {
    expect(mimeFromDataUri('data:image/png;base64,abc')).toBe('image/png')
  })

  it('extracts application/octet-stream', () => {
    expect(mimeFromDataUri('data:application/octet-stream;base64,xyz')).toBe('application/octet-stream')
  })
})

describe('decodeDataUri', () => {
  it('round-trips a known byte array', () => {
    const original = new Uint8Array([1, 2, 3, 255, 0, 128])
    // encode to base64
    let binary = ''
    original.forEach(b => binary += String.fromCharCode(b))
    const b64 = btoa(binary)
    const dataUri = `data:application/octet-stream;base64,${b64}`

    const result = decodeDataUri(dataUri)
    expect(result).toEqual(original)
  })
})
