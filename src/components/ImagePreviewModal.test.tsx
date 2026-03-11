import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImagePreviewModal } from './ImagePreviewModal'
import { ImageContext, type ImageContextValue } from './ImageContext'

// Encode a minimal 1x1 PNG as base64 for testing
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
])
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}
const PNG_DATA_URI = `data:image/png;base64,${toBase64(PNG_BYTES)}`

const MOCK_URL = 'blob:mock-url'
beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => MOCK_URL),
    revokeObjectURL: vi.fn(),
  })
})

function renderModal(ctx: ImageContextValue, imageIndex = 0) {
  return render(
    <ImageContext.Provider value={ctx}>
      <ImagePreviewModal imageIndex={imageIndex} onClose={() => {}} />
    </ImageContext.Provider>
  )
}

describe('ImagePreviewModal – data URI image', () => {
  it('renders img when image has a data URI uri', async () => {
    const ctx: ImageContextValue = {
      binChunk: null,
      glbJson: {
        images: [{ uri: PNG_DATA_URI }],
      },
      extraBuffers: new Map(),
    }
    renderModal(ctx)
    const img = await screen.findByRole('img')
    expect(img).toHaveAttribute('src', MOCK_URL)
  })
})

describe('ImagePreviewModal – bufferView referencing extraBuffers', () => {
  it('renders img when image bufferView references buffer 1 in extraBuffers', async () => {
    const imageBytes = new Uint8Array([10, 20, 30])
    const extraBuf = new Uint8Array(imageBytes.length)
    extraBuf.set(imageBytes)

    const ctx: ImageContextValue = {
      binChunk: null,
      glbJson: {
        images: [{ bufferView: 0, mimeType: 'image/jpeg' }],
        bufferViews: [{ buffer: 1, byteOffset: 0, byteLength: 3 }],
      },
      extraBuffers: new Map([[1, extraBuf]]),
    }
    renderModal(ctx)
    const img = await screen.findByRole('img')
    expect(img).toHaveAttribute('src', MOCK_URL)
  })
})

describe('ImagePreviewModal – bufferView referencing binChunk (regression)', () => {
  it('renders img when image bufferView references buffer 0 (binChunk)', async () => {
    const imageBytes = new Uint8Array([10, 20, 30])
    const binChunk = new Uint8Array(imageBytes.length)
    binChunk.set(imageBytes)

    const ctx: ImageContextValue = {
      binChunk,
      glbJson: {
        images: [{ bufferView: 0, mimeType: 'image/jpeg' }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 3 }],
      },
      extraBuffers: new Map(),
    }
    renderModal(ctx)
    const img = await screen.findByRole('img')
    expect(img).toHaveAttribute('src', MOCK_URL)
  })
})

describe('ImagePreviewModal – missing buffer', () => {
  it('shows error when buffer is not available', async () => {
    const ctx: ImageContextValue = {
      binChunk: null,
      glbJson: {
        images: [{ bufferView: 0, mimeType: 'image/jpeg' }],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 3 }],
      },
      extraBuffers: new Map(),
    }
    renderModal(ctx)
    const error = await screen.findByText(/buffer 0 not available/i)
    expect(error).toBeInTheDocument()
  })
})
