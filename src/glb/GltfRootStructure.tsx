import type { GLTFRoot } from "./GLTF.ts";
import GltfBareJsonStructure from "./GltfBareJsonStructure.tsx";
import { useState } from "react";

interface GltfStructureProps {
  gltf: GLTFRoot;
}

const preferredOrder = [
  "asset",
  "scene",
  "scenes",
  "nodes",
  "meshes",
  "materials",
  "textures",
  "images",
  "accessors",
  "bufferViews",
  "buffers",
];

function sortAttributes(nodes: { name: string }[]) {
  nodes.sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.name);
    const bIndex = preferredOrder.indexOf(b.name);
    if (aIndex < 0) {
      return 1;
    } else if (bIndex < 0) {
      return -1;
    }
    return aIndex - bIndex;
  });
}

function GltfRootStructure({ gltf }: GltfStructureProps) {
  const [highlighted, setHighlighted] = useState<string[] | null>(null);

  const children = [];
  let gltfElement: keyof GLTFRoot;
  for (gltfElement in gltf) {
    const attribute = gltf[gltfElement];
    if (attribute) {
      children.push({
        name: gltfElement,
        node: attribute,
      });
    }
  }

  sortAttributes(children);

  const listItems = children.map((child) => {
    return (
      <GltfBareJsonStructure
        key={child.name}
        gltf={child.node}
        name={child.name}
        highlighted={highlighted}
        setHighlighted={setHighlighted}
      />
    );
  });

  return <div className="gltfRoot">{listItems}</div>;
}

export default GltfRootStructure;
