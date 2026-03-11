import { describe, it, expect } from 'vitest'
import {
  parseGlb,
  formatBytes,
  GlbParseError,
  GLB_MAGIC,
  CHUNK_TYPE_JSON,
  CHUNK_TYPE_BIN,
} from './glbParser'

// ── helpers ───────────────────────────────────────────────────────────────────

function writeUint32LE(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

/**
 * Build a minimal valid GLB buffer.
 *
 * @param jsonPayload  The text to embed in the JSON chunk (padded to 4-byte alignment).
 * @param includeBin   When true a 4-byte BIN chunk is appended.
 */
function buildGlb(jsonPayload: string, includeBin = false): ArrayBuffer {
  const encoder = new TextEncoder()
  let jsonBytes = encoder.encode(jsonPayload)

  // Pad JSON to 4-byte boundary with spaces (spec §4.4)
  const jsonPadded = Math.ceil(jsonBytes.length / 4) * 4
  const padded = new Uint8Array(jsonPadded)
  padded.set(jsonBytes)
  for (let i = jsonBytes.length; i < jsonPadded; i++) padded[i] = 0x20
  jsonBytes = padded

  const binLength = includeBin ? 4 : 0
  const totalLength =
    12 + // header
    8 + jsonBytes.length + // JSON chunk header + data
    (includeBin ? 8 + binLength : 0) // optional BIN chunk

  const buf = new ArrayBuffer(totalLength)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // Header
  writeUint32LE(view, 0, GLB_MAGIC)
  writeUint32LE(view, 4, 2)
  writeUint32LE(view, 8, totalLength)

  // JSON chunk
  writeUint32LE(view, 12, jsonBytes.length)
  writeUint32LE(view, 16, CHUNK_TYPE_JSON)
  bytes.set(jsonBytes, 20)

  if (includeBin) {
    const binOffset = 20 + jsonBytes.length
    writeUint32LE(view, binOffset, binLength)
    writeUint32LE(view, binOffset + 4, CHUNK_TYPE_BIN)
    // 4 zero bytes for bin data (already zero)
  }

  return buf
}

// ── parseGlb ─────────────────────────────────────────────────────────────────

describe('parseGlb', () => {
  it('parses a minimal GLB with only a JSON chunk', () => {
    const buf = buildGlb('{"asset":{"version":"2.0"}}')
    const result = parseGlb(buf)

    expect(result.header.magic).toBe(GLB_MAGIC)
    expect(result.header.version).toBe(2)
    expect(result.chunks).toHaveLength(1)
    expect(result.chunks[0].typeName).toBe('JSON')
    expect(result.json).toEqual({ asset: { version: '2.0' } })
    expect(result.hasBinaryChunk).toBe(false)
    expect(result.binaryByteLength).toBe(0)
  })

  it('parses a GLB that includes a BIN chunk', () => {
    const buf = buildGlb('{"asset":{"version":"2.0"}}', true)
    const result = parseGlb(buf)

    expect(result.chunks).toHaveLength(2)
    expect(result.hasBinaryChunk).toBe(true)
    expect(result.binaryByteLength).toBe(4)
  })

  it('exposes the raw jsonText', () => {
    const json = '{"asset":{"version":"2.0"}}'
    const buf = buildGlb(json)
    const result = parseGlb(buf)
    // trimEnd removes padding spaces
    expect(result.jsonText).toBe(json)
  })

  it('throws when buffer is smaller than 12 bytes', () => {
    expect(() => parseGlb(new ArrayBuffer(8))).toThrow(GlbParseError)
    expect(() => parseGlb(new ArrayBuffer(8))).toThrow(/too small/)
  })

  it('throws on wrong magic number', () => {
    const buf = buildGlb('{}')
    new DataView(buf).setUint32(0, 0xdeadbeef, true)
    expect(() => parseGlb(buf)).toThrow(/magic/)
  })

  it('throws on unsupported version', () => {
    const buf = buildGlb('{}')
    new DataView(buf).setUint32(4, 1, true)
    expect(() => parseGlb(buf)).toThrow(/version/)
  })

  it('throws when declared length does not match buffer size', () => {
    const buf = buildGlb('{}')
    new DataView(buf).setUint32(8, 9999, true)
    expect(() => parseGlb(buf)).toThrow(/length mismatch/)
  })

  it('throws when a chunk extends beyond end of file', () => {
    const buf = buildGlb('{}')
    // Set the JSON chunk length to something huge
    new DataView(buf).setUint32(12, 999999, true)
    expect(() => parseGlb(buf)).toThrow(/extends beyond/)
  })

  it('throws when JSON chunk contains invalid JSON', () => {
    // The chunk length must match, so build with raw bytes
    const invalid = '   not json   '
    const enc = new TextEncoder().encode(invalid)
    const padded = Math.ceil(enc.length / 4) * 4
    const total = 12 + 8 + padded
    const raw = new ArrayBuffer(total)
    const v = new DataView(raw)
    const u = new Uint8Array(raw)
    v.setUint32(0, GLB_MAGIC, true)
    v.setUint32(4, 2, true)
    v.setUint32(8, total, true)
    v.setUint32(12, padded, true)
    v.setUint32(16, CHUNK_TYPE_JSON, true)
    u.set(enc, 20)
    expect(() => parseGlb(raw)).toThrow(/Failed to parse JSON/)
  })

  it('throws when no JSON chunk is present', () => {
    // Build a buffer with only a BIN chunk
    const binData = new Uint8Array([0, 0, 0, 0])
    const total = 12 + 8 + 4
    const buf = new ArrayBuffer(total)
    const v = new DataView(buf)
    const u = new Uint8Array(buf)
    v.setUint32(0, GLB_MAGIC, true)
    v.setUint32(4, 2, true)
    v.setUint32(8, total, true)
    v.setUint32(12, 4, true)
    v.setUint32(16, CHUNK_TYPE_BIN, true)
    u.set(binData, 20)
    expect(() => parseGlb(buf)).toThrow(/No JSON chunk/)
  })
})

// ── formatBytes ───────────────────────────────────────────────────────────────

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats bytes under 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats exact kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('formats fractional kilobytes', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
  })
})
