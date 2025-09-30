import type {GLTFNode} from "./GLTF.ts";
import {SourcePath} from "../annotation/AnnotatedSource.ts";

interface Props {
  name: string;
  gltf: GLTFNode;
  highlighted: SourcePath | null;
  onOpen: () => void;
}

function GltfHiddenNode({
  name,
  gltf,
  highlighted,
  onOpen
}: Props) {
  const shouldHighlight = highlighted && (name === highlighted.elements[0]);
  const className = shouldHighlight ? "hiddenNode highlighted" : "hiddenNode";
  const sourceAsString = gltf.annotatedSource.map(frag => frag.content).join("\n");
  return (
    <div key={name} className={className} onClick={onOpen} title={sourceAsString}>
      {name}
    </div>
  );
}

export default GltfHiddenNode;
