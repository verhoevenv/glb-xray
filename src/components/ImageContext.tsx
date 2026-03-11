import { createContext } from 'react'

export interface ImageContextValue {
  binChunk: Uint8Array | null
  glbJson: Record<string, unknown> | null
}

export const ImageContext = createContext<ImageContextValue>({ binChunk: null, glbJson: null })
