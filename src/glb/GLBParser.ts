import type { GLTFRoot } from "./GLTF.ts";
import { annotate } from "./GLTFAnnotator.ts";

function parseGLB(b: ArrayBuffer): GLTFRoot | string {
  const dataView = new DataView(b);
  const magic = dataView.getUint32(0, true);
  if (magic !== 0x46546c67) {
    return `invalid magic bytes: ${magic}`;
  }
  const gltfVersion = dataView.getUint32(4, true);
  if (gltfVersion !== 2) {
    return `invalid version (only 2 is supported): ${gltfVersion}`;
  }
  // const totalLength = dataView.getUint32(8, true);

  const jsonLength = dataView.getUint32(12, true);
  // const jsonType = dataView.getUint32(16, true);
  const jsonData = b.slice(20, 20 + jsonLength);

  const gltfJson = new TextDecoder().decode(jsonData);

  return annotate(gltfJson);
}

export const GLBParser = {
  parseGLB,
};
