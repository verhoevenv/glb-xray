import { describe, it, expect } from 'vitest'
import { isDataUri, mimeFromDataUri, decodeDataUri, formatBytes, dataUriDecodedSize } from './dataUri'

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

describe('formatBytes', () => {
  it('formats bytes under 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats KB with 1 decimal', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1023)).toBe('1023.0 KB')
  })

  it('formats MB with 1 decimal', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB')
  })
})

describe('dataUriDecodedSize', () => {
  it('computes decoded size matching actual decode length', () => {
    const original = new Uint8Array([1, 2, 3, 255, 0, 128])
    let binary = ''
    original.forEach(b => binary += String.fromCharCode(b))
    const b64 = btoa(binary)
    const dataUri = `data:application/octet-stream;base64,${b64}`
    expect(dataUriDecodedSize(dataUri)).toBe(original.length)
  })

  it('handles no padding', () => {
    // 3 bytes → 4 base64 chars, no padding
    const b64 = btoa('\x01\x02\x03')
    expect(dataUriDecodedSize(`data:x;base64,${b64}`)).toBe(3)
  })

  it('handles single = padding', () => {
    // 2 bytes → 4 base64 chars with one =
    const b64 = btoa('\x01\x02')
    expect(dataUriDecodedSize(`data:x;base64,${b64}`)).toBe(2)
  })

  it('handles double == padding', () => {
    // 1 byte → 4 base64 chars with two ==
    const b64 = btoa('\x01')
    expect(dataUriDecodedSize(`data:x;base64,${b64}`)).toBe(1)
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
