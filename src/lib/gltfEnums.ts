const GLTF_ENUMS: Record<string, Record<number, string>> = {
  componentType: {
    5120: 'BYTE',
    5121: 'UNSIGNED_BYTE',
    5122: 'SHORT',
    5123: 'UNSIGNED_SHORT',
    5125: 'UNSIGNED_INT',
    5126: 'FLOAT',
  },
  mode: {
    0: 'POINTS',
    1: 'LINES',
    2: 'LINE_LOOP',
    3: 'LINE_STRIP',
    4: 'TRIANGLES',
    5: 'TRIANGLE_STRIP',
    6: 'TRIANGLE_FAN',
  },
  target: {
    34962: 'ARRAY_BUFFER',
    34963: 'ELEMENT_ARRAY_BUFFER',
  },
  magFilter: {
    9728: 'NEAREST',
    9729: 'LINEAR',
  },
  minFilter: {
    9728: 'NEAREST',
    9729: 'LINEAR',
    9984: 'NEAREST_MIPMAP_NEAREST',
    9985: 'LINEAR_MIPMAP_NEAREST',
    9986: 'NEAREST_MIPMAP_LINEAR',
    9987: 'LINEAR_MIPMAP_LINEAR',
  },
  wrapS: {
    33071: 'CLAMP_TO_EDGE',
    33648: 'MIRRORED_REPEAT',
    10497: 'REPEAT',
  },
  wrapT: {
    33071: 'CLAMP_TO_EDGE',
    33648: 'MIRRORED_REPEAT',
    10497: 'REPEAT',
  },
}

export function getGltfEnumLabel(keyName: string, value: number): string | undefined {
  return GLTF_ENUMS[keyName]?.[value]
}
