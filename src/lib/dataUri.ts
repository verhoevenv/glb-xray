export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function dataUriDecodedSize(s: string): number {
  const comma = s.indexOf(',')
  const b64 = comma === -1 ? s : s.slice(comma + 1)
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor(b64.length * 3 / 4) - padding
}

export function isDataUri(s: string): boolean {
  return s.startsWith('data:')
}

export function mimeFromDataUri(s: string): string {
  // data:<mime>;base64,...
  const semi = s.indexOf(';')
  return semi === -1 ? '' : s.slice(5, semi)
}

export function decodeDataUri(s: string): Uint8Array {
  const comma = s.indexOf(',')
  const b64 = comma === -1 ? s : s.slice(comma + 1)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
