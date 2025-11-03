import type { GLTFNode } from "./GLTF.ts";
import GltfLine from "./GltfLine.tsx";

import {SourcePath} from "../annotation/SourcePath.ts";

interface Props {
  name: string;
  gltf: GLTFNode;
  highlighted: SourcePath | undefined;
  setHighlighted: (name: SourcePath | undefined) => void;
  onClose: () => void;
}

function GltfBareJsonStructure({
  gltf,
  name,
  highlighted,
  setHighlighted,
  onClose,
}: Props) {
  const source = gltf.annotatedSource;
  const lines = source.map((line, idx) => {
    return (
      <GltfLine
        key={idx}
        fragment={line}
        highlighted={highlighted}
        setHighlighted={setHighlighted}
      />
    );
  });
  return (
    <div key={name} className="gltfNode">
      <h2 onClick={onClose}>{name}</h2>
      {lines}
    </div>
  );
}

export default GltfBareJsonStructure;
