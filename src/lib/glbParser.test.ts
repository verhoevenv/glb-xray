import { describe, it, expect } from 'vitest'
import {
  parseGlb,
  parseFile,
  formatBytes,
  GlbParseError,
  GLB_MAGIC,
  B3DM_MAGIC,
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

// ── B3DM helpers ──────────────────────────────────────────────────────────────

function writeUint32LE_b(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

/**
 * Build a minimal valid B3DM buffer wrapping an embedded GLB.
 *
 * @param featureTableJSON  Object to embed as feature table JSON (must include BATCH_LENGTH).
 * @param batchTableJSON    Object to embed as batch table JSON, or null to omit.
 * @param glbBuf            The GLB buffer to embed.
 */
function buildB3dm(
  featureTableJSON: Record<string, unknown>,
  batchTableJSON: Record<string, unknown> | null,
  glbBuf: ArrayBuffer,
): ArrayBuffer {
  const encoder = new TextEncoder()

  const ftJsonBytes = encoder.encode(JSON.stringify(featureTableJSON))
  const ftJsonPadded = Math.ceil(ftJsonBytes.length / 4) * 4
  const ftJsonPaddedBytes = new Uint8Array(ftJsonPadded)
  ftJsonPaddedBytes.set(ftJsonBytes)
  for (let i = ftJsonBytes.length; i < ftJsonPadded; i++) ftJsonPaddedBytes[i] = 0x20

  let btJsonPaddedBytes = new Uint8Array(0)
  if (batchTableJSON !== null) {
    const btJsonBytes = encoder.encode(JSON.stringify(batchTableJSON))
    const btJsonPadded = Math.ceil(btJsonBytes.length / 4) * 4
    btJsonPaddedBytes = new Uint8Array(btJsonPadded)
    btJsonPaddedBytes.set(btJsonBytes)
    for (let i = btJsonBytes.length; i < btJsonPadded; i++) btJsonPaddedBytes[i] = 0x20
  }

  const totalLength = 28 + ftJsonPaddedBytes.length + btJsonPaddedBytes.length + glbBuf.byteLength
  const buf = new ArrayBuffer(totalLength)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  writeUint32LE_b(view, 0, B3DM_MAGIC)
  writeUint32LE_b(view, 4, 1)
  writeUint32LE_b(view, 8, totalLength)
  writeUint32LE_b(view, 12, ftJsonPaddedBytes.length)
  writeUint32LE_b(view, 16, 0) // featureTableBinaryByteLength
  writeUint32LE_b(view, 20, btJsonPaddedBytes.length)
  writeUint32LE_b(view, 24, 0) // batchTableBinaryByteLength

  bytes.set(ftJsonPaddedBytes, 28)
  bytes.set(btJsonPaddedBytes, 28 + ftJsonPaddedBytes.length)
  bytes.set(new Uint8Array(glbBuf), 28 + ftJsonPaddedBytes.length + btJsonPaddedBytes.length)

  return buf
}

// ── parseFile ─────────────────────────────────────────────────────────────────

describe('parseFile', () => {
  it('dispatches to GLB parser for a GLB buffer', () => {
    const buf = buildGlb('{"asset":{"version":"2.0"}}')
    const result = parseFile(buf)
    expect(result.fileType).toBe('glb')
    expect(result.glb.header.magic).toBe(GLB_MAGIC)
    expect(result.b3dm).toBeUndefined()
  })

  it('dispatches to B3DM parser for a B3DM buffer', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 3 }, null, glbBuf)
    const result = parseFile(b3dmBuf)
    expect(result.fileType).toBe('b3dm')
    expect(result.b3dm).toBeDefined()
  })
})

// ── parseB3dm (via parseFile) ─────────────────────────────────────────────────

describe('parseB3dm', () => {
  it('parses header fields correctly', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 5 }, null, glbBuf)
    const result = parseFile(b3dmBuf)
    const b3dm = result.b3dm!

    expect(b3dm.header.version).toBe(1)
    expect(b3dm.header.byteLength).toBe(b3dmBuf.byteLength)
    expect(b3dm.header.batchTableBinaryByteLength).toBe(0)
  })

  it('reads BATCH_LENGTH from featureTableJSON', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 7 }, null, glbBuf)
    const result = parseFile(b3dmBuf)
    expect(result.b3dm!.batchLength).toBe(7)
  })

  it('defaults batchLength to 0 when BATCH_LENGTH is absent', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const b3dmBuf = buildB3dm({}, null, glbBuf)
    const result = parseFile(b3dmBuf)
    expect(result.b3dm!.batchLength).toBe(0)
  })

  it('sets batchTableJSON to null when batch table is omitted', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 2 }, null, glbBuf)
    const result = parseFile(b3dmBuf)
    expect(result.b3dm!.batchTableJSON).toBeNull()
  })

  it('parses batch table JSON when present', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const batchTable = { name: ['a', 'b'], height: [1.0, 2.0] }
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 2 }, batchTable, glbBuf)
    const result = parseFile(b3dmBuf)
    expect(result.b3dm!.batchTableJSON).toEqual(batchTable)
  })

  it('successfully parses the embedded GLB', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"},"meshes":[]}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 1 }, null, glbBuf)
    const result = parseFile(b3dmBuf)
    expect(result.glb.json).toEqual({ asset: { version: '2.0' }, meshes: [] })
  })

  it('throws on buffer smaller than 28 bytes', () => {
    const tiny = new ArrayBuffer(20)
    new DataView(tiny).setUint32(0, B3DM_MAGIC, true)
    expect(() => parseFile(tiny)).toThrow(GlbParseError)
    expect(() => parseFile(tiny)).toThrow(/too small/)
  })

  it('throws on unsupported B3DM version', () => {
    const glbBuf = buildGlb('{}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 0 }, null, glbBuf)
    new DataView(b3dmBuf).setUint32(4, 2, true) // set version to 2
    expect(() => parseFile(b3dmBuf)).toThrow(/version/)
  })

  it('warns and trims when B3DM buffer has trailing padding beyond GLB declared length', () => {
    const glbBuf = buildGlb('{"asset":{"version":"2.0"}}')
    const b3dmBuf = buildB3dm({ BATCH_LENGTH: 1 }, null, glbBuf)

    // Append 4 extra zero bytes beyond b3dm.byteLength
    const padded = new ArrayBuffer(b3dmBuf.byteLength + 4)
    new Uint8Array(padded).set(new Uint8Array(b3dmBuf))

    const result = parseFile(padded)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toMatch(/trailing padding/)
    expect(result.glb.json).toMatchObject({ asset: { version: '2.0' } })
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
