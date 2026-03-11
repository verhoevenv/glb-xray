export const GLB_MAGIC = 0x46546c67 // "glTF"
export const GLB_VERSION = 2
export const CHUNK_TYPE_JSON = 0x4e4f534a // "JSON"
export const CHUNK_TYPE_BIN = 0x004e4942  // "BIN\0"
export const B3DM_MAGIC = 0x6d643362     // "b3dm"

export interface GlbHeader {
  magic: number
  version: number
  length: number
}

export interface GlbChunk {
  length: number
  type: number
  typeName: string
  data: Uint8Array
}

export interface GlbParseResult {
  header: GlbHeader
  chunks: GlbChunk[]
  json: Record<string, unknown>
  jsonText: string
  hasBinaryChunk: boolean
  binaryByteLength: number
}

export interface B3dmHeader {
  version: number
  byteLength: number
  featureTableJSONByteLength: number
  featureTableBinaryByteLength: number
  batchTableJSONByteLength: number
  batchTableBinaryByteLength: number
}

export interface B3dmInfo {
  header: B3dmHeader
  featureTableJSON: Record<string, unknown>
  batchTableJSON: Record<string, unknown> | null
  batchTableBinaryByteLength: number
  batchLength: number
}

export interface ParseResult {
  fileType: 'glb' | 'b3dm'
  glb: GlbParseResult
  b3dm?: B3dmInfo
  warnings: string[]
}

export class GlbParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GlbParseError'
  }
}

function chunkTypeName(type: number): string {
  if (type === CHUNK_TYPE_JSON) return 'JSON'
  if (type === CHUNK_TYPE_BIN) return 'BIN'
  // Decode as ASCII for unknown types
  const chars = [
    type & 0xff,
    (type >> 8) & 0xff,
    (type >> 16) & 0xff,
    (type >> 24) & 0xff,
  ]
  return chars
    .map(c => (c >= 0x20 && c < 0x7f ? String.fromCharCode(c) : '?'))
    .join('')
}

export function parseGlb(buffer: ArrayBuffer): GlbParseResult {
  if (buffer.byteLength < 12) {
    throw new GlbParseError(
      `File too small: ${buffer.byteLength} bytes (minimum 12)`
    )
  }

  const view = new DataView(buffer)

  const magic = view.getUint32(0, true)
  if (magic !== GLB_MAGIC) {
    throw new GlbParseError(
      `Invalid magic number: expected 0x${GLB_MAGIC.toString(16)}, got 0x${magic.toString(16)}`
    )
  }

  const version = view.getUint32(4, true)
  if (version !== GLB_VERSION) {
    throw new GlbParseError(
      `Unsupported GLB version: ${version} (only version 2 is supported)`
    )
  }

  const length = view.getUint32(8, true)
  if (length !== buffer.byteLength) {
    throw new GlbParseError(
      `File length mismatch: header says ${length}, actual ${buffer.byteLength}`
    )
  }

  const header: GlbHeader = { magic, version, length }
  const chunks: GlbChunk[] = []

  let offset = 12
  while (offset + 8 <= buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true)
    const chunkType = view.getUint32(offset + 4, true)
    const dataOffset = offset + 8

    if (dataOffset + chunkLength > buffer.byteLength) {
      throw new GlbParseError(
        `Chunk at offset ${offset} extends beyond end of file`
      )
    }

    const data = new Uint8Array(buffer, dataOffset, chunkLength)
    chunks.push({ length: chunkLength, type: chunkType, typeName: chunkTypeName(chunkType), data })
    offset = dataOffset + chunkLength
  }

  const jsonChunk = chunks.find(c => c.type === CHUNK_TYPE_JSON)
  if (!jsonChunk) {
    throw new GlbParseError('No JSON chunk found in GLB file')
  }

  const jsonText = new TextDecoder().decode(jsonChunk.data).trimEnd()
  let json: Record<string, unknown>
  try {
    json = JSON.parse(jsonText)
  } catch (e) {
    throw new GlbParseError(`Failed to parse JSON chunk: ${(e as Error).message}`)
  }

  const binChunk = chunks.find(c => c.type === CHUNK_TYPE_BIN)

  return {
    header,
    chunks,
    json,
    jsonText,
    hasBinaryChunk: binChunk !== undefined,
    binaryByteLength: binChunk?.length ?? 0,
  }
}

