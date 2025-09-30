import type {GLTFRoot} from "./GLTF.ts";
import GltfBareJsonStructure from "./GltfBareJsonStructure.tsx";
import {useState} from "react";
import GltfHiddenNode from "./GltfHiddenNode.tsx";
import {SourcePath} from "../annotation/AnnotatedSource.ts";

interface Props {
  gltf: GLTFRoot;
}

const initiallyHidden = new Set([
  "asset"
]);

const preferredOrder = [
  "extensionsRequired",
  "extensionsUsed",
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

function GltfRootStructure({ gltf }: Props) {
  const [highlighted, setHighlighted] = useState<SourcePath | null>(null);
  const [hiddenNodeNames, setHiddenNodeNames] = useState<Set<string>>(initiallyHidden);

  const children = [];
  for (const gltfElement in gltf) {
    const attribute = gltf[gltfElement];
    if (attribute) {
      children.push({
        name: gltfElement,
        node: attribute,
      });
    }
  }

  const hiddenChildren = [];
  for (const nodeName of hiddenNodeNames) {
    const idx = children.findIndex(v => v.name === nodeName);
    if (idx >= 0) {
      const [elem] = children.splice(idx, 1);
      hiddenChildren.push(elem);
    }
  }

  sortAttributes(children);
  sortAttributes(hiddenChildren);

  const hiddenItems = hiddenChildren.map((child) => {
    return <GltfHiddenNode
      key={child.name}
      gltf={child.node}
      name={child.name}
      highlighted={highlighted}
      onOpen={() => {
        const newHiddenNodes = new Set(hiddenNodeNames);
        newHiddenNodes.delete(child.name);
        setHiddenNodeNames(newHiddenNodes);
      }}
    />;
  });

  const listItems = children.map((child) => {
    return <GltfBareJsonStructure
      key={child.name}
      gltf={child.node}
      name={child.name}
      highlighted={highlighted}
      setHighlighted={setHighlighted}
      onClose={() => {
        const newHiddenNodes = new Set(hiddenNodeNames);
        newHiddenNodes.add(child.name);
        setHiddenNodeNames(newHiddenNodes);
      }}
    />;
  });


  return <>
          <div className="gltfRoot">{hiddenItems}</div>
          <div className="gltfRoot">{listItems}</div>
        </>;
}

export default GltfRootStructure;
