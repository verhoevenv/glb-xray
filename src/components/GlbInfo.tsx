import type { ParseResult } from '../lib/glbParser'
import { formatBytes } from '../lib/glbParser'
import styles from './GlbInfo.module.css'

interface GlbInfoProps {
  result: ParseResult
  fileName: string
}

export function GlbInfo({ result, fileName }: GlbInfoProps) {
  const { header, chunks, hasBinaryChunk, binaryByteLength } = result.glb
  const b3dm = result.b3dm

  const fileSize = result.fileType === 'b3dm'
    ? b3dm!.header.byteLength
    : header.length

  return (
    <div className={styles.panel}>
      <h2 className={styles.filename}>{fileName}</h2>
      <dl className={styles.meta}>
        <dt>File type</dt>
        <dd>{result.fileType === 'b3dm' ? 'B3DM' : 'GLB'}</dd>

        <dt>File size</dt>
        <dd>{formatBytes(fileSize)}</dd>

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

        {result.fileType === 'b3dm' && b3dm && (
          <>
            <dt>B3DM version</dt>
            <dd>{b3dm.header.version}</dd>

            <dt>Batch length</dt>
            <dd>{b3dm.batchLength}</dd>

            {b3dm.batchTableJSON !== null && (
              <>
                <dt>Batch Table</dt>
                <dd>
                  {(() => {
                    const props = Object.keys(b3dm.batchTableJSON!)
                    return (
                      <>
                        {props.length} {props.length === 1 ? 'property' : 'properties'}: {props.join(', ')}
                        {b3dm.batchTableBinaryByteLength > 0 && (
                          <> (binary body: {formatBytes(b3dm.batchTableBinaryByteLength)})</>
                        )}
                      </>
                    )
                  })()}
                </dd>
              </>
            )}
          </>
        )}
      </dl>

      {result.warnings.length > 0 && (
        <ul className={styles.warnings}>
          {result.warnings.map((w, i) => (
            <li key={i} className={styles.warningItem}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
