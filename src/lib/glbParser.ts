export const GLB_MAGIC = 0x46546c67 // "glTF"
export const GLB_VERSION = 2
export const CHUNK_TYPE_JSON = 0x4e4f534a // "JSON"
export const CHUNK_TYPE_BIN = 0x004e4942  // "BIN\0"

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

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  const formatted = value % 1 === 0 ? String(value) : parseFloat(value.toFixed(2)).toString()
  return `${formatted} ${units[i]}`
}
