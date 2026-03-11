import { createContext } from 'react'

export interface ImageContextValue {
  binChunk: Uint8Array | null
  glbJson: Record<string, unknown> | null
  extraBuffers: Map<number, Uint8Array>
}

export const ImageContext = createContext<ImageContextValue>({
  binChunk: null,
  glbJson: null,
  extraBuffers: new Map(),
})
