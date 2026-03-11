import { useState, useCallback } from 'react'
import { Dropzone } from './components/Dropzone'
import { JsonTree } from './components/JsonTree'
import { GlbInfo } from './components/GlbInfo'
import { parseGlb, CHUNK_TYPE_BIN, type GlbParseResult } from './lib/glbParser'
import styles from './App.module.css'

interface LoadedFile {
  name: string
  result: GlbParseResult
}

export function App() {
  const [loaded, setLoaded] = useState<LoadedFile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback((file: File) => {
    setError(null)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const buffer = e.target!.result as ArrayBuffer
        const result = parseGlb(buffer)
        setLoaded({ name: file.name, result })
      } catch (err) {
        setError((err as Error).message)
        setLoaded(null)
      } finally {
        setLoading(false)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file.')
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleReset = () => {
    setLoaded(null)
    setError(null)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.logo}>GLB X-Ray</span>
        {loaded && (
          <button className={styles.openAnother} onClick={handleReset}>
            Open another file
          </button>
        )}
      </header>

      <main className={styles.main}>
        {!loaded && !loading && (
          <div className={styles.landing}>
            <Dropzone onFile={handleFile} />
            {error && (
              <div className={styles.error} role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className={styles.loading} aria-live="polite">
            Parsing…
          </div>
        )}

        {loaded && (
          <div className={styles.inspector}>
            <aside className={styles.sidebar}>
              <GlbInfo result={loaded.result} fileName={loaded.name} />
            </aside>
            <section className={styles.treePanel}>
              <JsonTree
                key={loaded.name}
                data={loaded.result.json}
                binChunk={loaded.result.chunks.find(c => c.type === CHUNK_TYPE_BIN)?.data ?? null}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
