import { useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImageContext } from './ImageContext'
import { isDataUri, mimeFromDataUri, decodeDataUri } from '../lib/dataUri'
import styles from './ImagePreviewModal.module.css'

interface ImagePreviewModalProps {
  imageIndex: number
  onClose: () => void
}

function extFromMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

export function ImagePreviewModal({ imageIndex, onClose }: ImagePreviewModalProps) {
  const { binChunk, glbJson, extraBuffers } = useContext(ImageContext)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      if (!glbJson) throw new Error('No JSON data available')

      const images = glbJson.images as Array<Record<string, unknown>> | undefined
      const image = images?.[imageIndex]
      if (!image) throw new Error(`images[${imageIndex}] not found`)

      // Branch 1: image has a data URI
      if (typeof image.uri === 'string' && isDataUri(image.uri as string)) {
        const mime = mimeFromDataUri(image.uri as string)
        setMimeType(mime)
        const bytes = decodeDataUri(image.uri as string)
        const blob = new Blob([bytes], { type: mime })
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setObjectUrl(url)
        return
      }

      // Branch 2: bufferView path
      const bufferViewIndex = image.bufferView
      if (typeof bufferViewIndex !== 'number') throw new Error('Image has no bufferView (may use uri)')

      const bufferViews = glbJson.bufferViews as Array<Record<string, unknown>> | undefined
      const bufferView = bufferViews?.[bufferViewIndex]
      if (!bufferView) throw new Error(`bufferViews[${bufferViewIndex}] not found`)

      const byteOffset = (bufferView.byteOffset as number | undefined) ?? 0
      const byteLength = bufferView.byteLength as number | undefined
      if (typeof byteLength !== 'number') throw new Error('bufferView missing byteLength')

      const bufferIndex = (bufferView.buffer as number | undefined) ?? 0
      const buffer =
        (bufferIndex === 0 && binChunk) ? binChunk : (extraBuffers.get(bufferIndex) ?? null)
      if (!buffer) throw new Error(`Buffer ${bufferIndex} not available`)

      const bytes = buffer.subarray(byteOffset, byteOffset + byteLength)
      const mime = (image.mimeType as string | undefined) ?? 'image/jpeg'
      setMimeType(mime)

      const blob = new Blob([(bytes.buffer as ArrayBuffer).slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)], { type: mime })
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      setObjectUrl(url)
    } catch (err) {
      setError((err as Error).message)
    }

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [binChunk, glbJson, imageIndex, extraBuffers])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = () => {
    if (!objectUrl) return
    const ext = extFromMime(mimeType)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `image_${imageIndex}.${ext}`
    a.click()
  }

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={styles.toolbar}>
          <span className={styles.title}>image[{imageIndex}]</span>
          <div className={styles.actions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={!objectUrl}>
              Save
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <div className={styles.imageArea}>
          {error ? (
            <span className={styles.error}>{error}</span>
          ) : objectUrl ? (
            <img className={styles.image} src={objectUrl} alt={`image ${imageIndex}`} />
          ) : (
            <span className={styles.loading}>Loading…</span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
