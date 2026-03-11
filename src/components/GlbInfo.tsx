import type { GlbParseResult } from '../lib/glbParser'
import { formatBytes } from '../lib/glbParser'
import styles from './GlbInfo.module.css'

interface GlbInfoProps {
  result: GlbParseResult
  fileName: string
}

export function GlbInfo({ result, fileName }: GlbInfoProps) {
  const { header, chunks, hasBinaryChunk, binaryByteLength } = result

  return (
    <div className={styles.panel}>
      <h2 className={styles.filename}>{fileName}</h2>
      <dl className={styles.meta}>
        <dt>File size</dt>
        <dd>{formatBytes(header.length)}</dd>

        <dt>GLB version</dt>
        <dd>{header.version}</dd>

        <dt>Chunks</dt>
        <dd>
          {chunks.map((c, i) => (
            <span key={i} className={styles.chunk}>
              {c.typeName} <span className={styles.chunkSize}>({formatBytes(c.length)})</span>
            </span>
          ))}
        </dd>

        {hasBinaryChunk && (
          <>
            <dt>Binary buffer</dt>
            <dd>{formatBytes(binaryByteLength)}</dd>
          </>
        )}
      </dl>
    </div>
  )
}