function parseB3dm(buffer: ArrayBuffer): ParseResult {
  if (buffer.byteLength < 28) {
    throw new GlbParseError(`B3DM file too small: ${buffer.byteLength} bytes (minimum 28)`)
  }

  const view = new DataView(buffer)
  const magic = view.getUint32(0, true)
  if (magic !== B3DM_MAGIC) {
    throw new GlbParseError(`Invalid B3DM magic: 0x${magic.toString(16)}`)
  }

  const version = view.getUint32(4, true)
  if (version !== 1) {
    throw new GlbParseError(`Unsupported B3DM version: ${version} (only version 1 is supported)`)
  }

  const byteLength = view.getUint32(8, true)
  const featureTableJSONByteLength = view.getUint32(12, true)
  const featureTableBinaryByteLength = view.getUint32(16, true)
  const batchTableJSONByteLength = view.getUint32(20, true)
  const batchTableBinaryByteLength = view.getUint32(24, true)

  const header: B3dmHeader = {
    version,
    byteLength,
    featureTableJSONByteLength,
    featureTableBinaryByteLength,
    batchTableJSONByteLength,
    batchTableBinaryByteLength,
  }

  const featureTableJSONStart = 28
  const featureTableBinaryStart = featureTableJSONStart + featureTableJSONByteLength
  const batchTableJSONStart = featureTableBinaryStart + featureTableBinaryByteLength
  const batchTableBinaryStart = batchTableJSONStart + batchTableJSONByteLength
  const glbStart = batchTableBinaryStart + batchTableBinaryByteLength

  const decoder = new TextDecoder()

  let featureTableJSON: Record<string, unknown> = {}
  if (featureTableJSONByteLength > 0) {
    const bytes = new Uint8Array(buffer, featureTableJSONStart, featureTableJSONByteLength)
    featureTableJSON = JSON.parse(decoder.decode(bytes).trimEnd())
  }

  let batchTableJSON: Record<string, unknown> | null = null
  if (batchTableJSONByteLength > 0) {
    const bytes = new Uint8Array(buffer, batchTableJSONStart, batchTableJSONByteLength)
    batchTableJSON = JSON.parse(decoder.decode(bytes).trimEnd())
  }

  const warnings: string[] = []
  let glbBuffer = buffer.slice(glbStart)

  if (glbBuffer.byteLength >= 12) {
    const glbDeclaredLength = new DataView(glbBuffer).getUint32(8, true)
    if (glbBuffer.byteLength > glbDeclaredLength) {
      const excess = glbBuffer.byteLength - glbDeclaredLength
      warnings.push(
        `Embedded GLB has ${excess} trailing padding byte${excess === 1 ? '' : 's'} — truncated to declared length (${glbDeclaredLength} bytes).`
      )
      glbBuffer = glbBuffer.slice(0, glbDeclaredLength)
    }
  }

  const glbResult = parseGlb(glbBuffer)

  const batchLength = typeof featureTableJSON.BATCH_LENGTH === 'number'
    ? featureTableJSON.BATCH_LENGTH
    : 0

  return {
    fileType: 'b3dm',
    glb: glbResult,
    b3dm: {
      header,
      featureTableJSON,
      batchTableJSON,
      batchTableBinaryByteLength,
      batchLength,
    },
    warnings,
  }
}

export function parseFile(buffer: ArrayBuffer): ParseResult {
  const view = new DataView(buffer)
  const magic = view.getUint32(0, true)
  if (magic === B3DM_MAGIC) return parseB3dm(buffer)
  return { fileType: 'glb', glb: parseGlb(buffer), warnings: [] }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  const formatted = value % 1 === 0 ? String(value) : parseFloat(value.toFixed(2)).toString()
  return `${formatted} ${units[i]}`
}
