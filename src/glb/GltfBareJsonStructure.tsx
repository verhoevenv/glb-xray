import type { GLTFNode } from "./GLTF.ts";
import GltfLine from "./GltfLine.tsx";

interface GltfStructureProps {
  name: string;
  gltf: GLTFNode;
  highlighted: string[] | null;
  setHighlighted: (name: string[] | null) => void;
}

function GltfBareJsonStructure({
  gltf,
  name,
  highlighted,
  setHighlighted,
}: GltfStructureProps) {
  const source = gltf.annotatedSource;
  const lines = source.map((line, idx) => {
    return (
      <GltfLine
        key={idx}
        content={line.content}
        onMouseEnter={() => setHighlighted(line.refersTo)}
        onMouseLeave={() => setHighlighted(null)}
        path={line.path}
        highlighted={highlighted}
      />
    );
  });
  return (
    <div key={name} className="gltfNode">
      <h2>{name}</h2>
      {lines}
    </div>
  );
}

export default GltfBareJsonStructure;
