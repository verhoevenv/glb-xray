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
  highlighted,
  onOpen
}: Props) {
  const shouldHighlight = highlighted && (name === highlighted.elements[0]);
  const className = shouldHighlight ? "hiddenNode highlighted" : "hiddenNode";
  // TODO show source on hover?
  return (
    <div key={name} className={className} onClick={onOpen}>
      {name}
    </div>
  );
}

export default GltfHiddenNode;
