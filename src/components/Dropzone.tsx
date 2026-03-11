import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import styles from './Dropzone.module.css'

interface DropzoneProps {
  onFile: (file: File) => void
  accept?: string
}

export function Dropzone({ onFile, accept = '.glb,.b3dm' }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    // reset so the same file can be re-opened
    e.target.value = ''
  }

  return (
    <div
      className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Open GLB or B3DM file"
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.input}
        onChange={handleChange}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className={styles.icon}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <p className={styles.primary}>Drop a GLB or B3DM file here</p>
      <p className={styles.secondary}>or click to browse</p>
    </div>
  )
}
